# Sprint Plan

Baseado no [`BACKLOG.md`](./BACKLOG.md). Time reduzido (1 dev + par de IA) —
sprints de **1 semana**, não 2, para manter o ciclo de feedback curto; ajustar
a duração se o time crescer. Cada sprint entrega algo **demonstrável e
testado** (typecheck + testes unitários do backend + Cypress do que já
existir), nunca código "pela metade" — é a mesma régua que já está em
`CLAUDE.md` ("construir por etapas").

## Definition of Ready (antes de uma HU entrar numa sprint)

- Critérios de aceite claros (já estão no backlog).
- Dependência de outra HU resolvida (ver coluna "depende de" abaixo).
- Endpoint/contrato (schema Zod em `packages/shared`) definido antes de
  escrever a tela que o consome.

## Definition of Done

- Backend: `Service` com teste Jest cobrindo a regra (`Repository`
  mockado); `Controller` valida DTO e papel.
- Frontend: tela navegável de ponta a ponta contra a API real (não mock);
  erro de campo e de regra de negócio tratados via `InlineAlert`/mensagem de
  campo (nunca toast, nunca mensagem inventada no cliente — ver
  `docs/specs/04-padroes-codigo.md` § Formulários).
- `pnpm typecheck` e `pnpm test` passam no monorepo inteiro, não só no que
  foi tocado.
- Commit(s) em inglês, Conventional Commits, um por unidade lógica de
  trabalho (não um commit gigante por sprint).

---

## Por onde começar (recomendação)

**Sprint 1 = Épico 1 (Multi-tenant) + Épico 2 (Autenticação).** Motivo: são
a única coisa de que _todo o resto_ depende — não existe tela de Produto,
Caixa ou Venda sem um tenant resolvido e um operador autenticado. A
fundação técnica (guards, `AsyncLocalStorage`, `DomainError`) já foi
scaffolded justamente esperando por esses dois módulos; começar por eles é
completar o que já está pela metade, não abrir fronte nova.

Segunda decisão importante: o **Épico 10 (Validação e Feedback)** não é uma
sprint própria — os componentes `InlineAlert` e o mapeamento de erro de
campo entram **na Sprint 2, junto com o primeiro formulário real
(Produto)**. Construir esse padrão _antes_ de existir um formulário para
testá-lo é trabalho no vácuo; construir _depois_ significa retrabalhar toda
tela já feita. Produto é o formulário mais simples do sistema (sem regra de
"último admin", sem PIN) — é o lugar certo para validar o padrão de erro
pela primeira vez, barato de errar e corrigir.

A partir daí a ordem segue o caminho crítico do valor de negócio: só depois
de conseguir logar (Sprint 1) e cadastrar produto (Sprint 2) é que abrir
caixa e vender fazem sentido — e vender é o motivo do sistema existir, por
isso entra antes de Operadores/Dashboard, que são gestão em torno da venda,
não a venda em si.

## Sprint 1 — Tenant + Autenticação

**Objetivo:** um operador consegue logar com PIN numa loja específica.

| HU  | Descrição curta                                         | Pts |
| --- | ------------------------------------------------------- | --- |
| 1.1 | Resolução de tenant por host                            | 5   |
| 1.2 | `GET /tenant/current` + tema aplicado no `apps/web`     | 3   |
| 2.1 | Lista de operadores para Login                          | 2   |
| 2.2 | Login por PIN (hash argon2, cookie de sessão)           | 5   |
| 2.3 | Rate-limit de tentativas de PIN                         | 3   |
| 2.4 | Expiração de sessão (12h)                               | 2   |
| 2.5 | Logout                                                  | 1   |
| 0.x | CI (GitHub Actions: lint + typecheck + test em todo PR) | 3   |

**Total: 24 pts.** Entrega: tela de Login funcional de ponta a ponta,
sessão persistindo, CI protegendo a branch principal a partir daqui.

## Sprint 2 — Produtos + padrão de Validação/Feedback

**Objetivo:** Administrador cadastra e edita produto; o padrão de erro de
campo/regra de negócio (Épico 10) nasce aqui e vale para todo formulário
seguinte.

| HU   | Descrição curta                             | Pts |
| ---- | ------------------------------------------- | --- |
| 10.1 | Erro de campo mapeado da resposta da API    | 3   |
| 10.2 | `InlineAlert` para erro de regra de negócio | 3   |
| 3.1  | Criar produto                               | 3   |
| 3.2  | Listar produtos (busca)                     | 3   |
| 3.3  | Editar produto                              | 2   |
| 10.3 | Botão com estado loading/success            | 2   |
| 1.3  | Seed de novo tenant documentado             | 2   |

**Total: 18 pts.** Entrega: CRUD de Produto completo (exceto foto — Sprint
3), e o vocabulário de UI de erro/sucesso já reutilizável.

## Sprint 3 — Caixa (Abertura/Fechamento) + foto de Produto

**Objetivo:** operador abre e fecha caixa; produto ganha foto.

| HU  | Descrição curta                                                                         | Pts |
| --- | --------------------------------------------------------------------------------------- | --- |
| 4.1 | Abrir caixa                                                                             | 3   |
| 4.2 | Bloquear ações sem caixa aberto                                                         | 2   |
| 4.3 | Fechar caixa com totais por forma de pagamento                                          | 5   |
| 4.4 | Histórico de vendas na tela de Fechamento (lista vazia por ora — Sale ainda não existe) | 3   |
| 3.4 | Upload de foto do produto (MinIO)                                                       | 5   |
| 3.5 | Excluir produto (soft-delete)                                                           | 2   |

**Total: 20 pts.**

## Sprint 4 — Vender (o core do produto)

**Objetivo:** venda completa, de ponta a ponta, online. **Este é o
milestone "o sistema já vende de verdade".**

| HU             | Descrição curta                         | Pts |
| -------------- | --------------------------------------- | --- |
| 5.1            | Montar carrinho                         | 3   |
| 5.2            | Finalizar venda (Dinheiro/Cartão/Pix)   | 5   |
| 5.3            | Bloqueio de estoque insuficiente        | 3   |
| 5.4            | Tela de Venda Confirmada                | 1   |
| 5.5            | Cancelar carrinho                       | 1   |
| 4.4 (retomada) | Histórico de vendas agora com dado real | —   |

**Total: 13 pts.** Entrega: fluxo completo Login → Abrir Caixa → Vender →
Fechar Caixa funcionando contra a API real, sem nenhuma parte simulada.

## Sprint 5 — Deploy do primeiro cliente real

**Objetivo:** sair do ambiente de desenvolvimento e rodar num tenant real
na VPS. Não é "polimento" — é o que transforma as 4 sprints anteriores em
produto de fato usado.

| HU  | Descrição curta                                                                      | Pts                                     |
| --- | ------------------------------------------------------------------------------------ | --------------------------------------- |
| 9.1 | `docker compose up` completo                                                         | 3                                       |
| 9.2 | HTTPS automático (Caddy + Let's Encrypt)                                             | 2                                       |
| 1.4 | RLS no Postgres                                                                      | 5                                       |
| —   | Testes E2E Cypress dos fluxos críticos (login → abrir caixa → vender → fechar caixa) | — (já coberto como DoD, formaliza aqui) |

**Total: 10 pts.** Ao fim desta sprint, o primeiro mercado real pode usar o
sistema para vender — é aqui que o backlog para de ser "MVP em construção"
e passa a ser "produto em produção com um cliente".

## Sprint 6 — Operadores (gestão completa) + Dashboard

**Objetivo:** Administrador gerencia a equipe sem depender do seed, e
acompanha o negócio pelo Dashboard.

| HU      | Descrição curta                                      | Pts |
| ------- | ---------------------------------------------------- | --- |
| 6.1–6.5 | CRUD de Operador + regra do último admin             | 12  |
| 6.6     | Upload de foto do Operador                           | 3   |
| 6.7     | Excluir operador                                     | 2   |
| 7.1–7.3 | Dashboard (totais, mais vendidos, gráfico da semana) | 8   |

**Total: 25 pts** (dividir em 2 sprints se 25 for grande demais pra 1
semana — ver nota de recalibração abaixo).

## Sprint 7 — Offline-first (PWA)

**Objetivo:** o caixa não para de vender se a internet da loja cair — sem
isso o produto ainda depende de uma condição que o mercado-alvo já provou
não ter garantida.

| HU  | Descrição curta                                    | Pts |
| --- | -------------------------------------------------- | --- |
| 8.1 | Cache de catálogo offline                          | 5   |
| 8.2 | Fila de vendas offline + sincronização idempotente | 8   |
| 8.3 | PWA instalável com identidade do tenant            | 3   |
| 9.3 | Backup diário do banco                             | 2   |
| 9.4 | Deploy automático via CI                           | 3   |

**Total: 21 pts.**

## Depois disso (P2 — backlog, sem sprint fixa ainda)

Logout melhorado, exclusão de operador com histórico, refinos de Dashboard,
Storybook, RLS de defesa em profundidade extra — entram conforme o produto
já em uso pedir, priorizados de novo nesse ponto (não vale planejar P2 em
detalhe agora, o primeiro cliente real vai mudar o que importa).

---

## Nota sobre recalibração

Os pontos por Sprint variam de 10 a 25 — é esperado num backlog recém-
estimado sem histórico de velocidade. Depois da Sprint 2 (primeira sprint
com forma e ritmo comparável), recalcular a velocidade real e redistribuir
Sprint 6 em duas, se necessário, em vez de forçar 25 pontos numa semana.
