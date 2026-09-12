import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createTransport, type Transporter } from 'nodemailer'

export interface MailMessage {
  to: string
  subject: string
  text: string
}

export type MailTransportKind = 'log' | 'smtp'

// Único ponto que envia e-mail. `log` (padrão em dev/teste) só escreve no
// console — o link aparece no log da API; `smtp` usa um provedor externo
// (09-operacao § SMTP). Sem HTML: texto puro entrega melhor e não abre
// superfície de injeção.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  readonly transportKind: MailTransportKind
  private readonly from: string
  private readonly smtp: Transporter | null

  constructor(config: ConfigService) {
    this.transportKind = config.get<string>('MAIL_TRANSPORT') === 'smtp' ? 'smtp' : 'log'
    this.from = config.get<string>('MAIL_FROM', 'PDV <no-reply@localhost>')
    this.smtp =
      this.transportKind === 'smtp'
        ? createTransport({
            host: config.getOrThrow<string>('SMTP_HOST'),
            port: Number(config.get<string>('SMTP_PORT', '587')),
            secure: config.get<string>('SMTP_SECURE') === 'true',
            auth: { user: config.getOrThrow<string>('SMTP_USER'), pass: config.getOrThrow<string>('SMTP_PASSWORD') },
          })
        : null
  }

  async send(message: MailMessage): Promise<void> {
    if (!this.smtp) {
      this.logger.log(`[mail:log] to=${message.to} subject="${message.subject}"\n${message.text}`)
      return
    }
    await this.smtp.sendMail({ from: this.from, to: message.to, subject: message.subject, text: message.text })
  }
}
