// Records the demo from the sessions saved by auth.mjs.
//
//   node scripts/recorder.mjs               every act
//   SEGMENTS=C,D node scripts/recorder.mjs  re-record two acts; timeline.json merges
//
// A portal that binds its token to the browser context cannot be recorded this way —
// use live-record.mjs for that persona.
import { bySegment, launch, logTo, log } from './config.mjs'
import { recordWith } from './record-core.mjs'

logTo('record')
const wanted = (process.env.SEGMENTS ?? Object.keys(bySegment()).join(',')).split(',')
const browser = await launch()
try {
  await recordWith(browser, wanted)
} finally {
  await browser.close()
}
log('Done. Next: python scripts/build.py')
