import { Module } from '@nestjs/common'
import { CashSessionModule } from '../cash-session/cash-session.module'
import { TenantModule } from '../tenant/tenant.module'
import { SaleController } from './sale.controller'
import { SaleRepository } from './sale.repository'
import { SaleService } from './sale.service'

@Module({
  imports: [CashSessionModule, TenantModule],
  controllers: [SaleController],
  providers: [SaleRepository, SaleService],
  exports: [SaleService],
})
export class SaleModule {}
