import { HealthService } from './health.service'
import type { PrismaService } from '../../prisma/prisma.client'

describe('HealthService', () => {
  it('resolves when the database answers SELECT 1', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) }
    const service = new HealthService(prisma as unknown as PrismaService)
    await expect(service.checkDatabase()).resolves.toBeUndefined()
  })

  it('propagates the error when the database is unreachable (never swallows the failure)', async () => {
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(new Error('connection refused')) }
    const service = new HealthService(prisma as unknown as PrismaService)
    await expect(service.checkDatabase()).rejects.toThrow('connection refused')
  })
})
