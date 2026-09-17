import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { StorageModule } from '../storage/storage.module'
import { OperatorController } from './operator.controller'
import { OperatorRepository } from './operator.repository'
import { OperatorService } from './operator.service'

@Module({
  // StorageModule: anonymize() (LGPD) apaga a foto de verdade do bucket.
  imports: [AuthModule, StorageModule],
  controllers: [OperatorController],
  providers: [OperatorRepository, OperatorService],
  exports: [OperatorService],
})
export class OperatorModule {}
