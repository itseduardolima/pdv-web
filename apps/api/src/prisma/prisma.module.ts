import { Global, Module, type OnApplicationShutdown, type OnModuleInit, Inject } from '@nestjs/common'
import { createPrismaClient, PRISMA, type PrismaService } from './prisma.client'

class PrismaLifecycle implements OnModuleInit, OnApplicationShutdown {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaService) {}
  onModuleInit() {
    return this.prisma.$connect()
  }
  onApplicationShutdown() {
    return this.prisma.$disconnect()
  }
}

@Global()
@Module({
  providers: [{ provide: PRISMA, useFactory: createPrismaClient }, PrismaLifecycle],
  exports: [PRISMA],
})
export class PrismaModule {}
