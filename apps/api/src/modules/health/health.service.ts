import { Inject, Injectable } from '@nestjs/common'
import { PRISMA, type PrismaService } from '../../prisma/prisma.client'

// SELECT 1 puro, sem tenant (fora de qualquer contexto de tenantStorage —
// não faz sentido "escolher" uma loja só para provar que o Postgres
// responde). Se o Postgres estiver fora do ar, a promise rejeita e o
// DomainExceptionFilter já transforma isso em 500 INTERNAL_ERROR sozinho
// (nunca um healthcheck que só confirma "o processo Node está de pé").
@Injectable()
export class HealthService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaService) {}

  async checkDatabase(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`
  }
}
