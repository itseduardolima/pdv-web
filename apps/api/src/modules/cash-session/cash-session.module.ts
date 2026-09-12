import { Module } from '@nestjs/common'
import { CashSessionController } from './cash-session.controller'
import { CashSessionRepository } from './cash-session.repository'
import { CashSessionService } from './cash-session.service'

@Module({
  controllers: [CashSessionController],
  providers: [CashSessionRepository, CashSessionService],
  exports: [CashSessionService],
})
export class CashSessionModule {}
