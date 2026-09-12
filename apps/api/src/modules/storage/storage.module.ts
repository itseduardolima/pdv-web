import { Module } from '@nestjs/common'
import { StorageClient } from './storage.client'
import { StorageController } from './storage.controller'
import { StorageService } from './storage.service'

@Module({
  controllers: [StorageController],
  providers: [StorageClient, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
