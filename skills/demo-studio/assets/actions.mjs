// Custom steps and off-camera staging for this demo. Delete what you do not need.
//
// Declarative steps in steps.json cover a click-through. Anything that changes real state
// — approve, book, accept, advance a stage behind a confirm dialog, wait for a job — is
// easier to write here, with the full Playwright page plus the toolkit `ctx`.
//
// A step is driven by this file when its action is { "type": "custom" }; the function name
// is the step id unless the action names one with "fn".
//
// ctx gives you, without importing anything:
//   go(route, ms)        in-app navigation (pushState — no white flash)
//   goto(route, ms)      full page load
//   click(spec)          spec is a string of visible text, or { text | selector | role | label,
//                        within, exact, timeout, highlight, toast, confirm }
//   type({...value})     types at human speed; fill({...value}) puts it in at once
//   hover / press(key) / scroll(px, ms) / scrollTo(spec) / scrollTop()
//   highlight(spec, ms)  glow ring — "look here" without clicking
//   toast(/approved|failed/i, timeout)   waits for the app to confirm; returns the text
//   waitForText(text, timeout)           waits for something the app does on its own
//   confirmDialog()      clicks the affirmative button in the topmost dialog
//   find(spec)           the raw Playwright locator, for anything not covered above
//   page, base, config, sleep, log

/** One function per step id that needs real code. */
export const actions = {
  // 'b4-approve': async (page, ctx) => {
  //   await ctx.click({ text: /Approve and contact/, highlight: true })
  //   ctx.log('approve →', await ctx.toast(/approved|failed/i, 90000))
  //   await ctx.sleep(2500)
  // },

  // 'c7-handover': async (page, ctx) => {
  //   for (const stage of ['On Scene', 'Patient Contact', 'Transporting', 'Completed']) {
  //     await ctx.click({ text: stage, exact: true })
  //     await ctx.confirmDialog()
  //     ctx.log(stage, await ctx.toast(new RegExp(`${stage}|failed`, 'i'), 60000))
  //     await ctx.sleep(1800)
  //   }
  // },
}

/**
 * Put the app into the state each act opens in. Runs in a hidden browser context before
 * that act is recorded or captured, so none of it reaches the film — which is what lets a
 * single act be re-recorded on its own and still make sense.
 */
export const prepare = {
  // A: async (page, ctx) => {
  //   await ctx.goto('/admin/demo-control', 7000)
  //   await ctx.click('Reset demo')
  //   await ctx.find({ selector: '[role=dialog] input' }).fill('RESET')
  //   await ctx.confirmDialog()
  //   ctx.log('reset →', await ctx.toast(/reset complete|failed/i, 900000))
  // },

  // C: async (page, ctx) => {
  //   await ctx.goto('/admin/demo-control', 7000)
  //   await ctx.click('Simulate emergency')
  //   ctx.log('staged →', await ctx.toast(/complete|failed/i, 300000))
  // },
}
