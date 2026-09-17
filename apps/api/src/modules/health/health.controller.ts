import { Controller, Get } from '@nestjs/common'
import { ApiExcludeEndpoint } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'
import { HealthService } from './health.service'

// 09-operacao § 1: fora do TenantMiddleware (não faz sentido exigir tenant
// pra saber se o serviço está vivo) e usado por um monitor de uptime
// externo — nunca deve exigir autenticação nem tenant resolvido.
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Public()
  @Get()
  @ApiExcludeEndpoint()
  async check(): Promise<{ status: 'ok' }> {
    await this.health.checkDatabase()
    return { status: 'ok' }
  }
}
