import { PrismaClient } from '@prisma/client'
import { tenantStorage } from '../common/tenant-context'

// Extensão de RLS (08-seguranca § 1): toda operação de model roda com
// `app.tenant_id` setado na mesma transação, e as policies do Postgres
// recusam qualquer linha de outro tenant — mesmo se um Repository esquecer
// o filtro. Sem tenant no contexto (seed, resolução de tenant) nada é
// setado: as tabelas com RLS simplesmente não retornam linhas.
export function createPrismaClient() {
  const base = new PrismaClient()
  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query, ...rest }) {
          const tenantId = tenantStorage.getStore()?.tenantId
          // Dentro de uma transação interativa quem seta o tenant é o próprio
          // callback (ver withTenant); aqui só passamos adiante.
          const inTransaction = Boolean(
            (rest as { __internalParams?: { transaction?: unknown } }).__internalParams?.transaction,
          )
          if (!tenantId || inTransaction) return query(args)
          const [, result] = await base.$transaction([
            base.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`,
            query(args),
          ])
          return result
        },
      },
    },
  })
}

export type PrismaService = ReturnType<typeof createPrismaClient>
export type PrismaTransaction = Parameters<Parameters<PrismaService['$transaction']>[0]>[0]
export const PRISMA = Symbol('PRISMA')

// Seta o tenant no início de uma transação interativa (obrigatório para as
// policies valerem dentro dela).
export function setTenantInTransaction(tx: PrismaTransaction, tenantId: string) {
  return tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`
}
