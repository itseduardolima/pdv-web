# Segurança

Checklist de atenção por categoria de risco, específico para este sistema
(multi-tenant, PIN de 4 dígitos, self-hosted numa VPS, dado sensível de
pequenos negócios reais). Não é uma lista genérica de OWASP — cada item diz
_onde_ no código isso se aplica.

## 1. Vazamento de dado entre tenants (o maior risco deste produto)

Um mercado nunca pode ver dado de outro. Duas camadas, nunca só uma (ver
`01-arquitetura.md` e `07-multitenant-whitelabel.md`):

- **Camada de aplicação**: todo método de `Repository` recebe `tenantId`
  como argumento obrigatório (nunca opcional, nunca "se não vier, busca
  tudo"). Nenhum `findMany` sem filtro de `tenantId` — revisar isso em code
  review é mais importante que revisar estilo.
- **Camada de banco (RLS) — implementada**: policies `tenant_isolation`
  (USING + WITH CHECK) com `FORCE ROW LEVEL SECURITY` em `Operator`,
  `Product`, `CashSession`, `Sale` e `SaleItem` (esta via `EXISTS` na venda),
  migration `20260912180000_row_level_security`. A extensão do Prisma
  (`apps/api/src/prisma/prisma.client.ts`) roda toda operação numa transação
  com `set_config('app.tenant_id', <tenant do request>, true)`; transações
  interativas chamam `setTenantInTransaction` na primeira linha. Sem tenant
  no contexto, as tabelas não devolvem nem aceitam nenhuma linha. Duas
  condições para valer: a API conecta como usuário **sem superusuário e sem
  BYPASSRLS** (`infra/postgres/init-app-role.sh`), e scripts fora de request
  (seed) setam o tenant explicitamente. Prova manual (psql como o usuário da
  API): sem `app.tenant_id` → 0 linhas; com o tenant A → só linhas de A;
  `INSERT` com `tenantId` de outro tenant → "violates row-level security
  policy".
- **Sessão nunca atravessa tenant**: o `AuthGuard` já compara
  `session.tenantId` contra o tenant resolvido pelo host a cada request
  (ver `apps/api/src/common/guards/auth.guard.ts`) — um JWT válido de um
  tenant é explicitamente rejeitado em outro, mesmo com assinatura correta.
- **Teste obrigatório**: para todo módulo novo, um teste que cria dado em
  dois tenants e prova que a query de um nunca retorna o do outro — não é
  opcional, é Definition of Done (ver `docs/scrum/SPRINTS.md`).
- **Exceção deliberada e documentada — painel Superadmin**: o único ponto do
  sistema que legitimamente lê metadado (não dado operacional) de mais de
  um tenant na mesma requisição é `GET /platform/tenants` (contagem de
  operadores ativos por loja). Ele declara o tenant explicitamente por
  chamada (`tenantStorage.run({tenantId}, ...)`), uma loja de cada vez —
  nunca lê duas de uma vez sem tenant setado, nunca acessa `Product`/`Sale`
  de nenhum tenant. Pegadinha real encontrada na implementação: **o
  `await` da chamada ao Prisma precisa acontecer DENTRO do callback do
  `tenantStorage.run(...)`** — devolver a `PrismaPromise` sem awaitar
  (`() => prisma.operator.count(...)`) perde o contexto do
  `AsyncLocalStorage` antes da query rodar de verdade (a extensão de RLS vê
  `tenantId` `undefined`), mesmo com o `.run()` sintaticamente "por fora"
  da chamada — ver `platform-tenant.service.ts`.

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
- **Links de PIN por e-mail** (primeiro acesso / esqueci meu PIN): token de
  32 bytes aleatórios (`crypto.randomBytes`), o banco guarda só o SHA-256
  (`PinToken.tokenHash`, com RLS como as outras tabelas); uso único,
  validade curta (1h reset, 72h primeiro acesso), emitir novo invalida o
  anterior; o link é sempre para o host da própria loja. `POST
/auth/forgot-pin` responde 204 **sempre** (não confirma se o e-mail
  existe) e tem `@Throttle` próprio (5/min); `POST /auth/set-pin` idem
  (10/min). O e-mail é texto puro, sem HTML. Um operador sem PIN definido
  não aparece na lista de Login nem consegue logar.

### Cookie de sessão — todos os flags, sempre

O cookie `pdv_session` (ver `apps/api/src/common/types/request.ts`) é o
único jeito de forjar uma sessão se mal configurado — todos estes flags são
obrigatórios juntos, não é "escolher um":

- `HttpOnly` — inacessível via `document.cookie`/JS (mitiga roubo por XSS).
- `Secure` — nunca enviado em `http://`, só `https://` (a VPS serve tudo
  por Caddy com TLS, ver `01-arquitetura.md`; sem exceção nem em staging).
- `SameSite=Lax` (ou `Strict`, testar contra o fluxo de subdomínio de
  tenant) — mitiga CSRF, ver seção 3.
- `Path=/` explícito e sem `Domain` mais largo do que o necessário — nunca
  um cookie que valha para domínios que não são o `apps/web`.
- Sem dado sensível dentro do JWT do cookie além do necessário
  (`sub`, `tenantId`, `role`) — nunca PIN, nunca hash, nunca e-mail.

### Sessão de plataforma (painel Superadmin, Épico 13) — segredo separado

A conta do dono do sistema (`PlatformAdmin`) não é um `Operator` e não
pertence a tenant nenhum — a sessão dela é deliberadamente isolada da de
operador, não uma variação dela:

- Cookie próprio (`pdv_platform_session`, não `pdv_session`) e segredo de
  JWT próprio (`PLATFORM_SESSION_SECRET`, não `SESSION_SECRET`) — um
  vazamento de um segredo não pode forjar sessão do outro tipo.
- Payload do JWT sem `tenantId` (não existe) e sem `role` (não há papéis
  aqui, é uma conta só) — só `sub`.
- Login por e-mail+senha, não PIN — é uma conta só, de alto privilégio
  (cria lojas inteiras), não um funcionário numa tela compartilhada.
- `@Throttle` mais restrito que o login de operador (5 tentativas / 15min,
  contra 5/60s do operador) — o custo de um bloqueio incorreto é menor do
  que o de facilitar força bruta contra a conta mais privilegiada do
  sistema.
- Mesmos flags de cookie da seção acima (`HttpOnly`/`Secure`/`SameSite=Lax`).

## 5. Negação de serviço (DDoS / abuso de endpoint) e bots

Numa VPS única (Hostinger, sem CDN/WAF gerenciado), a mitigação é mais
manual do que seria numa nuvem grande — ser realista sobre isso:

- **Rate limiting global** (`@nestjs/throttler`, já na base) em toda rota,
  não só login — limite mais permissivo nas rotas de leitura, mais estrito
  em mutação. Liga por padrão em todo ambiente (`RATE_LIMIT_ENABLED` não
  setada = ligado); só o `.env` de desenvolvimento local desliga
  (`RATE_LIMIT_ENABLED=false`), para uma sessão de testes manuais/E2E
  repetidos não travar em 429 — nunca `false` em CI ou produção.
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
- **Proteção contra bot em endpoints públicos sensíveis** (`POST
/auth/login`, e qualquer form público que existir no futuro): o
  `@nestjs/throttler` já limita por IP, mas some com um segundo sinal
  barato antes de qualquer CAPTCHA — um **honeypot** (campo invisível no
  formulário que só um bot preenche; se vier preenchido, rejeita
  silenciosamente sem revelar o motivo) resolve a maior parte do scraping
  automatizado sem fricção para o Operador real. Reavaliar
  Cloudflare Turnstile/hCaptcha só se o honeypot + rate-limit não bastarem
  na prática.
- **User-Agent e padrão de requisição** — logar e alertar (não bloquear
  automaticamente sem revisão) picos de requisição sem `User-Agent` de
  browser real ou com timing não-humano (múltiplas tentativas de login
  em milissegundos) — sinal para investigar, não uma regra que bloqueia
  sozinha e pode gerar falso positivo num tablet real.

## 6. Upload de arquivo (fotos de produto/operador/logo do tenant)

- **Restringir upload por tipo, tamanho e escopo — sempre no servidor, nunca só no `accept` do `<input>`**:
  - Fluxo é URL assinada do MinIO (ver `01-arquitetura.md`): o navegador
    manda o arquivo direto pro storage, a API só gera a URL assinada e
    valida o resultado depois — evita que a API processe bytes de arquivo
    arbitrário.
  - A URL assinada é gerada com **content-type fixo na assinatura**
    (`image/jpeg`, `image/png` ou `image/webp` — nunca um upload
    "genérico") e **tamanho máximo** (5MB) — o storage rejeita qualquer
    upload fora disso, o cliente não decide.
  - **Validar o content-type real do arquivo** (magic bytes) depois do
    upload, não confiar na extensão nem no header que o cliente declarou —
    evita um `.jpg` que na verdade é um script; se não bater, o arquivo é
    apagado do bucket e a operação falha.
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

## 8. Mass assignment

Um DTO validado pelo Zod garante o **formato** do campo, não que o campo
**deveria** estar ali — mass assignment é o cliente conseguir setar um
campo que não devia poder controlar (ex.: virar admin sozinho, mudar o
`tenantId` da própria conta, forjar `createdAt`).

- Todo schema de entrada (`createOperatorSchema`, `updateProductSchema`,
  etc., em `packages/shared`) usa **allowlist explícita** de campo — nunca
  `z.object({}).passthrough()` nem qualquer forma de aceitar campos extras
  silenciosamente. Campo que não está no schema é rejeitado, não ignorado.
- **Nunca repassar o body inteiro pro Prisma** (`prisma.operator.update({
data: dto })` só é seguro porque `dto` já passou por um schema com
  allowlist — se algum dia um `Service` receber um objeto que não veio de
  um DTO validado, ele constrói o objeto de `data` campo a campo,
  explicitamente).
- **Campos que o cliente nunca pode setar, mesmo em request de update**:
  `tenantId`, `id`, `role` (exceto na tela de gestão de operador, e mesmo
  aí só quando quem chama é `ADMIN` — ver `RolesGuard`), `pinHash`,
  `createdAt`, `deletedAt`. Isso é o motivo de `updateOperatorSchema` e
  `updateProductSchema` (`packages/shared`) omitirem esses campos na
  origem, não confiarem em "o Controller não vai repassar" — o schema já
  não aceita.
- Operações de papel/permissão (`PATCH /operators/:id`, mudança de `role`)
  passam por validação de negócio explícita no `Service`
  (`RolesGuard` cobre "quem pode chamar", o `Service` cobre "o resultado é
  um estado válido", ex.: não pode rebaixar o último admin — ver
  `03-regras-negocio.md`).

## 9. Exposição de dados na resposta da API (response shaping)

Devolver o registro do Prisma direto na resposta HTTP é o jeito mais fácil
de vazar campo que nunca devia sair do banco.

- **Nunca retornar `pinHash`** em nenhuma resposta, nem em `GET
/operators`, nem em erro, nem em log de request/response. O schema de
  resposta (`operatorSchema` em `packages/shared`) não tem esse campo — o
  `Service`/`Controller` monta a resposta a partir do schema de saída, não
  devolve o objeto do Prisma como veio do banco.
- Toda resposta de endpoint valida contra o schema Zod de **saída**
  correspondente antes de sair (o mesmo espírito de `apiRequest` no
  `apps/web`, que já faz `schema.parse(payload)` na chegada — ver
  `apps/web/src/lib/api-client.ts`) — um campo novo adicionado ao modelo do
  Prisma não aparece na API por acidente; é preciso decidir expor.
- Mensagens de erro **nunca** incluem stack trace, nome de tabela/coluna do
  Prisma, ou o SQL gerado — o `DomainExceptionFilter` (ver
  `apps/api/src/common/filters/domain-exception.filter.ts`) já garante um
  formato fixo (`statusCode`, `code`, `message`, `details` só quando é erro
  de validação de formato) em qualquer ambiente, inclusive produção.
- `NODE_ENV=production` desativa qualquer detalhe de debug do Nest/Prisma
  (`log: ['query']` do Prisma só em desenvolvimento, nunca em produção —
  logar toda query é, na prática, logar dado de negócio de cada tenant).

## 10. Segredos e configuração

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

## 11. Scan de dependências

- `pnpm audit --audit-level=high` **no CI, em todo PR** — build vermelho em
  vulnerabilidade alta/crítica com correção disponível; sem correção
  disponível ainda, decisão explícita registrada (não é aceitável mergear
  silenciando o alerta).
- **Dependabot (ou Renovate)** habilitado no repositório para abrir PR de
  atualização de dependência automaticamente — não depender de alguém
  lembrar de atualizar manualmente.
- Imagens Docker base fixadas em versão (`node:22-alpine`, já é o padrão
  usado) e atualizadas periodicamente — imagem `latest` implícita nunca.
- Superfície pública mínima: só `apps/web` (porta 443 via Caddy) e `apps/api`
  (também só via Caddy) expostas; Postgres e MinIO **nunca** com porta
  publicada para fora da rede Docker interna (ver `docker-compose.yml` — não
  adicionar `ports:` neles sem motivo forte e revisão).

## 12. Cabeçalhos de segurança HTTP

Configurados no Caddy (camada única, mais simples que duplicar no Next e no
Nest):

- `Strict-Transport-Security` (HSTS) — força HTTPS mesmo se alguém tentar
  `http://`.
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (ou
  `frame-ancestors 'none'` na CSP) — o PDV não tem motivo pra ser embedado
  num iframe de terceiro.
- `Referrer-Policy: strict-origin-when-cross-origin`.

## 13. LGPD (dado pessoal de operador e movimento financeiro do mercado)

- Dado de operador (nome, foto) e histórico de venda são dados pessoais e
  dados de negócio do cliente (o mercado) — tratados com o mesmo cuidado de
  isolamento por tenant do item 1.
- Soft-delete (já é o padrão do projeto para `Product`/`Operator`) preserva
  histórico para auditoria contábil do mercado, mas isso significa que um
  pedido de exclusão definitiva de dado pessoal (ex.: um ex-operador pedindo
  remoção) exige um processo à parte. **Implementado**: `POST
/operators/:id/anonymize` (ADMIN, só após soft-delete via `DELETE
/operators/:id`) — anonimiza em vez de apagar a linha (`Sale.operatorId`/
  `CashSession.openedById` referenciam `Operator` sem cascade, um DELETE de
  verdade quebraria o histórico financeiro): zera `name` (vira "Operador
  removido"), `photoUrl` (apaga o objeto do MinIO de verdade, não só a
  URL) e `pinHash`; marca `anonymizedAt`. Irreversível, idempotente (409
  `ALREADY_ANONYMIZED` numa segunda chamada). `GET /operators/deleted`
  lista quem já foi soft-deleted, já que a lista principal nunca traz
  quem saiu — é como o Administrador acha o operador depois, mesmo que o
  pedido de exclusão chegue muito depois do desligamento. Sem tabela de
  auditoria dedicada: o rastro (quem/quando) fica só no log estruturado
  (`StructuredLogger`) — aceito como limitação por ora, reavaliar se o
  produto crescer.
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
