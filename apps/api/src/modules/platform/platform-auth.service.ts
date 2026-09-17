import { Injectable, OnModuleInit } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import argon2 from 'argon2'
import type {
  ChangePlatformAdminPasswordInput,
  PlatformAdmin as PlatformAdminResponse,
  PlatformForgotPasswordInput,
  PlatformLoginInput,
  UpdatePlatformAdminInput,
} from '@pdv/shared'
import { ConflictError, UnauthorizedError } from '../../common/errors/domain.error'
import type { PlatformSession } from '../../common/types/platform-request'
import { PlatformAdminRepository } from './platform-admin.repository'
import { PlatformPasswordResetService } from './platform-password-reset.service'

export interface PlatformLoginResult {
  token: string
  admin: PlatformAdminResponse
}

interface PlatformAdminRow {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: Date
}

// Mesma resposta genérica para qualquer causa de falha (e-mail inexistente
// ou senha errada) — nunca revela se a conta existe (mesmo raciocínio do
// login de operador, auth.service.ts).
const INVALID_CREDENTIALS = () => new UnauthorizedError('INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
const emailInUse = () => new ConflictError('EMAIL_IN_USE', 'Já existe uma conta com este e-mail.')
// Diferente de INVALID_CREDENTIALS (login): aqui a sessão já está
// autenticada, só a senha atual informada no formulário está errada.
const invalidCurrentPassword = () => new UnauthorizedError('INVALID_CURRENT_PASSWORD', 'Senha atual incorreta.')

@Injectable()
export class PlatformAuthService implements OnModuleInit {
  private dummyHash = ''

  constructor(
    private readonly admins: PlatformAdminRepository,
    private readonly jwt: JwtService,
    private readonly resetTokens: PlatformPasswordResetService,
  ) {}

  async onModuleInit() {
    this.dummyHash = await argon2.hash('senha-nunca-usada-so-para-o-tempo-de-resposta')
  }

  async login(input: PlatformLoginInput): Promise<PlatformLoginResult> {
    const admin = await this.admins.findByEmail(input.email)
    const hash = admin?.passwordHash ?? this.dummyHash
    const passwordMatches = await argon2.verify(hash, input.password)
    if (!admin || !passwordMatches) throw INVALID_CREDENTIALS()

    // Payload sem tenantId, de propósito — essa sessão não pertence a
    // nenhuma loja (PlatformAuthGuard nunca chama getTenantId()).
    const token = await this.jwt.signAsync({ sub: admin.id })
    return { token, admin: this.toPublic(admin) }
  }

  async me(session: PlatformSession): Promise<PlatformAdminResponse> {
    const admin = await this.admins.findById(session.id)
    if (!admin) throw new UnauthorizedError('INVALID_SESSION', 'Sessão inválida. Faça login novamente.')
    return this.toPublic(admin)
  }

  // Nome/e-mail — troca de senha é changePassword(), regra de segurança
  // diferente (exige a senha atual).
  async updateProfile(session: PlatformSession, input: UpdatePlatformAdminInput): Promise<PlatformAdminResponse> {
    const admin = await this.admins.findById(session.id)
    if (!admin) throw new UnauthorizedError('INVALID_SESSION', 'Sessão inválida. Faça login novamente.')

    if (input.email !== admin.email) {
      const existing = await this.admins.findByEmail(input.email)
      if (existing && existing.id !== admin.id) throw emailInUse()
    }

    const updated = await this.admins.update(admin.id, { name: input.name, email: input.email })
    return this.toPublic(updated)
  }

  async changePassword(
    session: PlatformSession,
    input: ChangePlatformAdminPasswordInput,
  ): Promise<PlatformAdminResponse> {
    const admin = await this.admins.findById(session.id)
    if (!admin) throw new UnauthorizedError('INVALID_SESSION', 'Sessão inválida. Faça login novamente.')

    const currentPasswordMatches = await argon2.verify(admin.passwordHash, input.currentPassword)
    if (!currentPasswordMatches) throw invalidCurrentPassword()

    const passwordHash = await argon2.hash(input.newPassword)
    const updated = await this.admins.update(admin.id, { passwordHash })
    return this.toPublic(updated)
  }

  // Sempre resolve, exista ou não a conta — mesma resposta genérica de
  // AuthService.forgotPin (08-seguranca § 4), nunca revela se o e-mail existe.
  async forgotPassword(input: PlatformForgotPasswordInput): Promise<void> {
    const admin = await this.admins.findByEmail(input.email)
    if (!admin) return
    await this.resetTokens.sendResetLink(admin)
  }

  private toPublic(admin: PlatformAdminRow): PlatformAdminResponse {
    return { id: admin.id, email: admin.email, name: admin.name, createdAt: admin.createdAt.toISOString() }
  }
}
