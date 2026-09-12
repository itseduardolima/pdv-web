import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthRepository } from './auth.repository'
import { AuthService } from './auth.service'
import { LoginAttemptTracker } from './login-attempt.tracker'
import { PinTokenService } from './pin-token.service'

@Module({
  controllers: [AuthController],
  providers: [AuthRepository, AuthService, LoginAttemptTracker, PinTokenService],
  exports: [PinTokenService],
})
export class AuthModule {}
