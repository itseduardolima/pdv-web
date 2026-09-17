# Operação (Runbook)

Este documento assume que **o sistema está no ar sustentando o caixa de um
mercado real** — a pergunta que ele responde é "como eu sei que algo
quebrou, e o que eu faço quando quebrar", não "como a arquitetura funciona"
(isso é `01-arquitetura.md`). Numa VPS única self-hosted (ver
`01-arquitetura.md` § Ambientes e deploy), não existe um provedor gerenciado
cuidando disso por trás — é manual até que o volume de tenants justifique
automatizar mais.

## 1. Health checks

- `GET /health` na API (a criar — hoje não existe, é dependência de v1 de
  produção, não bloqueia as sprints de funcionalidade mas bloqueia o
  Sprint 5 "deploy do primeiro cliente real", ver `docs/scrum/SPRINTS.md`):
  responde 200 só se conseguir de fato falar com o Postgres (`SELECT 1`) —
  nunca um health check que só confirma "o processo Node está de pé".
- Health check **não passa por `TenantMiddleware`** (não faz sentido exigir
  tenant pra saber se o serviço está vivo) — registrar a rota como pública
  e fora da resolução de tenant.
- `apps/web`: usar a rota de health própria do Next (`/api/health` simples,
  sem depender da API) só para confirmar que o processo do frontend está
  respondendo — não precisa checar a API dentro dela (isso é redundante com
  o health check de `apps/api`).

## 2. Monitoramento externo (uptime)

Sem orçamento/necessidade de uma stack de observabilidade completa em v1 —
o mínimo que não pode faltar:

- **Um serviço de uptime externo** (ex.: UptimeRobot, free tier) batendo em
  `GET /health` da API e na home do `apps/web` a cada 1–5 min, com alerta
  por e-mail/WhatsApp quando cair — é o único jeito de saber que a loja
  parou de vender _antes_ do Administrador ligar reclamando.
- **Monitorar expiração do certificado TLS** — o Caddy renova sozinho
  (Let's Encrypt), mas o uptime check acima já pega indiretamente se a
  renovação falhar (o site vira inacessível/com erro de certificado).
- **Espaço em disco da VPS** — volumes do Postgres e do MinIO crescem sem
  limite natural; `scripts/disk-space-check.sh` (`df` + alerta se > 80%,
  limite configurável via `DISK_ALERT_THRESHOLD`) registrado no crontab da
  VPS (exemplo no `README.md` § Deploy na VPS) evita a VPS parar de
  escrever no banco por disco cheio, que é um dos jeitos mais silenciosos
  de derrubar o sistema.

## 3. Logs

- Logs estruturados (JSON) na API — cada linha com `timestamp`, `level`,
  `tenantId` (quando resolvido), `requestId`, `message`. `requestId` gerado
  no `main.ts` (ou middleware dedicado) e propagado no `AsyncLocalStorage`
  junto do `tenantId` (mesmo mecanismo de `common/tenant-context.ts`) — todo
  log de uma mesma request é correlacionável sem grep manual de timestamp.
- **Nunca logar PIN, token de sessão completo, nem corpo de request de
  login/pagamento** — já é regra em `08-seguranca.md` § 10, reforçando aqui
  porque é o tipo de coisa que "some" de um log de erro genérico se ninguém
  prestar atenção (ex.: um interceptor de log de request que loga o body
  inteiro por padrão).
- Logs vão para stdout/stderr do container (`docker compose logs -f api`) —
  em v1 não há agregador externo; se o volume de tenants crescer o
  suficiente para isso ser inviável de debugar manualmente, esse é o
  próximo investimento de infra (não antes).
- Nível de log: `info` em produção (nunca `debug`/`query` do Prisma — ver
  `08-seguranca.md` § 9), `debug` só em desenvolvimento local.

## 4. Backup e restore do banco

Backup que nunca foi restaurado com sucesso não é backup, é uma esperança.

- **O quê**: `pg_dump` completo do banco (todos os tenants — não é um dump
  por tenant em v1). Implementado em `scripts/backup-db.sh`: dump como
  superusuário (bypassa RLS — um dump como `APP_DB_USER` viria com as
  tabelas de domínio vazias e ninguém perceberia), comprimido (`gzip`) e
  criptografado (`openssl enc -aes-256-cbc -pbkdf2`) antes de sair da VPS.
- **Quando**: diário, via cron na própria VPS (ou um container sidecar
  dedicado), horário de menor movimento do(s) tenant(s). Exemplo de
  crontab no `README.md` § Deploy na VPS.
- **Onde**: destino **fora da VPS** (ex.: bucket S3 barato separado, ou
  outra máquina) — um backup que só existe no mesmo disco que pode falhar
  não protege contra a falha que importa (disco/VPS inteira). O script
  envia via `aws s3 cp` (funciona com S3 de verdade ou qualquer destino
  S3-compatível via `BACKUP_S3_ENDPOINT_URL` — Backblaze B2, outro MinIO
  fora desta VPS, etc.); requer `aws`-cli instalado na VPS.
- **Retenção**: últimos 7 diários + últimos 4 semanais — ajustar conforme o
  custo de storage justificar mais. O script já aplica essa poda a cada
  execução (`BACKUP_DAILY_RETENTION`/`BACKUP_WEEKLY_RETENTION` pra mudar).
- **Criptografado em repouso no destino** (ver `08-seguranca.md` § 10). Pra
  restaurar: baixar o objeto do bucket e reverter o pipeline —
  `openssl enc -aes-256-cbc -pbkdf2 -d -pass "pass:$BACKUP_ENCRYPTION_PASSPHRASE" -in arquivo.sql.gz.enc | gunzip > dump.sql`,
  depois `psql` normal contra o ambiente de restore.
- **Drill de restore — obrigatório, não opcional**: a cada mudança de
  schema relevante (nova migration grande) ou, na ausência disso, uma vez
  por mês, restaurar o backup mais recente num ambiente separado (nunca na
  VPS de produção) e confirmar que a aplicação sobe e os dados batem. Um
  backup nunca testado é a causa raiz mais comum de "descobrimos que o
  backup estava corrompido bem na hora que precisávamos dele".

## 5. Deploy e rollback

- **Primeiro deploy**: passo a passo no `README.md` § Deploy na VPS (DNS
  com wildcard `*.APP_DOMAIN`, `.env` real validado por
  `scripts/deploy-check.sh`, `docker compose up -d --build`, seed da
  primeira loja). TLS é sob demanda: o primeiro acesso a um host novo demora
  alguns segundos enquanto o Caddy emite o certificado; hosts que a API não
  reconhece (`GET /tenant/tls-check` → 404) não ganham certificado, o que
  impede abuso do wildcard.
- **Banco**: o superusuário `postgres` existe só para administração/backup;
  a API usa `APP_DB_USER` sem superusuário (RLS). Nunca troque
  `DATABASE_URL` da API para o superusuário "para resolver rápido" — isso
  desliga o isolamento entre lojas no banco.

- **Deploy normal**: merge na branch principal → CI builda e testa → deploy
  via SSH (`docker compose pull && docker compose up -d` ou build remoto,
  ver `01-arquitetura.md`) — sem passo manual fora do CI uma vez que a HU
  9.4 (`docs/scrum/BACKLOG.md`) estiver feita; até lá, é manual e deve ser
  feito com o operador do mercado avisado se for em horário comercial.
- **Antes de aplicar uma migration em produção**: backup manual extra
  (além do cron diário) imediatamente antes — migrations do Prisma não têm
  rollback automático; a única forma segura de desfazer uma migration
  destrutiva é restaurar esse backup.
- **Rollback de uma release ruim (sem mudança de schema)**: voltar para a
  imagem/commit anterior e `docker compose up -d --build` de novo — rápido
  porque não envolve o banco.
- **Rollback quando envolveu migration**: é o cenário caro — restaurar o
  backup pré-migration é o caminho, o que significa perder qualquer venda
  registrada entre o backup e o rollback. Mitigação: aplicar migrations em
  horário de baixo movimento do(s) tenant(s), nunca durante o expediente
  principal do mercado.

## 6. Incidentes — cenários e primeira ação

| Sintoma                                                                                                                                                             | Causa provável                                                  | Primeira ação                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Uptime check falhando, VPS não responde a `ping`/SSH                                                                                                                | VPS fora do ar (provedor, hardware)                             | Verificar painel da Hostinger; se for outage do provedor, não há o que fazer além de aguardar e comunicar o(s) tenant(s) afetado(s)                                                                                                                                                       |
| `apps/web`/`apps/api` não respondem, mas SSH funciona                                                                                                               | Container caiu, disco cheio, OOM                                | `docker compose ps` → `docker compose logs --tail=200 <serviço>`; checar `df -h` (item 2) antes de reiniciar às cegas                                                                                                                                                                     |
| `GET /health` retorna 500                                                                                                                                           | Postgres inacessível pela API                                   | `docker compose ps postgres`; se o container caiu, `docker compose up -d postgres` e conferir logs; se o volume está corrompido, é cenário de restore (item 4)                                                                                                                            |
| Operador não consegue logar em nenhum tenant                                                                                                                        | `SESSION_SECRET` rotacionado sem aviso, ou bug no módulo `auth` | Confirmar se foi rotação deliberada (item 8 de `08-seguranca.md` — invalida toda sessão, é esperado forçar novo login); se não foi, é bug, tratar como incidente de código, não de infra                                                                                                  |
| Um Administrador perdeu acesso e é o único admin ativo (regra do "último admin" o impede de se autoinativar, mas um esquecimento de PIN ainda pode travar o acesso) | PIN esquecido, sem outro admin pra resetar                      | Resetar via acesso direto ao banco (`pnpm --filter api db:studio` contra o Postgres de produção, com muito cuidado, ou um script dedicado) — gerar novo hash argon2 e atualizar `pinHash` diretamente; documentar esse acesso de emergência como algo raro e auditado, não um fluxo comum |
| Certificado TLS expirado / site com aviso de segurança                                                                                                              | Caddy não conseguiu renovar (porta 80/443 bloqueada, DNS mudou) | `docker compose logs caddy`; confirmar que portas 80/443 estão realmente acessíveis de fora e que o DNS do domínio aponta pra VPS                                                                                                                                                         |

## 7. Tarefas operacionais recorrentes

- **Onboarding de novo tenant**: procedimento completo em
  `07-multitenant-whitelabel.md` § Onboarding — este runbook não repete,
  só aponta.
- **Rotação de `SESSION_SECRET`**: ver `08-seguranca.md` § 10 — invalida
  todas as sessões ativas de propósito, avisar operadores antes se possível.
- **Atualização de dependência com vulnerabilidade (Dependabot/`pnpm audit`)**:
  ver `08-seguranca.md` § 11 — mergear o PR de atualização, rodar o CI,
  fazer o deploy normal (item 5).
- **Verificação mensal de restore** (item 4) — colocar num calendário, não
  depender de lembrar.

## 8. E-mail transacional (SMTP)

A API só envia dois e-mails: link de primeiro acesso e link de "esqueci
meu PIN" (ver `03-regras-negocio.md` § Autenticação). Em produção
`MAIL_TRANSPORT=smtp` com um provedor externo (`01-arquitetura.md`):

- Preencher `MAIL_FROM` (remetente com o domínio verificado no provedor) e
  `SMTP_HOST/PORT/SECURE/USER/PASSWORD` no `.env` da VPS.
- Configurar SPF/DKIM do domínio no provedor, senão o link cai em spam e o
  admin liga para o suporte do mesmo jeito.
- Teste após o deploy: criar um operador de teste com e-mail e sem PIN pela
  tela de Operadores, conferir se o e-mail chega, excluir o operador.
- **Se o provedor cair**: `POST /auth/forgot-pin` continua respondendo 204
  (não vaza o problema) mas o e-mail não sai; o log da API mostra o erro do
  SMTP. Enquanto isso o admin pode resetar o PIN de um operador pela tela;
  para o único admin, suporte com `MAIL_TRANSPORT=log` temporário e o link
  lido no log (`docker compose logs api`).
- Sem SMTP configurado a API sobe com `log` e nada quebra — só não chega
  e-mail nenhum.

## O que fica fora de escopo por ora (e por quê)

- **Stack de observabilidade completa** (Grafana/Prometheus, agregador de
  log tipo Loki/ELK): custo e complexidade não justificados para poucos
  tenants numa VPS única — reavaliar junto com a decisão de WAF/CDN em
  `08-seguranca.md`, no mesmo gatilho de crescimento.
- **On-call formal / SLA contratual**: este runbook assume resposta em
  "quando alguém perceber e tiver tempo", não um SLA de minutos — definir
  isso é decisão comercial, não técnica, e vem antes de qualquer
  automação de alerta mais sofisticada.
