import { ConfigService } from '@nestjs/config'
import { MailService } from './mail.service'

function config(values: Record<string, string>) {
  return {
    get: (key: string, fallback?: string) => values[key] ?? fallback,
    getOrThrow: (key: string) => {
      if (!(key in values)) throw new Error(`missing ${key}`)
      return values[key]
    },
  } as unknown as ConfigService
}

describe('MailService', () => {
  it('defaults to the log transport and never throws when sending', async () => {
    const service = new MailService(config({}))
    expect(service.transportKind).toBe('log')
    await expect(service.send({ to: 'a@b.c', subject: 'x', text: 'y' })).resolves.toBeUndefined()
  })

  it('requires SMTP settings when MAIL_TRANSPORT=smtp', () => {
    expect(() => new MailService(config({ MAIL_TRANSPORT: 'smtp' }))).toThrow('missing SMTP_HOST')
    const service = new MailService(
      config({ MAIL_TRANSPORT: 'smtp', SMTP_HOST: 'smtp.example', SMTP_USER: 'u', SMTP_PASSWORD: 'p' }),
    )
    expect(service.transportKind).toBe('smtp')
  })
})
