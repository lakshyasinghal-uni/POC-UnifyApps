// process for orbit-api.mjs when it runs inside an Orbit tab. Every value comes from the current run.
const ctx = () => globalThis.__ORBIT_CTX__;
export const process = {
  get env() { return ctx().env; },
  get argv() { return ["node", "/plugin/scripts/orbit-api.mjs", ...ctx().argv]; },
  cwd: () => "/work",
  exit: (code) => ctx().exit(code ?? 0),
  stdout: { write: (s) => { ctx().out(String(s)); return true; } },
  stderr: { write: (s) => { ctx().err(String(s)); return true; } },
  platform: "browser", version: "v22.0.0", versions: {}, browser: true,
  nextTick: (fn, ...a) => queueMicrotask(() => fn(...a)),
};
