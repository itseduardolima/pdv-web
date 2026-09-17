// Imprime report.html em PDF via Chrome DevTools Protocol puro (sem
// Puppeteer) — usa fetch + WebSocket globais do Node 22+. Dá controle total
// de header/footer (Page.printToPDF), que o `chrome --print-to-pdf` da CLI
// não expõe.
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { writeFileSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9333
const htmlPath = join(__dirname, 'report.html')
const pdfPath = join(__dirname, 'relatorio-auditoria-seguranca.pdf')

function waitForPort(port, timeoutMs = 15000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json/version`)
        if (res.ok) return resolve()
      } catch {
        // ainda subindo
      }
      if (Date.now() - start > timeoutMs) return reject(new Error('timeout esperando o Chrome subir'))
      setTimeout(tick, 200)
    }
    tick()
  })
}

async function main() {
  const chrome = spawn(
    CHROME,
    [
      `--remote-debugging-port=${PORT}`,
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--user-data-dir=/tmp/pdv-web-audit-chrome-profile',
    ],
    { stdio: 'ignore' },
  )

  try {
    await waitForPort(PORT)

    const target = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' }).then((r) => r.json())
    const wsUrl = target.webSocketDebuggerUrl
    const ws = new WebSocket(wsUrl)
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true })
      ws.addEventListener('error', reject, { once: true })
    })

    let nextId = 1
    const pending = new Map()
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data)
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id)
        pending.delete(msg.id)
        if (msg.error) reject(new Error(JSON.stringify(msg.error)))
        else resolve(msg.result)
      }
    })
    function send(method, params = {}) {
      const id = nextId++
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject })
        ws.send(JSON.stringify({ id, method, params }))
      })
    }

    await send('Page.enable')
    const navigatePromise = new Promise((resolve) => {
      const handler = (event) => {
        const msg = JSON.parse(event.data)
        if (msg.method === 'Page.loadEventFired') {
          ws.removeEventListener('message', handler)
          resolve()
        }
      }
      ws.addEventListener('message', handler)
    })
    await send('Page.navigate', { url: `file://${htmlPath}` })
    await navigatePromise
    // pequena espera pra fontes/layout assentarem antes de imprimir
    await new Promise((r) => setTimeout(r, 400))

    const headerTemplate = `
      <div style="font-size:8px; width:100%; text-align:center; color:#888; font-family:Arial,sans-serif; padding-top:4px;">
        Relatório de Auditoria de Segurança — pdv-web
      </div>`
    const footerTemplate = `
      <div style="font-size:8px; width:100%; text-align:center; color:#888; font-family:Arial,sans-serif;">
        <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>`

    const result = await send('Page.printToPDF', {
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      marginTop: 0.7,
      marginBottom: 0.6,
      marginLeft: 0.5,
      marginRight: 0.5,
      paperWidth: 8.27, // A4 em polegadas
      paperHeight: 11.69,
      preferCSSPageSize: false,
    })

    writeFileSync(pdfPath, Buffer.from(result.data, 'base64'))
    console.log('OK:', pdfPath)
    ws.close()
  } finally {
    chrome.kill()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
