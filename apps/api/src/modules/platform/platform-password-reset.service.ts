import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import argon2 from 'argon2'
import { randomBytes } from 'node:crypto'
import type { PlatformResetTokenInfo } from '@pdv/shared'
import { DomainError } from '../../common/errors/domain.error'
import { MailService } from '../mail/mail.service'
import { hashToken } from '../auth/pin-token.service'
import { PlatformAdminRepository } from './platform-admin.repository'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1h — mesmo prazo do RESET de PinToken

const invalidToken = () => new DomainError('INVALID_TOKEN', 'Este link não é válido ou já expirou. Peça um novo.', 400)

// "Esqueci minha senha" do superadmin — mesma mecânica de PinTokenService
// (token aleatório, só o hash SHA-256 salvo, uso único), numa tabela
// paralela sem tenantId (PlatformAdmin fica fora de RLS, de propósito).
// Sem `purpose`: PlatformAdmin sempre tem senha, o token só serve pra reset.
@Injectable()
export class PlatformPasswordResetService {
  private readonly platformHost: string
  private readonly originTemplate: string

  constructor(
    private readonly admins: PlatformAdminRepository,
    private readonly mail: MailService,
    config: ConfigService,
  ) {
    this.platformHost = config.get<string>('PLATFORM_HOST', 'admin.app.localhost')
    this.originTemplate = config.get<string>('WEB_ORIGIN_TEMPLATE', 'https://{host}')
  }

  async sendResetLink(admin: { id: string; name: string; email: string }): Promise<void> {
    const token = randomBytes(32).toString('base64url')
    await this.admins.createResetToken({
      platformAdminId: admin.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    })
    const origin = this.originTemplate.replace('{host}', this.platformHost)
    const link = `${origin}/platform/reset-password?token=${token}`
    await this.mail.send({
      to: admin.email,
      subject: 'Redefinir a sua senha',
      text: `Olá, ${admin.name}!\n\nPara escolher uma nova senha do painel Superadmin, abra este link (vale por 1 hora):\n${link}\n\nSe você não pediu isso, ignore este e-mail: a sua senha continua a mesma.`,
    })
  }

  async inspect(token: string): Promise<PlatformResetTokenInfo> {
    const row = await this.requireUsable(token)
    return { adminName: row.platformAdmin.name }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const row = await this.requireUsable(token)
    await this.admins.consumeResetToken(row.id, row.platformAdmin.id, await argon2.hash(newPassword))
  }

  private async requireUsable(token: string) {
    const row = await this.admins.findResetToken(hashToken(token))
    const usable = row !== null && row.usedAt === null && row.expiresAt.getTime() > Date.now()
    if (!usable) throw invalidToken()
    return row
  }
}
