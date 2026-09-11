# pdv-web

Sistema PDV web, multi-tenant e white-label, para pequenos mercados
("mercadinhos") sem sistema informatizado hoje. Implementação real do
protótipo de design validado (Claude Artifact) do repositório irmão
`../pdv-mercadinho` (mockup estático, não código de produção — não copiar
HTML dele, ele é referência visual, ver `docs/specs/`).

## Antes de qualquer alteração, leia

Todo o contexto de produto, arquitetura e decisão já tomada está em
`docs/specs/`, nesta ordem de leitura:

1. `docs/specs/00-visao-geral.md` — o que é, por quê, o que é fora de escopo
2. `docs/specs/01-arquitetura.md` — como as peças se encaixam (Next.js
   full-stack, multi-tenant, offline-first no caixa)
3. `docs/specs/02-tecnologias.md` — stack escolhida e por quê
4. `docs/specs/03-regras-negocio.md` — **fonte da verdade de comportamento**
   (papéis, caixa, venda, produtos, operadores) — qualquer feature nova
   precisa ser consistente com isso ou precisa atualizar este arquivo junto
5. `docs/specs/04-padroes-codigo.md` — estrutura de pastas, nomenclatura,
   convenções de commit e teste
6. `docs/specs/05-componentizacao.md` — como reusar componentes entre
   desktop/tablet/celular sem duplicar
7. `docs/specs/06-design-system-temas.md` — tokens visuais e como o tema
   troca por tenant
8. `docs/specs/07-multitenant-whitelabel.md` — isolamento de dado e como
   revender para outro mercado

Se uma tarefa contradiz algo escrito em `docs/specs/`, o spec vence — ou a
tarefa é, na verdade, "atualizar o spec" (avisar o usuário disso).

## Regras que não estão em nenhum spec, mas valem sempre

- **Nunca hardcode nome de mercado, cor de marca ou logo em componente.**
  Isso é o requisito central do produto (white-label) — ver spec 06 e 07.
  Se você está prestes a escrever `#e6e51e` ou `"Mercadinho PDV"` fora de
  `styles/theme.css` / seed de tenant default, pare e use o token/tenant.
- **Toda query de banco passa por `server/repositories/*` com `tenantId`
  obrigatório.** Nunca escrever uma query Prisma direto numa rota/action.
- **Regra de negócio sensível (permissão de admin, imutabilidade de caixa
  fechado, estoque não-negativo) é validada no servidor, não só escondida na
  UI.** Ver spec 03.
- **Um componente por conceito, responsivo — não um componente por
  breakpoint.** Ver spec 05.

## Comandos (preencher conforme o projeto for scaffolded)

```bash
pnpm install
pnpm dev            # Next.js em modo dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test           # Vitest (server/domain)
pnpm test:e2e       # Playwright
pnpm db:migrate     # prisma migrate dev
pnpm db:studio      # prisma studio
```

## Estado atual do projeto

Fase de especificação concluída (`docs/specs/`). Scaffold de código
(Next.js + Prisma + Tailwind) ainda não iniciado — próximo passo natural é
`pnpm create next-app` seguindo a estrutura de `04-padroes-codigo.md` e o
schema inicial descrito em `07-multitenant-whitelabel.md`.
