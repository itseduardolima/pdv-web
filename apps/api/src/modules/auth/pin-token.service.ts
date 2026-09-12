import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import argon2 from 'argon2'
import { createHash, randomBytes } from 'node:crypto'
import type { PinTokenPurpose } from '@prisma/client'
import type { PinTokenInfo } from '@pdv/shared'
import { DomainError } from '../../common/errors/domain.error'
import { MailService } from '../mail/mail.service'
import { AuthRepository, type OperatorForPinLink } from './auth.repository'

export const PIN_TOKEN_TTL_MS: Record<PinTokenPurpose, number> = {
  FIRST_ACCESS: 72 * 60 * 60 * 1000,
  RESET: 60 * 60 * 1000,
}

const invalidToken = () => new DomainError('INVALID_TOKEN', 'Este link não é válido ou já expirou. Peça um novo.', 400)

// Links de "primeiro acesso" e "esqueci meu PIN" (03-regras-negocio § Autenticação).
// O token bruto só existe no e-mail; o banco guarda o SHA-256.
@Injectable()
export class PinTokenService {
  private readonly baseDomain: string
  private readonly originTemplate: string

  constructor(
    private readonly auth: AuthRepository,
    private readonly mail: MailService,
    config: ConfigService,
  ) {
    this.baseDomain = config.get<string>('APP_BASE_DOMAIN', 'app.localhost')
    this.originTemplate = config.get<string>('WEB_ORIGIN_TEMPLATE', 'https://{host}')
  }

  // Emite o link para um operador com e-mail. Quem chama já decidiu que pode
  // (admin pedindo, ou "esqueci" com e-mail que bate). Sem PIN ainda é
  // primeiro acesso; com PIN é reset.
  async sendPinLink(tenantId: string, operator: OperatorForPinLink): Promise<void> {
    if (!operator.email) throw new DomainError('NO_EMAIL', 'Este operador não tem e-mail cadastrado.', 409)
    const purpose: PinTokenPurpose = operator.pinHash ? 'RESET' : 'FIRST_ACCESS'
    const token = randomBytes(32).toString('base64url')
    await this.auth.createPinToken(tenantId, {
      operatorId: operator.id,
      tokenHash: hashToken(token),
      purpose,
      expiresAt: new Date(Date.now() + PIN_TOKEN_TTL_MS[purpose]),
    })
    const host = (await this.auth.findTenantHost(tenantId, this.baseDomain)) ?? this.baseDomain
    const link = `${this.originTemplate.replace('{host}', host)}/set-pin?token=${token}`
    await this.mail.send(
      purpose === 'FIRST_ACCESS'
        ? {
            to: operator.email,
            subject: 'Seu acesso ao caixa',
            text: `Olá, ${operator.name}!\n\nVocê foi cadastrado no caixa. Defina o seu PIN de 4 dígitos neste link (vale por 3 dias):\n${link}\n\nSe não esperava este e-mail, ignore.`,
          }
        : {
            to: operator.email,
            subject: 'Redefinir o seu PIN',
            text: `Olá, ${operator.name}!\n\nPara escolher um novo PIN, abra este link (vale por 1 hora):\n${link}\n\nSe você não pediu isso, ignore este e-mail: o seu PIN continua o mesmo.`,
          },
    )
  }

  async inspect(tenantId: string, token: string): Promise<PinTokenInfo> {
    const row = await this.requireUsable(tenantId, token)
    return { operatorName: row.operator.name, purpose: row.purpose }
  }

  async setPin(tenantId: string, token: string, pin: string): Promise<void> {
    const row = await this.requireUsable(tenantId, token)
    await this.auth.consumePinToken(tenantId, row.id, row.operator.id, await argon2.hash(pin))
  }

  private async requireUsable(tenantId: string, token: string) {
    const row = await this.auth.findPinToken(tenantId, hashToken(token))
    const usable =
      row !== null &&
      row.usedAt === null &&
      row.expiresAt.getTime() > Date.now() &&
      row.operator.active &&
      row.operator.deletedAt === null
    if (!usable) throw invalidToken()
    return row
  }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
