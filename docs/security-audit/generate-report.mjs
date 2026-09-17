// Gera o relatório de auditoria de segurança em HTML (impresso a PDF pelo
// Chrome headless por generate-report.sh). Sem dependências externas —
// gráficos são SVG puro, calculado aqui.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(readFileSync(join(__dirname, 'findings.json'), 'utf8'))

const SEVERITY_COLOR = {
  crítica: '#B91C1C',
  alta: '#EA580C',
  média: '#D97706',
  baixa: '#2563EB',
  informativa: '#6B7280',
}
const STRENGTH_COLOR = '#059669'
const SEVERITY_ORDER = ['crítica', 'alta', 'média', 'baixa', 'informativa']

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )
}

function donutChart(counts) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return '<p>Sem achados classificados.</p>'
  const cx = 90,
    cy = 90,
    r = 70,
    sw = 34
  let angle = -90
  const paths = []
  for (const sev of SEVERITY_ORDER) {
    const value = counts[sev] || 0
    if (value === 0) continue
    const frac = value / total
    const sweep = frac * 360
    const large = sweep > 180 ? 1 : 0
    const startRad = (angle * Math.PI) / 180
    const endRad = ((angle + sweep) * Math.PI) / 180
    const x1 = cx + r * Math.cos(startRad),
      y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad),
      y2 = cy + r * Math.sin(endRad)
    paths.push(
      `<path d="M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}" ` +
        `stroke="${SEVERITY_COLOR[sev]}" stroke-width="${sw}" fill="none" />`,
    )
    angle += sweep
  }
  const legend = SEVERITY_ORDER.filter((s) => counts[s])
    .map(
      (s) =>
        `<div class="legend-row"><span class="dot" style="background:${SEVERITY_COLOR[s]}"></span>${s} — ${counts[s]}</div>`,
    )
    .join('')
  return `
    <div class="donut-wrap">
      <svg width="180" height="180" viewBox="0 0 180 180">
        ${paths.join('\n')}
        <circle cx="${cx}" cy="${cy}" r="${r - sw / 2 - 1}" fill="var(--bg)" />
        <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="30" font-weight="700" fill="var(--ink)">${total}</text>
        <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="11" fill="var(--ink-soft)">achados</text>
      </svg>
      <div class="legend">${legend}</div>
    </div>`
}

function barChart(byCategory) {
  const entries = Object.entries(byCategory)
  const max = Math.max(...entries.map(([, v]) => v), 1)
  const barMaxWidth = 320
  const rows = entries
    .map(([cat, count]) => {
      const width = Math.max((count / max) * barMaxWidth, 6)
      return `
      <div class="bar-row">
        <div class="bar-label">${escapeHtml(cat)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${width}px"></div><span class="bar-value">${count}</span></div>
      </div>`
    })
    .join('')
  return `<div class="bar-chart">${rows}</div>`
}

const bySeverity = {}
for (const sev of SEVERITY_ORDER) bySeverity[sev] = 0
for (const f of data.findings) bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1

const byCategory = {}
for (const f of data.findings) byCategory[f.category] = (byCategory[f.category] || 0) + 1

const sevChip = (sev) =>
  `<span class="chip" style="background:${SEVERITY_COLOR[sev]}22;color:${SEVERITY_COLOR[sev]};border:1px solid ${SEVERITY_COLOR[sev]}55">${sev.toUpperCase()}</span>`

const findingsSorted = [...data.findings].sort(
  (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
)

const findingsRows = findingsSorted
  .map(
    (f) => `
    <tr>
      <td>${sevChip(f.severity)}</td>
      <td class="mono">${escapeHtml(f.file)}${f.lines ? ':' + escapeHtml(f.lines) : ''}</td>
      <td>
        <div class="finding-title">${escapeHtml(f.title)}</div>
        <div class="finding-cat">${escapeHtml(f.category)}</div>
        ${f.snippet ? `<pre class="snippet">${escapeHtml(f.snippet)}</pre>` : ''}
        <div class="finding-why">${escapeHtml(f.why)}</div>
        ${f.exploit_conditions ? `<div class="finding-cond"><strong>Condição de exploração:</strong> ${escapeHtml(f.exploit_conditions)}</div>` : ''}
      </td>
    </tr>`,
  )
  .join('')

const strengthsList = data.strengths
  .map(
    (s) =>
      `<li><strong>${escapeHtml(s.title)}</strong><br><span class="evidence">${escapeHtml(s.evidence)}</span></li>`,
  )
  .join('')

const methodologyRows = data.methodology
  .map((m) => `<tr><td><strong>${escapeHtml(m.category)}</strong></td><td>${escapeHtml(m.mapping)}</td></tr>`)
  .join('')

// ---- Recomendações priorizadas ----
const recommendations = [
  {
    tag: 'P1',
    title: 'Adicionar PLATFORM_SESSION_SECRET à validação obrigatória do deploy-check.sh',
    detail:
      'Uma linha em scripts/deploy-check.sh (achado F1) — mesma lista `required` que já cobre SESSION_SECRET. Sem custo de implementação, fecha o maior risco da auditoria.',
  },
  {
    tag: 'P1',
    title: 'Adicionar validação de startup que rejeite qualquer segredo com valor de placeholder',
    detail:
      'Complementar ao P1 acima: um `if` no bootstrap (main.ts) que recusa subir se SESSION_SECRET/PLATFORM_SESSION_SECRET baterem em `change-me-to-*` — defesa mesmo se alguém rodar docker compose sem passar pelo deploy-check.sh (achado F1/F2).',
  },
  {
    tag: 'P2',
    title: 'Remover (ou documentar explicitamente como "só localhost") os defaults de senha do docker-compose.yml',
    detail:
      'POSTGRES_PASSWORD, APP_DB_PASSWORD, STORAGE_SECRET_KEY (achado F2) — hoje o comentário no topo do arquivo já avisa, mas o fallback funcional ainda existe; considerar falhar o container se a env vier vazia em vez de usar `postgres`/`pdv`/`pdvpdvpdv`.',
  },
  {
    tag: 'P3',
    title: 'Restringir o schema de logoUrl/photoUrl a protocolo http(s)',
    detail:
      'Trocar `z.string().url()` por um refine que rejeite qualquer esquema fora de http/https em packages/shared/src/schemas/*.ts (achado F3) — defesa em profundidade, sem sink explorável hoje.',
  },
  {
    tag: 'P3',
    title: 'Avaliar lock/transação para isAdminEmailInUse em PlatformTenantService.create()',
    detail:
      'Baixo risco (ator único, superadmin) — considerar uma constraint auxiliar (ex.: tabela global de e-mails de admin) só se o produto crescer para múltiplos operadores de plataforma (achado F4).',
  },
]

const recRows = recommendations
  .map(
    (r) =>
      `<div class="rec"><span class="rec-tag">${r.tag}</span><div><div class="rec-title">${escapeHtml(r.title)}</div><div class="rec-detail">${escapeHtml(r.detail)}</div></div></div>`,
  )
  .join('')

// ---- Issues para GitHub ----
function issueMarkdown(f, n) {
  const labels = `security, ${f.severity}`
  return `--- ISSUE ${n} ---
## [Segurança] ${f.title}

**Labels sugeridas:** ${labels}

### Descrição do problema
${f.why}

### Evidência
\`${f.file}${f.lines ? ':' + f.lines : ''}\`
\`\`\`
${f.snippet || '(ver arquivo referenciado)'}
\`\`\`

### Impacto
Severidade: **${f.severity.toUpperCase()}**. ${f.exploit_conditions || ''}

### Sugestão de correção
${recommendations.find((r) => r.detail.includes(f.id) || r.title.toLowerCase().includes(f.category.split(' ')[0].toLowerCase()))?.detail || 'Ver seção de recomendações do relatório.'}

### Critérios de aceite
- [ ] Causa raiz corrigida no arquivo/linha indicado
- [ ] Teste (unitário ou de integração) cobrindo o caso, quando aplicável
- [ ] Revisão confirma que a condição de exploração deixou de existir
--- FIM ISSUE ${n} ---`
}

const actionable = findingsSorted.filter((f) => f.severity !== 'informativa')
const issuesBlock = actionable.map((f, i) => issueMarkdown(f, i + 1)).join('\n\n')

const totalFindings = data.findings.length
const criticalCount = bySeverity['crítica'] || 0
const highCount = bySeverity['alta'] || 0

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Relatório de Auditoria de Segurança</title>
<style>
  @page { size: A4; margin: 20mm 16mm 18mm 16mm; }
  * { box-sizing: border-box; }
  :root {
    --ink: #1a1a1a; --ink-soft: #6b6b6b; --bg: #ffffff; --line: #e3e3e3; --panel: #f7f7f8;
    --crit: ${SEVERITY_COLOR['crítica']}; --high: ${SEVERITY_COLOR['alta']}; --med: ${SEVERITY_COLOR['média']};
    --low: ${SEVERITY_COLOR['baixa']}; --strength: ${STRENGTH_COLOR};
  }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: var(--ink); font-size: 10.5px; line-height: 1.5; margin: 0; }
  h1, h2, h3 { font-family: Georgia, 'Times New Roman', serif; font-weight: 700; margin: 0 0 10px; }
  .page { page-break-after: always; padding-top: 4px; }
  .page:last-child { page-break-after: auto; }
  .running-header { position: running(header); }
  .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 235mm; text-align: center; }
  .cover .kicker { letter-spacing: 3px; text-transform: uppercase; color: var(--ink-soft); font-size: 11px; margin-bottom: 18px; }
  .cover h1 { font-size: 30px; max-width: 480px; }
  .cover .subtitle { color: var(--ink-soft); font-size: 13px; margin-top: 10px; max-width: 460px; }
  .cover .meta-box { margin-top: 40px; border: 1px solid var(--line); border-radius: 10px; padding: 20px 26px; text-align: left; width: 420px; background: var(--panel); }
  .cover .meta-box div { margin-bottom: 8px; font-size: 11px; }
  .cover .meta-box strong { display: inline-block; width: 90px; color: var(--ink-soft); font-weight: 600; }
  h2.section-title { font-size: 19px; border-bottom: 2px solid var(--ink); padding-bottom: 8px; margin-bottom: 16px; }
  .summary-grid { display: flex; gap: 18px; margin-bottom: 22px; }
  .stat-card { flex: 1; border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; background: var(--panel); }
  .stat-card .num { font-size: 26px; font-weight: 700; font-family: Georgia, serif; }
  .stat-card .label { font-size: 10px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.5px; }
  .charts-row { display: flex; gap: 28px; align-items: flex-start; margin-bottom: 20px; }
  .chart-box { flex: 1; border: 1px solid var(--line); border-radius: 10px; padding: 16px; }
  .chart-box h3 { font-size: 12px; margin-bottom: 12px; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.5px; color: var(--ink-soft); }
  .donut-wrap { display: flex; align-items: center; gap: 18px; }
  .legend-row { font-size: 10.5px; margin-bottom: 6px; display: flex; align-items: center; }
  .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 7px; }
  .bar-chart { display: flex; flex-direction: column; gap: 10px; }
  .bar-row { display: flex; align-items: center; gap: 10px; }
  .bar-label { width: 130px; font-size: 9.5px; color: var(--ink-soft); text-align: right; flex-shrink: 0; }
  .bar-track { display: flex; align-items: center; gap: 8px; }
  .bar-fill { height: 14px; background: var(--ink); border-radius: 3px; }
  .bar-value { font-size: 10px; color: var(--ink-soft); }
  ul.strengths { list-style: none; padding: 0; margin: 0; }
  ul.strengths li { border-left: 3px solid var(--strength); background: var(--panel); padding: 10px 14px; border-radius: 0 8px 8px 0; margin-bottom: 10px; }
  .evidence { font-size: 9.5px; color: var(--ink-soft); font-family: 'Courier New', monospace; }
  table.meta-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  table.meta-table td { vertical-align: top; padding: 8px 10px; border-bottom: 1px solid var(--line); font-size: 10px; }
  table.findings { width: 100%; border-collapse: collapse; }
  table.findings th { text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.4px; color: var(--ink-soft); border-bottom: 2px solid var(--ink); padding: 6px 8px; }
  table.findings td { border-bottom: 1px solid var(--line); padding: 10px 8px; font-size: 10px; vertical-align: top; }
  .mono { font-family: 'Courier New', monospace; font-size: 9px; white-space: nowrap; }
  .chip { padding: 3px 8px; border-radius: 20px; font-size: 8.5px; font-weight: 700; white-space: nowrap; }
  .finding-title { font-weight: 700; margin-bottom: 3px; }
  .finding-cat { font-size: 8.5px; color: var(--ink-soft); text-transform: uppercase; margin-bottom: 6px; }
  .finding-why { margin-top: 6px; }
  .finding-cond { margin-top: 6px; font-size: 9.5px; color: var(--ink-soft); }
  pre.snippet { background: #1e1e1e; color: #d4d4d4; padding: 8px 10px; border-radius: 6px; font-size: 8.5px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 4px 0; }
  .rec { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 14px; }
  .rec-tag { flex-shrink: 0; background: var(--ink); color: white; font-size: 10px; font-weight: 700; padding: 4px 9px; border-radius: 6px; }
  .rec-title { font-weight: 700; font-size: 11px; margin-bottom: 3px; }
  .rec-detail { font-size: 9.5px; color: var(--ink-soft); }
  .issues-pre { background: #f5f5f5; border: 1px solid var(--line); border-radius: 6px; padding: 14px; font-size: 8.5px; font-family: 'Courier New', monospace; white-space: pre-wrap; word-break: break-word; }
</style>
</head>
<body>

<div class="page cover">
  <div class="kicker">Confidencial · Uso interno</div>
  <h1>Relatório de Auditoria de Segurança<br>pdv-web</h1>
  <p class="subtitle">Revisão adversarial de 5 categorias de falha comuns — isolamento de tenant, autorização, IDOR, segredos e XSS — adaptadas à stack real do projeto.</p>
  <div class="meta-box">
    <div><strong>Data</strong> ${escapeHtml(data.date)}</div>
    <div><strong>Escopo</strong> ${escapeHtml(data.scope)}</div>
    <div><strong>Achados</strong> ${totalFindings} (${criticalCount} crítico, ${highCount} alto)</div>
    <div><strong>Metodologia</strong> stack detectada: NestJS + Prisma/PostgreSQL (RLS) no backend, Next.js/React no frontend, Zod para validação compartilhada, Docker Compose + GitHub Actions para deploy/CI. Ver tabela de mapeamento na próxima página.</div>
  </div>
</div>

<div class="page">
  <h2 class="section-title">Nota metodológica</h2>
  <table class="meta-table">${methodologyRows}</table>
</div>

<div class="page">
  <h2 class="section-title">Resumo executivo</h2>
  <div class="summary-grid">
    <div class="stat-card"><div class="num" style="color:${SEVERITY_COLOR['crítica']}">${bySeverity['crítica'] || 0}</div><div class="label">Crítica</div></div>
    <div class="stat-card"><div class="num" style="color:${SEVERITY_COLOR['alta']}">${bySeverity['alta'] || 0}</div><div class="label">Alta</div></div>
    <div class="stat-card"><div class="num" style="color:${SEVERITY_COLOR['média']}">${bySeverity['média'] || 0}</div><div class="label">Média</div></div>
    <div class="stat-card"><div class="num" style="color:${SEVERITY_COLOR['baixa']}">${bySeverity['baixa'] || 0}</div><div class="label">Baixa</div></div>
    <div class="stat-card"><div class="num" style="color:${SEVERITY_COLOR['informativa']}">${bySeverity['informativa'] || 0}</div><div class="label">Informativa</div></div>
  </div>
  <div class="charts-row">
    <div class="chart-box"><h3>Achados por severidade</h3>${donutChart(bySeverity)}</div>
    <div class="chart-box"><h3>Achados por categoria</h3>${barChart(byCategory)}</div>
  </div>
  <p style="color:var(--ink-soft); font-size:9.5px;">O código auditado demonstrou disciplina consistente de isolamento multi-tenant (RLS forçada + filtro explícito em todo Repository) e de autorização (guards de servidor, nunca só o frontend) — os achados desta auditoria estão concentrados na camada de configuração/deploy (segredos e defaults), não na lógica de negócio ou nas queries.</p>
</div>

<div class="page">
  <h2 class="section-title">Pontos fortes</h2>
  <ul class="strengths">${strengthsList}</ul>
</div>

<div class="page">
  <h2 class="section-title">Achados detalhados</h2>
  <table class="findings">
    <thead><tr><th style="width:60px">Severidade</th><th style="width:150px">Arquivo:linha</th><th>Descrição</th></tr></thead>
    <tbody>${findingsRows}</tbody>
  </table>
</div>

<div class="page">
  <h2 class="section-title">Recomendações priorizadas</h2>
  ${recRows}
</div>

<div class="page">
  <h2 class="section-title">Issues para o GitHub</h2>
  <p style="color:var(--ink-soft); font-size:9.5px; margin-bottom:12px;">Texto pronto para copiar e colar na criação de issues — um bloco por achado acionável (achados informativos, sem ação de código necessária, ficam de fora).</p>
  <div class="issues-pre">${escapeHtml(issuesBlock)}</div>
</div>

</body>
</html>`

writeFileSync(join(__dirname, 'report.html'), html, 'utf8')
console.log('report.html gerado:', join(__dirname, 'report.html'))
