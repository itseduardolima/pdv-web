import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { ZodValidationPipe } from 'nestjs-zod'
import { PrismaModule } from './prisma/prisma.module'
import { DomainExceptionFilter } from './common/filters/domain-exception.filter'
import { AuthGuard } from './common/guards/auth.guard'
import { RolesGuard } from './common/guards/roles.guard'
import { TenantMiddleware } from './common/middlewares/tenant.middleware'
import { TenantModule } from './modules/tenant/tenant.module'
import { AuthModule } from './modules/auth/auth.module'
import { ProductModule } from './modules/product/product.module'
import { CashSessionModule } from './modules/cash-session/cash-session.module'
import { StorageModule } from './modules/storage/storage.module'
import { SaleModule } from './modules/sale/sale.module'
import { OperatorModule } from './modules/operator/operator.module'

// Módulos de domínio (operator) entram
// aqui conforme forem criados, um por vez.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // RATE_LIMIT_ENABLED: seguro por padrão (true) se a env não existir —
    // só o .env de desenvolvimento local desliga, para não travar em 429
    // durante uma sessão de testes manuais/E2E repetidos. CI e produção
    // nunca desligam (a env não é setada lá).
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const enabled = config.get<string>('RATE_LIMIT_ENABLED', 'true') !== 'false'
        return [{ ttl: 60_000, limit: 120, skipIf: () => !enabled }]
      },
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('SESSION_SECRET'),
        signOptions: { expiresIn: `${config.get<number>('SESSION_TTL_HOURS', 12)}h` },
      }),
    }),
    PrismaModule,
    TenantModule,
    AuthModule,
    ProductModule,
    OperatorModule,
    CashSessionModule,
    StorageModule,
    SaleModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  // Toda rota exige tenant resolvido; só o Swagger fica fora.
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).exclude('docs', 'docs/{*path}', 'tenant/tls-check').forRoutes('*path')
  }
}
