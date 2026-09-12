import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthRepository } from './auth.repository'
import { AuthService } from './auth.service'
import { LoginAttemptTracker } from './login-attempt.tracker'

@Module({
  controllers: [AuthController],
  providers: [AuthRepository, AuthService, LoginAttemptTracker],
})
export class AuthModule {}
