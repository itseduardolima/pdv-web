export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export class NotFoundError extends DomainError {
  constructor(code: string, message: string) {
    super(code, message, 404)
  }
}

export class ConflictError extends DomainError {
  constructor(code: string, message: string) {
    super(code, message, 409)
  }
}

export class ForbiddenError extends DomainError {
  constructor(code: string, message: string) {
    super(code, message, 403)
  }
}

export class UnauthorizedError extends DomainError {
  constructor(code = 'UNAUTHENTICATED', message = 'Faça login para continuar.') {
    super(code, message, 401)
  }
}
