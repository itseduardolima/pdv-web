import { Injectable } from '@nestjs/common'

export const MAX_LOGIN_ATTEMPTS = 5
export const LOGIN_WINDOW_MS = 60_000

interface AttemptState {
  failures: number
  windowStartedAt: number
}

// Rate-limit por operador (03-regras-negocio § Autenticação): 5 falhas em 60s
// bloqueiam a próxima tentativa. Em memória — a API roda numa instância só.
@Injectable()
export class LoginAttemptTracker {
  private readonly attempts = new Map<string, AttemptState>()

  isLocked(tenantId: string, operatorId: string): boolean {
    const state = this.attempts.get(this.key(tenantId, operatorId))
    if (!state) return false
    if (this.expired(state)) {
      this.attempts.delete(this.key(tenantId, operatorId))
      return false
    }
    return state.failures >= MAX_LOGIN_ATTEMPTS
  }

  recordFailure(tenantId: string, operatorId: string): void {
    const key = this.key(tenantId, operatorId)
    const state = this.attempts.get(key)
    if (!state || this.expired(state)) {
      this.attempts.set(key, { failures: 1, windowStartedAt: Date.now() })
      return
    }
    state.failures += 1
  }

  reset(tenantId: string, operatorId: string): void {
    this.attempts.delete(this.key(tenantId, operatorId))
  }

  private key(tenantId: string, operatorId: string): string {
    return `${tenantId}:${operatorId}`
  }

  private expired(state: AttemptState): boolean {
    return Date.now() - state.windowStartedAt >= LOGIN_WINDOW_MS
  }
}
