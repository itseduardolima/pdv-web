import { NextResponse } from 'next/server'

// 09-operacao § 1: confirma só que o processo do apps/web está respondendo —
// não checa a API (redundante com o /health dela, que já confere o
// Postgres). Sem tenant, sem cookie: um monitor de uptime bate aqui direto.
export function GET() {
  return NextResponse.json({ status: 'ok' })
}
