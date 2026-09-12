import { Module } from '@nestjs/common'
import { TenantResolver } from '../../common/tenant-context'
import { TenantController } from './tenant.controller'
import { TenantRepository } from './tenant.repository'
import { TenantService } from './tenant.service'

@Module({
  controllers: [TenantController],
  providers: [TenantRepository, TenantService, { provide: TenantResolver, useExisting: TenantService }],
  exports: [TenantService, TenantResolver],
})
export class TenantModule {}
