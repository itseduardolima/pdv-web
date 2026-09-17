import type { LoggerService, LogLevel } from '@nestjs/common'
import { getRequestId } from '../request-context'
import { tenantStorage } from '../tenant-context'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: string
  requestId?: string
  tenantId?: string
  trace?: string
}

// debug/verbose só em desenvolvimento (08-seguranca § 9: nunca debug/query
// do Prisma em produção); log/warn/error/fatal sempre.
const PRODUCTION_LEVELS: LogLevel[] = ['log', 'warn', 'error', 'fatal']

// Substitui o logger padrão do Nest (app.useLogger em main.ts) — toda linha
// vira JSON com timestamp/level/tenantId/requestId (09-operacao § 3),
// correlacionável sem grep manual de timestamp. Nunca loga PIN, token de
// sessão nem corpo de request de login/pagamento — quem chama continua
// responsável por nunca passar isso como `message` (mesma regra de sempre).
export class StructuredLogger implements LoggerService {
  private readonly isProduction: boolean

  constructor(isProduction = process.env.NODE_ENV === 'production') {
    this.isProduction = isProduction
  }

  log(message: unknown, context?: string) {
    this.write('log', message, context)
  }

  error(message: unknown, trace?: string, context?: string) {
    this.write('error', message, context, trace)
  }

  warn(message: unknown, context?: string) {
    this.write('warn', message, context)
  }

  debug(message: unknown, context?: string) {
    this.write('debug', message, context)
  }

  verbose(message: unknown, context?: string) {
    this.write('verbose', message, context)
  }

  fatal(message: unknown, context?: string) {
    this.write('fatal', message, context)
  }

  private write(level: LogLevel, message: unknown, context?: string, trace?: string) {
    if (this.isProduction && !PRODUCTION_LEVELS.includes(level)) return

    const requestId = getRequestId()
    const tenantId = tenantStorage.getStore()?.tenantId
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: typeof message === 'string' ? message : safeStringify(message),
      ...(context ? { context } : {}),
      ...(requestId ? { requestId } : {}),
      ...(tenantId ? { tenantId } : {}),
      ...(trace ? { trace } : {}),
    }
    process.stdout.write(`${JSON.stringify(entry)}\n`)
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
