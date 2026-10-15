// Shared plumbing for the three documents: escaping, the brand stylesheet, and
// HTML → PDF through headless Chrome. No document content lives here.
import { fileURLToPath } from 'node:url'
import { config, BRAND, LOGO, ROOT, OUT, chromium, fill, fs, path } from '../scripts/config.mjs'

export const DOCS = path.dirname(fileURLToPath(import.meta.url))

/** Escape for HTML, but leave the small tags the notes are allowed to use (<b>, <code>, <br>). */
export const esc = (s) => String(s).replace(/&(?!(amp|lt|gt|#\d+);)/g, '&amp;')

/** Escape everything, for text that must never carry markup. */
export const escAll = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Notes may be inline on the step (`step.manual`) or in manual/notes.json. Inline wins. */
export function notesFor(step) {
  return { ...(NOTES[step.id] ?? {}), ...(step.manual ?? {}) }
}

const NOTES_FILE = path.join(DOCS, 'notes.json')
const NOTES = fs.existsSync(NOTES_FILE) ? JSON.parse(fs.readFileSync(NOTES_FILE, 'utf-8')) : {}

export const today = new Date().toLocaleDateString(config.locale ?? 'en-GB', {
  day: 'numeric', month: 'long', year: 'numeric',
})

/** The tokens every document shares, so the manual, the runbook and the script match. */
export const css = `
  * { box-sizing: border-box; }
  body { font-family: ${BRAND.font}; color: #17202e; margin: 0; font-size: 10pt; line-height: 1.5; }
  h1, h2, h3 { margin: 0; font-weight: 600; }
  code { font-family: Consolas, monospace; font-size: 8.5pt; background: #eef2f8; border: 1px solid #d9e2ee;
         border-radius: 3px; padding: .4mm 1.4mm; color: ${BRAND.ink}; word-break: break-all; }
  .warn { border-left: 4px solid #b4441f; background: #fdf4f1; padding: 3mm 4mm; margin: 4mm 0; }
  .warn .label { font-size: 8pt; letter-spacing: .14em; text-transform: uppercase; color: #b4441f;
                 font-weight: 700; margin-bottom: 1.5mm; }
  .warn ul { margin: 0; padding-left: 4.5mm; }
  .warn li { margin-bottom: 1mm; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 3mm 0 5mm; }
  th, td { text-align: left; padding: 2.2mm 3mm; border-bottom: 1px solid #e3e9f1; vertical-align: top; }
  th { background: #f4f7fb; font-size: 8pt; letter-spacing: .08em; text-transform: uppercase; color: #48576e; }`

/** A screenshot from the capture pass, inlined so the PDF is a single portable file. */
export function shot(id) {
  const file = path.join(ROOT, 'build', 'shots', `${id}.jpg`)
  return fs.existsSync(file) ? `data:image/jpeg;base64,${fs.readFileSync(file).toString('base64')}` : null
}

/**
 * Render HTML to a PDF in out/.
 * If the PDF is already open in a viewer, Windows locks it — write beside it rather
 * than failing a build that took ten minutes to get to this point.
 */
export async function renderPdf(html, { name, footer, margin }) {
  fs.mkdirSync(OUT, { recursive: true })
  const htmlFile = path.join(OUT, `${name}.html`)
  fs.writeFileSync(htmlFile, html)

  let pdf = path.join(OUT, `${name}.pdf`)
  try {
    fs.closeSync(fs.openSync(pdf, fs.existsSync(pdf) ? 'r+' : 'w'))
  } catch {
    pdf = pdf.replace(/\.pdf$/, `-${new Date().toISOString().slice(11, 16).replace(':', '')}.pdf`)
    console.log(`Original is locked (open in a viewer?) — writing ${path.basename(pdf)} instead.`)
  }

  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? 'chrome', headless: true })
  const page = await browser.newPage()
  await page.goto('file:///' + htmlFile.replace(/\\/g, '/'), { waitUntil: 'networkidle' })
  // Print rules, and always the light theme — a machine set to dark mode would otherwise
  // produce a PDF nobody can read on paper.
  await page.emulateMedia({ media: 'print', colorScheme: 'light' })
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'))
  await page.pdf({
    path: pdf,
    format: 'A4',
    printBackground: true,
    margin: margin ?? { top: '15mm', bottom: '16mm', left: '14mm', right: '14mm' },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate:
      '<div style="width:100%;font-family:' + BRAND.font.replace(/"/g, "'") + ';font-size:7.5pt;color:#8996a8;'
      + 'padding:0 14mm;display:flex;justify-content:space-between">'
      + '<span>' + escAll(footer ?? config.title) + '</span><span class="pageNumber"></span></div>',
  })
  await browser.close()
  return pdf
}

/** The logo for a dark cover or header, or nothing when the project has none. */
export const logoTag = (height = '14mm', style = '') => (LOGO ? `<img alt="" src="${LOGO}" style="height:${height};width:auto;${style}">` : '')

export { config, BRAND, fill, fs, path }
