import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'node:crypto'
import { tenantStorage } from '../../common/tenant-context'
import { createPrismaClient } from '../../prisma/prisma.client'

// Guarda de regressão pro achado do code review de 2026-09-17: nenhum spec
// unitário deste módulo toca Postgres de verdade (Prisma sempre mockado),
// então nada detectava se alguém removesse o `tenantStorage.run(...)` que
// PlatformTenantService.create() usa antes de PinTokenService.sendPinLink
// (Operator/PinToken têm FORCE ROW LEVEL SECURITY, e rotas /platform/* não
// passam pelo TenantMiddleware — sem o wrap, a query roda com
// app.tenant_id indefinido e o Postgres recusa toda linha, silenciosamente
// pro código que só olha o retorno vazio). Este teste bate no banco de
// verdade e prova as duas pontas: sem o wrap, RLS bloqueia; com o wrap
// (await DENTRO do callback), a query funciona.
//
// Fora do `pnpm test`/CI padrão (nenhum Postgres disponível lá) — roda com
// `pnpm test:integration`, banco de dev no ar (mesmo DATABASE_URL do
// `.env`, que o @prisma/client carrega sozinho).
describe('RLS em rota fora do TenantMiddleware (integração real)', () => {
  const setup = new PrismaClient()
  const rls = createPrismaClient()
  let tenantId: string
  let operatorId: string

  beforeAll(async () => {
    const tenant = await setup.tenant.create({
      data: { slug: `rls-test-${randomUUID().slice(0, 8)}`, name: 'RLS Integration Test' },
    })
    tenantId = tenant.id
    await setup.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`
      const operator = await tx.operator.create({
        data: { tenantId, name: 'Admin RLS Test', role: 'ADMIN', pinHash: 'x' },
      })
      operatorId = operator.id
    })
  })

  afterAll(async () => {
    await setup.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`
      await tx.operator.deleteMany({ where: { tenantId } })
    })
    await setup.tenant.delete({ where: { id: tenantId } })
    await setup.$disconnect()
    await rls.$disconnect()
  })

  it('sem tenantStorage.run, a query roda sem app.tenant_id e RLS não devolve nada', async () => {
    const count = await rls.operator.count({ where: { id: operatorId } })
    expect(count).toBe(0)
  })

  it('com tenantStorage.run (await dentro do callback), a query enxerga a linha', async () => {
    const count = await tenantStorage.run({ tenantId }, async () => {
      return rls.operator.count({ where: { id: operatorId } })
    })
    expect(count).toBe(1)
  })

  it('devolver a PrismaPromise sem await dentro do callback perde o contexto (a pegadinha documentada em 08-seguranca.md)', async () => {
    // Deliberadamente sem await dentro do callback — é o que este teste prova.
    const count = await tenantStorage.run({ tenantId }, () => rls.operator.count({ where: { id: operatorId } }))
    expect(count).toBe(0)
  })
})
