import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { OperatorController } from './operator.controller'
import { OperatorRepository } from './operator.repository'
import { OperatorService } from './operator.service'

@Module({
  imports: [AuthModule],
  controllers: [OperatorController],
  providers: [OperatorRepository, OperatorService],
  exports: [OperatorService],
})
export class OperatorModule {}
