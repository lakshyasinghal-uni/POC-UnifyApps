// Copies the demo-studio pipeline into a project.
//
//   node <skill>/scaffold.mjs <target-dir> --title "AI Recruitment" --slug Fujairah_Demo
//
// Existing files are kept, so re-running after an upgrade refreshes the scripts without
// touching the story: pass --force to overwrite everything including steps.json.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ASSETS = path.join(HERE, 'assets')

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? undefined : args[i + 1]
}
const force = args.includes('--force')

// The first bare argument is the target directory; everything after a --flag is its value.
const positional = []
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    if (args[i] !== '--force') i += 1   // skip the flag's value
    continue
  }
  positional.push(args[i])
}
const target = path.resolve(positional[0] ?? 'demo')

// Files that carry the story, not the machinery: never overwritten without --force.
const STORY = new Set(['demo.config.json', 'steps.json', 'diagram.json', 'actions.mjs', 'manual/notes.json', 'README.md'])

let copied = 0
let kept = 0

function walk(dir, rel = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const from = path.join(dir, entry.name)
    const relPath = rel ? `${rel}/${entry.name}` : entry.name
    const to = path.join(target, relPath)
    if (entry.isDirectory()) {
      fs.mkdirSync(to, { recursive: true })
      walk(from, relPath)
      continue
    }
    if (fs.existsSync(to) && !force && STORY.has(relPath)) {
      console.log(`  kept    ${relPath}  (yours)`)
      kept += 1
      continue
    }
    fs.mkdirSync(path.dirname(to), { recursive: true })
    fs.copyFileSync(from, to)
    copied += 1
  }
}

fs.mkdirSync(target, { recursive: true })
walk(ASSETS)

// Seed the config with whatever was passed, so the first run is not full of REPLACE ME.
const configFile = path.join(target, 'demo.config.json')
const title = flag('title')
const slug = flag('slug')
if ((title || slug) && fs.existsSync(configFile)) {
  const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'))
  if (title && /REPLACE ME/.test(config.title)) config.title = title
  if (slug && /Replace_Me/.test(config.slug)) config.slug = slug
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2) + '\n')
}

console.log(`\nScaffolded ${path.relative(process.cwd(), target) || '.'}  —  ${copied} files copied, ${kept} kept.`)
console.log('Next:')
console.log(`  cd ${path.relative(process.cwd(), target) || '.'} && npm install`)
console.log('  edit demo.config.json (personas, URLs, brand) and steps.json (the story)')
console.log('  node scripts/auth.mjs')
