type OriginCallback = (error: Error | null, allow?: boolean) => void

// CORS_ORIGIN: lista separada por vírgula; `*` casa um rótulo de subdomínio
// (https://*.app.exemplo.com.br cobre karol.app.exemplo.com.br, não a.b.app...).
export function corsOriginMatcher(list: string) {
  const patterns = list
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const escaped = entry.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^.]+')
      return new RegExp(`^${escaped}$`)
    })
  return (origin: string | undefined, callback: OriginCallback) => {
    // Sem Origin (curl, chamada server-side) não é cross-site: libera.
    if (!origin) return callback(null, true)
    callback(
      null,
      patterns.some((pattern) => pattern.test(origin)),
    )
  }
}
