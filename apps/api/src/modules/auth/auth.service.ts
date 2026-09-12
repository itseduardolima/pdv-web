import { Injectable, OnModuleInit } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import argon2 from 'argon2'
import type { CurrentSession, ForgotPinInput, LoginInput, LoginOperator } from '@pdv/shared'
import { DomainError, UnauthorizedError } from '../../common/errors/domain.error'
import type { OperatorSession } from '../../common/types/request'
import { AuthRepository, type SessionOperatorRow } from './auth.repository'
import { LoginAttemptTracker } from './login-attempt.tracker'
import { PinTokenService } from './pin-token.service'

export interface LoginResult {
  token: string
  session: CurrentSession
}

export class TooManyAttemptsError extends DomainError {
  constructor() {
    super('TOO_MANY_ATTEMPTS', 'Muitas tentativas. Aguarde 60 segundos e tente de novo.', 429)
  }
}

const INVALID_CREDENTIALS = () => new UnauthorizedError('INVALID_CREDENTIALS', 'PIN incorreto.')

@Injectable()
export class AuthService implements OnModuleInit {
  // Hash fictício verificado quando o operador não existe, para o tempo de
  // resposta não revelar quais ids são válidos (08-seguranca § 4).
  private dummyHash = ''

  constructor(
    private readonly operators: AuthRepository,
    private readonly attempts: LoginAttemptTracker,
    private readonly jwt: JwtService,
    private readonly pinTokens: PinTokenService,
  ) {}

  async onModuleInit() {
    this.dummyHash = await argon2.hash('0000')
  }

  listOperators(tenantId: string): Promise<LoginOperator[]> {
    return this.operators.findActiveOperators(tenantId)
  }

  async login(tenantId: string, input: LoginInput): Promise<LoginResult> {
    if (this.attempts.isLocked(tenantId, input.operatorId)) throw new TooManyAttemptsError()

    const operator = await this.operators.findOperatorForLogin(tenantId, input.operatorId)
    // Sem pinHash = primeiro acesso pendente: não entra até definir o PIN.
    const usable = operator !== null && operator.active && operator.deletedAt === null && operator.pinHash !== null
    const hash = operator?.pinHash ?? this.dummyHash
    const pinMatches = await argon2.verify(hash, input.pin)

    // Mesmo erro para qualquer causa: nunca revelar se o operador existe.
    if (!usable || !pinMatches) {
      this.attempts.recordFailure(tenantId, input.operatorId)
      throw INVALID_CREDENTIALS()
    }

    this.attempts.reset(tenantId, input.operatorId)
    const token = await this.jwt.signAsync({ sub: operator.id, tenantId, role: operator.role })
    return { token, session: this.toSession(tenantId, operator) }
  }

  // Sempre resolve sem erro: a resposta não pode dizer se o e-mail existe.
  async forgotPin(tenantId: string, input: ForgotPinInput): Promise<void> {
    const operator = await this.operators.findOperatorByEmail(tenantId, input.email)
    if (!operator || !operator.active || operator.deletedAt !== null) return
    await this.pinTokens.sendPinLink(tenantId, operator)
  }

  async me(session: OperatorSession): Promise<CurrentSession> {
    const operator = await this.operators.findSessionOperator(session.tenantId, session.id)
    // Operador inativado/excluído depois do login perde a sessão na hora.
    if (!operator) throw new UnauthorizedError('INVALID_SESSION', 'Sessão inválida. Faça login novamente.')
    return this.toSession(session.tenantId, operator)
  }

  private toSession(tenantId: string, operator: SessionOperatorRow): CurrentSession {
    return {
      operator: { id: operator.id, name: operator.name, role: operator.role, photoUrl: operator.photoUrl },
      tenantId,
    }
  }
}
