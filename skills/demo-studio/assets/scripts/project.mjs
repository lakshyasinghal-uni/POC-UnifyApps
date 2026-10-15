// Loads the project's own actions.mjs, if it has one.
//
// Declarative steps cover a click-through. A demo that changes real state — approve, book,
// accept, advance four stages through a confirm dialog each time, wait for a job to finish
// — needs code. That belongs to the project, not to the pipeline, so it lives in
// <project>/actions.mjs and exports:
//
//   export const actions  = { 'b4-approve': async (page, ctx) => { … } }
//   export const prepare  = { B: async (page, ctx) => { … } }   // off camera, before the act
//
// A step whose id appears in `actions` is driven by that function. `prepare` runs in a
// hidden browser context before its act is recorded, so the staging never reaches the film.
import { ROOT, fs, path } from './config.mjs'
import { pathToFileURL } from 'node:url'

const file = path.join(ROOT, 'actions.mjs')
export const project = fs.existsSync(file) ? await import(pathToFileURL(file).href) : {}
export const hasCustom = (id) => Boolean(project.actions?.[id])
