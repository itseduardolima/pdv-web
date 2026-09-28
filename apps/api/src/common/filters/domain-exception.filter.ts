import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import type { Response } from 'express'
import { ZodValidationException } from 'nestjs-zod'
import type { ZodError } from 'zod'
import type { ApiError } from '@pdv/shared'
import { DomainError } from '../errors/domain.error'

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>()
    const body = this.toBody(exception)
    // Erro inesperado: o cliente recebe a mensagem genérica, o log recebe a causa (09-operacao § 3).
    if (body.code === 'INTERNAL_ERROR') {
      this.logger.error(exception instanceof Error ? (exception.stack ?? exception.message) : String(exception))
    }
    response.status(body.statusCode).json(body)
  }

  private toBody(exception: unknown): ApiError {
    if (exception instanceof DomainError) {
      return {
        statusCode: exception.statusCode,
        code: exception.code,
        message: exception.message,
        ...(exception.details ? { details: exception.details } : {}),
      }
    }
    if (exception instanceof ZodValidationException) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION',
        message: 'Dados inválidos.',
        details: validationDetails(exception.getZodError()),
      }
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      return { statusCode: status, code: codeForStatus(status), message: exception.message }
    }
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Ocorreu um erro inesperado.',
    }
  }
}

function codeForStatus(status: number): string {
  switch (status) {
    case 401:
      return 'UNAUTHENTICATED'
    case 403:
      return 'FORBIDDEN'
    case 404:
      return 'NOT_FOUND'
    case 429:
      return 'TOO_MANY_REQUESTS'
    default:
      return 'HTTP_ERROR'
  }
}

// `flatten()` só devolve a chave de 1º nível (ex.: `partialPayments`), o que
// não diz QUAL item da lista errou. Somamos as chaves com caminho
// (`partialPayments.0.method`) para a tela marcar o campo certo; as chaves
// de 1º nível continuam iguais, então nada existente muda.
export function validationDetails(error: ZodError) {
  const flat = error.flatten()
  const nested: Record<string, string[]> = {}
  for (const issue of error.issues) {
    if (issue.path.length < 2) continue
    const key = issue.path.join('.')
    nested[key] = [...(nested[key] ?? []), issue.message]
  }
  return { ...flat, fieldErrors: { ...flat.fieldErrors, ...nested } }
}
