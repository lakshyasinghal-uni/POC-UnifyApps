// Collects one Playwright storageState per persona.
// Opens a visible Chrome window, waits for YOU to sign in, then saves the session.
// Run once; every later stage reuses the saved states, so the take runs unattended.
//
//   node scripts/auth.mjs                      all personas that need a login
//   ONLY=candidate FORCE=1 node scripts/auth.mjs   redo one
import { config, AUTH_DIR, VIEW, launch, sleep, log, fs, path } from './config.mjs'

async function capture(browser, persona) {
  const file = path.join(AUTH_DIR, `${persona.id}.json`)
  if (fs.existsSync(file) && !process.env.FORCE) {
    log(`✓ ${persona.id}: already saved (set FORCE=1 to redo)`)
    return
  }
  const context = await browser.newContext({ viewport: VIEW })
  const page = await context.newPage()
  await page.goto(persona.base + persona.login, { waitUntil: 'domcontentloaded' })

  const who = `${persona.user}  (${persona.label})`
  console.log('')
  console.log('  ┌────────────────────────────────────────────────────────┐')
  console.log(`  │  SIGN IN AS: ${who.padEnd(42).slice(0, 42)}│`)
  console.log('  │  Use the Chrome window that just opened.               │')
  console.log('  │  I will detect it and move on automatically.           │')
  console.log('  └────────────────────────────────────────────────────────┘')
  console.log('')

  // Wait until we are off the login screen. No timeout: a person is typing.
  await page.waitForURL((url) => !/\/(login|auth|sso)/.test(url.pathname), { timeout: 0 })
  await sleep(4000)

  fs.mkdirSync(AUTH_DIR, { recursive: true })
  fs.writeFileSync(file, JSON.stringify(await context.storageState(), null, 2))
  log(`✓ ${persona.id}: session saved → ${path.relative(path.join(AUTH_DIR, '..'), file)}  (landed on ${page.url()})`)
  await context.close()
}

const only = process.env.ONLY?.split(',')
const wanted = Object.values(config.personas).filter((p) => p.auth && (!only || only.includes(p.id)))

if (!wanted.length) {
  log('Nothing to do — no persona in demo.config.json needs a login.')
} else {
  const browser = await launch()
  try {
    for (const persona of wanted) await capture(browser, persona)
  } finally {
    await browser.close()
  }
  log('All requested sessions captured.')
}
