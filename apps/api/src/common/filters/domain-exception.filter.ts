import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import type { Response } from 'express'
import { ZodValidationException } from 'nestjs-zod'
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
        details: exception.getZodError().flatten(),
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
