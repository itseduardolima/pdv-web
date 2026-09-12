import { Module } from '@nestjs/common'
import { OperatorController } from './operator.controller'
import { OperatorRepository } from './operator.repository'
import { OperatorService } from './operator.service'

@Module({
  controllers: [OperatorController],
  providers: [OperatorRepository, OperatorService],
  exports: [OperatorService],
})
export class OperatorModule {}
