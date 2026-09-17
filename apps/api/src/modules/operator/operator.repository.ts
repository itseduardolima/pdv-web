import { Inject, Injectable } from '@nestjs/common'
import { Prisma, type Operator, type OperatorRole } from '@prisma/client'
import { PRISMA, type PrismaService } from '../../prisma/prisma.client'

// pinHash nunca sai do Repository: só entra (create / setPin). Sai apenas
// `hasPin`, para a tela saber se o primeiro acesso está pendente.
export type OperatorRow = Omit<Operator, 'pinHash'> & { hasPin: boolean }
const publicSelect = {
  id: true,
  tenantId: true,
  name: true,
  role: true,
  email: true,
  active: true,
  photoUrl: true,
  createdAt: true,
  deletedAt: true,
  anonymizedAt: true,
} as const

// anonymize() só aplica se a linha já estiver soft-deleted e ainda não
// anonimizada (where estendido, mesmo padrão de update()/setActive()
// abaixo) — se o update não achar nenhuma linha assim, o Prisma lança
// P2025, que vira este marker error; o Service traduz em 404/409 conforme
// o motivo real (id inexistente, ainda ativo, ou já anonimizado antes).
export class OperatorNotEligibleForAnonymizationError extends Error {}

export interface NewOperator {
  name: string
  role: OperatorRole
  email: string | null
  pinHash: string | null
  photoUrl: string | null
}

export interface OperatorPatch {
  name?: string
  role?: OperatorRole
  email?: string | null
  photoUrl?: string | null
}

@Injectable()
export class OperatorRepository {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaService) {}

  // Inclui inativos (a tela de gestão mostra o toggle); exclui só os removidos.
  async findMany(tenantId: string): Promise<OperatorRow[]> {
    const rows = await this.prisma.operator.findMany({
      where: { tenantId, deletedAt: null },
      select: rowSelect,
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    })
    return rows.map(toRow)
  }

  async findById(tenantId: string, id: string): Promise<OperatorRow | null> {
    const row = await this.prisma.operator.findFirst({ where: { tenantId, id, deletedAt: null }, select: rowSelect })
    return row ? toRow(row) : null
  }

  // Sem filtro de deletedAt — usado só pelo fluxo de anonimização (LGPD),
  // que precisa achar exatamente quem já foi excluído (o oposto de findById).
  async findAnyById(tenantId: string, id: string): Promise<OperatorRow | null> {
    const row = await this.prisma.operator.findFirst({ where: { tenantId, id }, select: rowSelect })
    return row ? toRow(row) : null
  }

  // Só quem já foi soft-deleted — tela de "operadores excluídos" (LGPD).
  async findDeleted(tenantId: string): Promise<OperatorRow[]> {
    const rows = await this.prisma.operator.findMany({
      where: { tenantId, deletedAt: { not: null } },
      select: rowSelect,
      orderBy: { deletedAt: 'desc' },
    })
    return rows.map(toRow)
  }

  async findByEmail(tenantId: string, email: string): Promise<OperatorRow | null> {
    const row = await this.prisma.operator.findFirst({ where: { tenantId, email }, select: rowSelect })
    return row ? toRow(row) : null
  }

  countActiveAdmins(tenantId: string): Promise<number> {
    return this.prisma.operator.count({ where: { tenantId, role: 'ADMIN', active: true, deletedAt: null } })
  }

  async create(tenantId: string, data: NewOperator): Promise<OperatorRow> {
    return toRow(await this.prisma.operator.create({ data: { ...data, tenantId }, select: rowSelect }))
  }

  async update(tenantId: string, id: string, data: OperatorPatch): Promise<OperatorRow> {
    return toRow(await this.prisma.operator.update({ where: { id, tenantId }, data, select: rowSelect }))
  }

  async setPin(tenantId: string, id: string, pinHash: string): Promise<OperatorRow> {
    return toRow(await this.prisma.operator.update({ where: { id, tenantId }, data: { pinHash }, select: rowSelect }))
  }

  async setActive(tenantId: string, id: string, active: boolean): Promise<OperatorRow> {
    return toRow(await this.prisma.operator.update({ where: { id, tenantId }, data: { active }, select: rowSelect }))
  }

  // Soft-delete: Sale/CashSession continuam apontando para o operador. O
  // e-mail é liberado para um cadastro novo (unique por tenant).
  async softDelete(tenantId: string, id: string): Promise<OperatorRow> {
    return toRow(
      await this.prisma.operator.update({
        where: { id, tenantId },
        data: { deletedAt: new Date(), active: false, email: null },
        select: rowSelect,
      }),
    )
  }

  // LGPD (08-seguranca § 13): zera name/photoUrl/pinHash — nunca apaga a
  // linha (Sale/CashSession referenciam Operator sem cascade). O where
  // estendido (deletedAt/anonymizedAt) é a guarda de verdade contra
  // anonimizar alguém ainda ativo ou anonimizar duas vezes; o Service já
  // checa isso antes pra dar uma mensagem específica, isto aqui é o
  // backstop contra corrida entre o check e o update.
  async anonymize(tenantId: string, id: string): Promise<OperatorRow> {
    try {
      return toRow(
        await this.prisma.operator.update({
          where: { id, tenantId, deletedAt: { not: null }, anonymizedAt: null },
          data: { name: 'Operador removido', photoUrl: null, pinHash: null, anonymizedAt: new Date() },
          select: rowSelect,
        }),
      )
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new OperatorNotEligibleForAnonymizationError()
      }
      throw error
    }
  }
}

// Só lê se o hash existe; o valor nunca chega ao Service.
const rowSelect = { ...publicSelect, pinHash: true } as const
type RawRow = Omit<Operator, 'pinHash'> & { pinHash: string | null }

function toRow({ pinHash, ...row }: RawRow): OperatorRow {
  return { ...row, hasPin: pinHash !== null }
}
