import type { ConfigService } from '@nestjs/config'

// Mesmos padrões de placeholder que scripts/deploy-check.sh recusa no .env —
// aqui como última linha de defesa dentro do próprio processo: um
// `docker compose up` direto (sem passar pelo script) não deve conseguir
// subir a API em produção assinando sessão com um segredo previsível.
const PLACEHOLDER_PATTERNS = [/seudominio/i, /gere-/i, /change-me/i, /placeholder/i, /^localhost/i]

const SECRETS_TO_CHECK = ['SESSION_SECRET', 'PLATFORM_SESSION_SECRET']

function isPlaceholder(value: string): boolean {
  return value === '' || PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value))
}

// Só em produção: dev e CI usam de propósito segredos "óbvios"
// (change-me-to-a-long-random-secret, ci-placeholder-secret-not-used-in-production)
// que este mesmo padrão recusaria — não faz sentido barrar esses ambientes.
export function assertProductionSecrets(config: ConfigService): void {
  if (config.get<string>('NODE_ENV') !== 'production') return

  const offenders = SECRETS_TO_CHECK.filter((name) => isPlaceholder(config.get<string>(name, '')))
  if (offenders.length > 0) {
    throw new Error(
      `Configuração insegura: ${offenders.join(', ')} ainda está com valor de exemplo. ` +
        'Gere um segredo real (ex.: openssl rand -hex 32) antes de subir em produção.',
    )
  }
}
