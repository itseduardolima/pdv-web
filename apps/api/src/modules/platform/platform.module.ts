import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PlatformAuthGuard } from '../../common/guards/platform-auth.guard'
import { TenantModule } from '../tenant/tenant.module'
import { PlatformAdminRepository } from './platform-admin.repository'
import { PlatformAuthController } from './platform-auth.controller'
import { PlatformAuthService } from './platform-auth.service'
import { PlatformTenantController } from './platform-tenant.controller'
import { PlatformTenantService } from './platform-tenant.service'

@Module({
  imports: [
    // JwtModule própria (não-global, segredo separado do de operador) — um
    // vazamento da sessão de loja não deve conseguir forjar a de plataforma,
    // e vice-versa. Como não é `global: true`, o JwtService daqui só é
    // visível para os providers deste módulo (sombra a instância global do
    // AppModule só dentro do PlatformModule).
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('PLATFORM_SESSION_SECRET'),
        signOptions: { expiresIn: `${config.get<number>('PLATFORM_SESSION_TTL_HOURS', 8)}h` },
      }),
    }),
    // Só pra chamar tenants.clearHostCache() ao suspender/reativar uma loja
    // (HU 13.7) — sem isso "reativar restaura o acesso na hora" não valeria.
    TenantModule,
  ],
  controllers: [PlatformAuthController, PlatformTenantController],
  providers: [PlatformAdminRepository, PlatformAuthService, PlatformTenantService, PlatformAuthGuard],
})
export class PlatformModule {}
