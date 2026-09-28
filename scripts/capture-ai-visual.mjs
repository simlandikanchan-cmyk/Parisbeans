// Real visual verification: boots Vite + a mock AI upstream, drives headless
// Chrome over the DevTools Protocol (native WebSocket, no dependencies), and
// captures screenshots of each widget state so they can be inspected.
//
// Run: node scripts/capture-ai-visual.mjs
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const CDP_PORT = 9223
const SHOTS = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\ai-visual\\'
const PROFILE = 'C:\\Users\\stdlocal\\AppData\\Local\\Temp\\kilo\\ai-profile'
const VW = 1440
const VH = 900

// ---- mock AI upstream -----------------------------------------------------
const upstream = createServer((req, res) => {
  let raw = ''
  req.on('data', (c) => (raw += c))
  req.on('end', () => {
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        choices: [
          {
            message: {
              content:
                "We're open **Monday to Sunday** — **10:00 AM - 9:00 PM**.\n\n" +
                "Our signatures:\n\n" +
                '- **Aglio E Olio** — ₹349\n' +
                '- **Sundowner Mocktail** — ₹279\n' +
                '- **Blush Sunset** — ₹269\n\n' +
                "Come on in any day of the week!",
            },
          },
        ],
      })
    )
  })
})
await new Promise((r) => upstream.listen(0, r))

// ---- vite -----------------------------------------------------------------
process.env.VITE_AI_ENDPOINT = `http://127.0.0.1:${upstream.address().port}/v1/chat/completions`
process.env.AI_API_KEY = 'sk-test-key'
process.env.VITE_AI_MODEL = 'gpt-4o-mini'

const { createServer: createViteServer } = await import('vite')
const vite = await createViteServer({
  configFile: './vite.config.js',
  // Isolated port: other projects on this machine already hold 5173.
  server: { port: 5321, host: '127.0.0.1', strictPort: true },
  logLevel: 'error',
})
await vite.listen()
const base = 'http://127.0.0.1:5321'

// Guard: make sure we are actually serving the Paris Beans app and not some
// other project's dev server that happens to own the port.
const probe = await (await fetch(`${base}/`)).text()
if (!/Paris\s*Beans/i.test(probe)) {
  throw new Error(`Port 5321 is not serving Paris Beans (got ${probe.slice(0, 120)}...)`)
}
console.log(`Serving confirmed: Paris Beans on ${base}\n`)

// ---- chrome ---------------------------------------------------------------
try {
  rmSync(PROFILE, { recursive: true, force: true })
} catch {
  /* stale profile, chrome will recreate */
}
mkdirSync(SHOTS, { recursive: true })
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${PROFILE}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--hide-scrollbars',
    `--window-size=${VW},${VH}`,
    'about:blank',
  ],
  { stdio: 'ignore' }
)

let ws
let msgId = 0
const pending = new Map()
const cdp = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++msgId
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })

async function connect() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
      const page = list.find((t) => t.type === 'page')
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl
    } catch {
      /* not up yet */
    }
    await sleep(250)
  }
  throw new Error('Chrome DevTools endpoint never came up')
}

const wsUrl = await connect()
ws = new WebSocket(wsUrl)
await new Promise((res, rej) => {
  ws.onopen = res
  ws.onerror = rej
})
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id)
    pending.delete(m.id)
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)
    return
  }
  // Surface page-side failures instead of silently polling an empty DOM.
  if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails
    console.log(`  [page error] ${d.text} ${d.exception?.description || ''}`.slice(0, 400))
  }
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    console.log(
      `  [console.error] ${m.params.args.map((a) => a.value ?? a.description ?? '').join(' ')}`.slice(0, 400)
    )
  }
}

await cdp('Page.enable')
await cdp('Runtime.enable')
await cdp('Emulation.setDeviceMetricsOverride', {
  width: VW,
  height: VH,
  deviceScaleFactor: 2,
  mobile: false,
})

const evaluate = async (expr) => {
  const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' :: ' + expr)
  return r.result.value
}

async function shot(name) {
  const { data } = await cdp('Page.captureScreenshot', { format: 'png' })
  const p = `${SHOTS}${name}.png`
  writeFileSync(p, Buffer.from(data, 'base64'))
  console.log(`  captured  ${name}.png`)
}

try {
  console.log('\n--- desktop 1440x900 ---')
  await cdp('Page.navigate', { url: base })

  // Poll for React + the widget rather than guessing at fixed sleeps.
  const bootedAt = await (async () => {
    for (let i = 0; i < 80; i++) {
      const ready = await evaluate(
        `!!document.querySelector('#root')?.children.length`
      ).catch(() => false)
      if (ready) return (i * 250) / 1000
      await sleep(250)
    }
    return null
  })()
  console.log(`  react mounted at ~${bootedAt}s`)

  const early = await evaluate(`!!document.querySelector('.ai-widget.is-visible')`)
  console.log(`  widget visible immediately after boot : ${early}  (expected false)`)

  const mounted = await (async () => {
    for (let i = 0; i < 40; i++) {
      if (await evaluate(`!!document.querySelector('.ai-float')`)) return true
      await sleep(250)
    }
    return false
  })()
  const diag = await evaluate(`(() => ({
    widget: !!document.querySelector('.ai-widget'),
    visible: !!document.querySelector('.ai-widget.is-visible'),
    float: !!document.querySelector('.ai-float'),
    idleCb: typeof window.requestIdleCallback,
    hasChat: !!document.querySelector('#ai-message'),
  }))()`)
  console.log(`  widget mounted : ${mounted}`)
  if (!mounted) {
    const dump = await evaluate(`(() => ({
      url: location.href,
      readyState: document.readyState,
      rootChildren: document.getElementById('root')?.children.length ?? -1,
      bodyLen: document.body.innerHTML.length,
      bodyHead: document.body.innerHTML.slice(0, 500),
    }))()`)
    console.log('  DOM diagnostics :', JSON.stringify(dump, null, 2))
  }
  await shot('01-desktop-closed')

  // 2. open the panel
  await evaluate(`document.querySelector('.ai-float').click(); true`)
  await sleep(900)
  await shot('02-desktop-open-suggestions')

  const geo = await evaluate(`(() => {
    const p = document.querySelector('.ai-panel').getBoundingClientRect();
    const f = document.querySelector('.ai-float').getBoundingClientRect();
    return { panel:{x:Math.round(p.x),y:Math.round(p.y),w:Math.round(p.width),h:Math.round(p.height)},
             float:{x:Math.round(f.x),y:Math.round(f.y),w:Math.round(f.width),h:Math.round(f.height)},
             vw:innerWidth, vh:innerHeight,
             offscreen: p.right>innerWidth+1 || p.bottom>innerHeight+1 || p.left<-1 || p.top<-1 };
  })()`)
  console.log('  panel :', JSON.stringify(geo.panel))
  console.log('  float :', JSON.stringify(geo.float))
  console.log('  viewport :', geo.vw + 'x' + geo.vh, '| offscreen :', geo.offscreen)

  // 3. click a quick-reply chip, then type — the BI_41 repro path
  await evaluate(`document.querySelectorAll('.ai-suggest button')[0].click(); true`)
  await sleep(600)
  await shot('03-desktop-after-chip')

  await evaluate(`document.querySelector('#ai-message').focus(); true`)
  await cdp('Input.insertText', { text: 'What should I try?' })
  await sleep(300)
  await shot('04-desktop-typed-not-sent')

  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
  await sleep(2000)
  await shot('05-desktop-ai-reply')

  const state = await evaluate(`(() => {
    const rows=[...document.querySelectorAll('.ai-msg')].map(m=>({
      role:m.className.includes('--user')?'user':'assistant',
      text:m.innerText.replace(/\\s+/g,' ').slice(0,72)}));
    return { rows, busy: !!document.querySelector('.ai-dots'),
             sendDisabled: document.querySelector('.ai-send').disabled };
  })()`)
  console.log('\n  conversation:')
  state.rows.forEach((r) => console.log(`    [${r.role.padEnd(9)}] ${r.text}`))
  console.log(`  typing dots still showing : ${state.busy}  (expected false)`)
  console.log(`  send button disabled      : ${state.sendDisabled}  (expected true, input cleared)`)

  // 4. mobile
  console.log('\n--- mobile 390x844 ---')
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true })
  await sleep(700)
  await shot('06-mobile-open')
  const mgeo = await evaluate(`(() => {
    const p=document.querySelector('.ai-panel').getBoundingClientRect();
    return { w:Math.round(p.width), left:Math.round(p.left), right:Math.round(p.right),
             overflowsRight: p.right>innerWidth+1, vw:innerWidth };
  })()`)
  console.log('  panel width :', mgeo.w, '| right edge :', mgeo.right, '/', mgeo.vw, '| overflow :', mgeo.overflowsRight)

  console.log(`\nScreenshots written to ${SHOTS}\n`)
} finally {
  try {
    ws?.close()
  } catch {
    /* ignore */
  }
  chrome.kill()
  await new Promise((r) => chrome.once('exit', r))
  await vite.close()
  upstream.close()
  try {
    rmSync(PROFILE, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 })
  } catch {
    /* profile is disposable; leaving it is harmless */
  }
}
