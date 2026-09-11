# Segurança

Checklist de atenção por categoria de risco, específico para este sistema
(multi-tenant, PIN de 4 dígitos, self-hosted numa VPS, dado sensível de
pequenos negócios reais). Não é uma lista genérica de OWASP — cada item diz
*onde* no código isso se aplica.

## 1. Vazamento de dado entre tenants (o maior risco deste produto)

Um mercado nunca pode ver dado de outro. Duas camadas, nunca só uma (ver
`01-arquitetura.md` e `07-multitenant-whitelabel.md`):

- **Camada de aplicação**: todo método de `Repository` recebe `tenantId`
  como argumento obrigatório (nunca opcional, nunca "se não vier, busca
  tudo"). Nenhum `findMany` sem filtro de `tenantId` — revisar isso em code
  review é mais importante que revisar estilo.
- **Camada de banco (RLS)**: Row-Level Security no Postgres como defesa em
  profundidade — se uma query escapar do filtro de aplicação por um bug, o
  banco ainda recusa. `SET app.tenant_id` por conexão/transação, policy
  `USING (tenant_id = current_setting('app.tenant_id')::text)`.
- **Sessão nunca atravessa tenant**: o `AuthGuard` já compara
  `session.tenantId` contra o tenant resolvido pelo host a cada request
  (ver `apps/api/src/common/guards/auth.guard.ts`) — um JWT válido de um
  tenant é explicitamente rejeitado em outro, mesmo com assinatura correta.
- **Teste obrigatório**: para todo módulo novo, um teste que cria dado em
  dois tenants e prova que a query de um nunca retorna o do outro — não é
  opcional, é Definition of Done (ver `docs/scrum/SPRINTS.md`).

## 2. XSS (Cross-Site Scripting)

- React já escapa por padrão — o risco real está em qualquer lugar que
  usa `dangerouslySetInnerHTML` ou renderiza HTML vindo de dado do usuário:
  **não usar** em nenhum componente deste projeto. Se um dia for
  necessário (ex.: descrição rica de produto), sanitizar no backend antes
  de persistir (allowlist de tags), nunca confiar no frontend para isso.
- **Nome de tenant, nome de produto/operador, observação de caixa**: são
  strings livres digitadas por um Administrador — tratadas como texto puro
  na renderização (nunca interpoladas como HTML/URL sem escape).
- **CSP (Content-Security-Policy)** configurada no `apps/web` (via header
  do Next ou do Caddy) restringindo `script-src` a `'self'` — reduz o dano
  mesmo se uma injeção escapar da escapagem padrão do React.
- **Cookies de sessão são `httpOnly`** (já é a implementação atual) — um
  XSS bem-sucedido não consegue ler o token de sessão via `document.cookie`.

## 3. CSRF (Cross-Site Request Forgery)

- A sessão vive num cookie enviado automaticamente pelo browser
  (`credentials: 'include'`) — isso é justamente o vetor de CSRF se não for
  mitigado.
- Cookie de sessão com `SameSite=Lax` (ou `Strict`, testar se quebra o fluxo
  de subdomínio de tenant) — bloqueia o caso comum de CSRF cross-site.
- Mutações (`POST`/`PATCH`/`DELETE`) exigem também o header
  `Content-Type: application/json`, que um form HTML simples de outro site
  não consegue forjar sem CORS explícito — reforça o `SameSite`, não
  substitui.
- `CORS_ORIGIN` da API restrito à URL exata do `apps/web` (nunca `*` com
  `credentials: true` — combinação proibida e insegura).

## 4. Autenticação e o PIN de 4 dígitos

PIN curto é uma escolha de produto (usabilidade num tablet de mercado) —
por isso a mitigação tem que compensar isso deliberadamente, não fingir que
o PIN é uma senha forte:

- Hash com **argon2** (já implementado) — nunca texto puro, nunca hash
  rápido (MD5/SHA1/SHA256 puro).
- **Rate limit por operador** (5 tentativas / 60s, ver
  `03-regras-negocio.md` § Autenticação) — sem isso, 10.000 combinações de
  PIN são testáveis em segundos.
- **Rate limit também por IP/tenant** no endpoint de login (`@nestjs/throttler`
  já está na base do projeto) — mitiga um atacante testando vários
  operadores em sequência para contornar o rate-limit por-operador.
- Mensagem de erro de login **genérica** ("PIN incorreto") — nunca
  diferenciar "operador não existe" de "PIN errado" (evita enumeração de
  quem trabalha na loja).
- Sessão expira em 12h de inatividade (já definido) — num tablet
  compartilhado de balcão, sessão eterna é uma porta aberta física, não só
  digital.
- **Nunca expor lista de operadores fora do tenant resolvido** — o endpoint
  `GET /auth/operators` (público, mas escopado ao tenant) não pode aceitar
  um `tenantId` vindo de query param; é sempre o do host.

## 5. Negação de serviço (DDoS / abuso de endpoint)

Numa VPS única (Hostinger, sem CDN/WAF gerenciado), a mitigação é mais
manual do que seria numa nuvem grande — ser realista sobre isso:

- **Rate limiting global** (`@nestjs/throttler`, já na base) em toda rota,
  não só login — limite mais permissivo nas rotas de leitura, mais estrito
  em mutação.
- **Caddy como primeira linha**: `limit_req`-like (via plugin ou
  configuração de timeout/conexões simultâneas) antes de chegar no Node.
- **Payload size limit** no `main.ts` (Express `json({ limit: '1mb' })` ou
  equivalente) — sem isso, um payload de vendas absurdamente grande
  (`POST /sales/sync`) pode derrubar o processo por memória.
- **Sem WAF/CDN dedicado em v1** (decisão consciente, é uma VPS simples) —
  se o produto crescer a ponto de justificar, Cloudflare na frente da VPS
  (mesmo plano free) é o próximo passo mais barato antes de qualquer coisa
  mais sofisticada.
- **Timeouts explícitos** em toda chamada externa (storage MinIO, banco) —
  uma dependência lenta não pode travar o processo Node inteiro
  indefinidamente.

## 6. Upload de arquivo (fotos de produto/operador/logo do tenant)

- **Nunca aceitar upload direto no servidor da API** — o fluxo é URL
  assinada do MinIO (ver `01-arquitetura.md`): o navegador manda o arquivo
  direto pro storage, a API só gera a URL assinada e valida o resultado
  depois. Isso evita que a API processe bytes de arquivo arbitrário.
  gerada com escopo de content-type e tamanho máximo (ex.: 5MB, apenas
  `image/jpeg`, `image/png`, `image/webp`).
- **Validar o content-type real do arquivo** (magic bytes), não confiar na
  extensão nem no `Content-Type` que o cliente declarou — evita um `.jpg`
  que na verdade é um script.
- **Nunca servir upload do usuário no mesmo domínio da aplicação** sem
  `Content-Disposition` apropriado — serve pelo domínio/bucket do MinIO,
  não por uma rota da API que herdaria os cookies de sessão do domínio
  principal.
- Nome de arquivo gerado pelo servidor (UUID), nunca o nome original do
  arquivo do usuário usado como path.

## 7. Injeção (SQL e afins)

- Prisma parametriza toda query por padrão — a única forma de reintroduzir
  SQL injection é usar `$queryRawUnsafe`/`$executeRawUnsafe` com
  interpolação de string. **Proibido no projeto**; se uma raw query for
  genuinamente necessária, só `$queryRaw`/`$executeRaw` com template
  literal tipado do próprio Prisma (parametrizado).
- Filtros de busca (`GET /products?search=`) sempre validados pelo DTO
  (Zod) antes de chegar no Prisma — nunca concatenados em `where` cru.

## 8. Segredos e configuração

- `SESSION_SECRET`, credenciais de banco, credenciais do MinIO: só em
  `.env` (nunca commitado — já coberto no `.gitignore`), gerados com
  entropia real (`openssl rand -hex 32`), diferentes por ambiente
  (dev ≠ produção).
- **Rotação de `SESSION_SECRET`** invalida todas as sessões ativas — ter
  isso documentado como procedimento manual de resposta a incidente (ex.:
  suspeita de leak), não só como boa prática teórica.
- Backup do banco (`pg_dump`, ver `01-arquitetura.md`) **criptografado em
  repouso** no destino externo — um backup vazado é dado de vendas e PIN
  hasheado de vários mercados reais.
- Logs da aplicação **nunca** contêm PIN em texto puro, token de sessão
  completo, nem corpo de request de login — mascarar explicitamente esses
  campos no logger, não confiar em "não vou logar isso" implícito.

## 9. Dependências e superfície de ataque

- `pnpm audit` (ou equivalente) no CI — falha o build em vulnerabilidade
  crítica/alta sem correção disponível não é aceitável mergear sem decisão
  explícita.
- Imagens Docker base fixadas em versão (`node:22-alpine`, já é o padrão
  usado) e atualizadas periodicamente — imagem `latest` implícita nunca.
- Superfície pública mínima: só `apps/web` (porta 443 via Caddy) e `apps/api`
  (também só via Caddy) expostas; Postgres e MinIO **nunca** com porta
  publicada para fora da rede Docker interna (ver `docker-compose.yml` — não
  adicionar `ports:` neles sem motivo forte e revisão).

## 10. Cabeçalhos de segurança HTTP

Configurados no Caddy (camada única, mais simples que duplicar no Next e no
Nest):

- `Strict-Transport-Security` (HSTS) — força HTTPS mesmo se alguém tentar
  `http://`.
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (ou
  `frame-ancestors 'none'` na CSP) — o PDV não tem motivo pra ser embedado
  num iframe de terceiro.
- `Referrer-Policy: strict-origin-when-cross-origin`.

## 11. LGPD (dado pessoal de operador e movimento financeiro do mercado)

- Dado de operador (nome, foto) e histórico de venda são dados pessoais e
  dados de negócio do cliente (o mercado) — tratados com o mesmo cuidado de
  isolamento por tenant do item 1.
- Soft-delete (já é o padrão do projeto para `Product`/`Operator`) preserva
  histórico para auditoria contábil do mercado, mas isso significa que um
  pedido de exclusão definitiva de dado pessoal (ex.: um ex-operador pedindo
  remoção) exige um processo de hard-delete documentado à parte — não
  existe ainda, registrar como item de backlog quando for necessário
  (fora do MVP, mas não esquecer).
- Sem coleta de dado desnecessário: o sistema não pede CPF, endereço ou
  qualquer dado pessoal do cliente final do mercado (quem compra) — não há
  motivo de produto para isso, e cada campo novo de dado pessoal é
  superfície de risco e obrigação legal a mais.

## O que fica fora de escopo por ora (e por quê)

- **WAF dedicado / CDN de segurança**: custo não justificado no estágio de
  poucos tenants numa VPS única — reavaliar se o tráfego ou o risco
  crescerem (ver item 5).
- **2FA para Administrador**: PIN + acesso físico ao tablet já é o modelo
  de ameaça aceito para este produto (mercado pequeno, sem TI); reavaliar
  se o produto for vendido para um perfil de cliente diferente.
- **Pentest formal**: fora de escopo do MVP; recomendado antes de escalar
  para um número grande de tenants ou de mercados com faturamento alto.
