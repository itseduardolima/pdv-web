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
    const { text, derivedTrace } = normalizeMessage(message)
    const finalTrace = trace ?? derivedTrace
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: text,
      ...(context ? { context } : {}),
      ...(requestId ? { requestId } : {}),
      ...(tenantId ? { tenantId } : {}),
      ...(finalTrace ? { trace: finalTrace } : {}),
    }
    process.stdout.write(`${JSON.stringify(entry)}\n`)
  }
}

// `catch (err) { logger.error(err) }` é o padrão mais comum de chamar isto
// com um Error — as props de Error (message/stack) não são enumeráveis,
// então JSON.stringify(new Error(...)) devolve '{}' e perde tudo. Extrai
// message/stack manualmente antes de cair no caso genérico.
function normalizeMessage(value: unknown): { text: string; derivedTrace?: string } {
  if (typeof value === 'string') return { text: value }
  if (value instanceof Error) return { text: value.message, derivedTrace: value.stack }
  return { text: safeStringify(value) }
}

// JSON.stringify(undefined) (e o de função/Symbol) devolve o valor
// `undefined`, não a string "undefined" — se não tratado, a chave
// `message` inteira some da linha final (JSON.stringify(entry) omite
// chaves com valor undefined), violando o tipo declarado em runtime.
function safeStringify(value: unknown): string {
  try {
    const json = JSON.stringify(value)
    return json === undefined ? String(value) : json
  } catch {
    return String(value)
  }
}
