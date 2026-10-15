---
name: "design-system"
description: "Build a client design system from a client name and website — sample the real brand, harvest the logo into every variant, skin house Design Language v3.4 onto it preserving luminance, audit it in light and dark, and ship a living style guide, token block and logo kit. Use before any screen is drawn."
---

# Design system for a POC

**Input: a client name and a website. Output: a measured design system.** Everything between is a
pipeline you run, not a method you interpret.

**A design system is not drawn, it is transformed.** We own a validated one. The job is to move it
onto the client's colour without breaking a single measurement in it.

**Run this as Phase 3a — before any screen is drawn, before the first builder prompt.**

---

# THE RUN

## Input contract

```
REQUIRED   client name
           website URL
OPTIONAL   brand swatch           a hex, or an image to sample
           use case               dense internal tool | demo surface | artefact studio |
                                  dark-first console | ported screens
           logo                   an SVG or PNG file
           brand typeface         the name, if you already know it
           client design system   a URL or component spec, if they publish one
```

**Everything optional is derived if absent. Derive it, record what you derived, keep going.**

## The only two stops

Do not ask anything else. Decide, record the decision in the port note, move on.

1. **The brand hue is ambiguous** — two credible sources disagree by more than ~30° of hue. Show
   both, transformed and measured, and wait. *Titan returned `#BD2426` (watch wordmark red) and
   `#00B0AB` (Tata parent teal) — both real, 180° apart.*
2. **The logo cannot be fetched as a real file.** Ask for the asset. **Never trace, redraw or
   approximate a client's mark** — not as SVG, not as CSS, not "close enough for a prototype". If no
   file exists, ship a text wordmark in the brand's type, visibly labelled a placeholder, and say so
   on the page.

## Step 0 · The system — it is in this file

**⛔ A brand skin is a transform of the existing SYSTEM, never a re-derivation from prose.**
The first attempt on a client was built outward from a rules document. It obeyed every rule and was
rejected in one line: *"NOT LIKE THIS … USE EXACT THAT JUST REPLACE THE COLOURS."* **Reading rules
and building fresh produces something that follows the rules and is not the system.**

**So the system travels with this skill.** The stylesheet below IS Design Language v3.4, trimmed to
the product kit and verified to reproduce the full reference exactly — 35 text roles measured
composited in both themes, identical numbers. **This skill has no external dependency. Do not go
looking for a reference file, an artifact, or a Project document — everything needed is here.**

**How to use it:** paste the stylesheet verbatim as the page's only `<style>` block, then transform
**only its colour values** per Step 3. Structure, glass tiers, ambient field, radii, type scale,
shadows, spacing and every component stay exactly as written. **Only hue moves.**

⚠️ **Never rewrite a component from the prose in this file when a class for it exists below.** The
prose states *why* a component behaves as it does; the stylesheet states *what it is*. A second
implementation is how one design system quietly becomes two — it is the most common failure on this
work, and it shows up as mixed radii and two kinds of search field on one screen.

### The class inventory — call these, never write a second set

| Piece | Class |
| --- | --- |
| Glass tiers · padding · nested rung · solid | `.g1` `.g2` `.g3` `.pad` `.pad-s` `.inner` `.solid` |
| Ambient field (3 fixed layers) | `.amb.a` `.amb.b` `.amb.v` |
| Type | `.title` `.micro` (mono eyebrow) |
| Buttons · tags · pips | `.btn` `.btn-p` `.btn-s` `.btn-t` · `.tag` + `.neutral/.attention/.negative/.positive` · `.pip` |
| Table toolbar · search · facet · card · grid | `.toolbar` `.field` `.chipsel` `.tblwrap` `.tbl` |
| Pagination | `.pg` `.pgb` `.rng` |
| AI Insight (scoped, see below) | `.ai:not(.msg)` |
| Tiles · loop strip · empty | `.tile` `.loop` `.empty` |
| Fused tabs | `.tabs` `.tab` `.tabpanel` |
| Forms | `.fld` `.ctl` (+`.focus/.err/.warn/.off`) `.hint` `.seg` `.tog` `.opt` `.box` `.dot` |
| Steppers · progress · reasoning stages | `.sth` `.stv` `.prog` `.stages` |
| Copilot | `.canvas` `.convo` `.msg.me` `.msg.ai` `.chips` |
| Kanban · calendar · agenda · slots | `.kb` `.cal` `.agenda` `.slot` |
| Person card · face stack · avatar | `.pc` `.faces` `.av` |
| Activity feed | `.feed` `.fi` `.fd` |
| Chart frame · sparkline · delta · legend | `.chart` `.spark` `.delta` `.legend` |
| Toast · menu · breadcrumb · note | `.toast` `.menu` `.crumb` `.note` |

**Not in the kit, by choice** — the artefact studio, command palette, notification tray, diff view,
bulk bar, slider and file drop. They are rare enough that carrying them costs every run. **Build them
from the tokens and the doctrine in the REFERENCE section, never with new colour values**, and if one
recurs across two builds, add it to the kit.

⚠️ **`.ai` vs `.msg.ai`.** The AI Insight card is `.ai:not(.msg)` and agent chat bubbles are
`.msg.ai`. An unscoped `.ai` rule renders **every conversation turn as an AI Insight card** —
invisible in light, obvious in dark. The kit is already scoped; keep it that way.

### The stylesheet

**Paste verbatim. 54 distinct hexes and 25 `rgb()` triples — inventory them, transform them, diff the
count afterwards.**

```css
:root{--sp-deep:#0033A1;--sp-blue:#0071CE;--sp-cerise:#CC27B0;--sp-pink:#E17FD2;--base:#F1F5FB;--page-top:rgba(0,51,161,.022);--glass-1:rgba(255,255,255,.72);--glass-2:rgba(255,255,255,.82);--glass-3:rgba(255,255,255,.93);--glass-solid:rgba(255,255,255,.965);--inner:rgba(0,51,161,.045);--edge:inset 0 1px 0 rgba(255,255,255,.92);--blur-1:blur(22px) saturate(160%);--blur-2:blur(26px) saturate(170%);--ink:#0B1220;--ink-2:#47566B;--ink-3:#626D84;--ink-mute:#8E9AAE;--hair:rgba(11,18,32,.07);--hair-2:rgba(11,18,32,.12);--st-neutral:#47566B;--st-neutral-t:rgba(71,86,107,.10);--st-attention:#8A5A00;--st-attention-t:rgba(138,90,0,.11);--st-negative:#96302A;--st-negative-t:rgba(150,48,42,.11);--st-positive:#1F6F5B;--st-positive-t:rgba(31,111,91,.11);--c1:#00325C;--c2:#005194;--c3:#0070CC;--c4:#0A90FF;--c5:#47ACFF;--c6:#85C8FF;--r:10px;--r-sm:6px;--r-pill:999px;--lift-1:0 1px 2px rgba(6,22,54,.05),0 12px 32px -18px rgba(6,22,54,.28);--lift-2:0 2px 6px rgba(6,22,54,.07),0 28px 60px -26px rgba(6,22,54,.40);--ease:150ms cubic-bezier(.22,.7,.28,1);--aur-a:0,51,161;--aur-b:0,113,206;--aur-c:204,39,176;--aur-1:.055;--aur-2:.045;--aur-3:.050;--vig:radial-gradient(120% 100% at 50% 40%,transparent 42%,rgba(6,18,46,.10) 100%)} @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--base:#192030;--page-top:rgba(120,165,225,.055);--glass-1:rgba(120,165,225,.12);--glass-2:rgba(120,165,225,.17);--glass-3:rgba(120,165,225,.23);--glass-solid:#2F3D57;--inner:rgba(130,175,235,.085);--edge:inset 0 1px 0 rgba(214,232,255,.17);--ink:#D8E0EC;--ink-2:#AAB7CB;--ink-3:#9FADC3;--ink-mute:#78869F;--hair:rgba(206,224,255,.10);--hair-2:rgba(206,224,255,.17);--sp-blue:#6BB3EA;--sp-deep:#3A72DE;--sp-cerise:#E884D6;--sp-pink:#F2BCE9;--st-neutral:#AAB7CB;--st-neutral-t:rgba(170,183,203,.12);--st-attention:#E3B45C;--st-attention-t:rgba(227,180,92,.13);--st-negative:#EC9790;--st-negative-t:rgba(236,151,144,.13);--st-positive:#86CDB4;--st-positive-t:rgba(134,205,180,.13);--c1:#E6F2FF;--c2:#B9DDFF;--c3:#8CC6F8;--c4:#62ADEC;--c5:#3F90D6;--c6:#3576B0;--lift-1:0 1px 2px rgba(2,6,14,.46),0 14px 34px -18px rgba(2,6,14,.68);--lift-2:0 2px 7px rgba(2,6,14,.52),0 32px 66px -26px rgba(2,6,14,.80);--aur-a:76,127,232;--aur-b:107,179,234;--aur-c:232,132,214;--aur-1:.26;--aur-2:.19;--aur-3:.22;--vig:radial-gradient(120% 100% at 55% 42%,transparent 50%,rgba(6,11,22,.30) 100%)} }:root[data-theme="dark"]{--base:#192030;--page-top:rgba(120,165,225,.055);--glass-1:rgba(120,165,225,.12);--glass-2:rgba(120,165,225,.17);--glass-3:rgba(120,165,225,.23);--glass-solid:#2F3D57;--inner:rgba(130,175,235,.085);--edge:inset 0 1px 0 rgba(214,232,255,.17);--ink:#D8E0EC;--ink-2:#AAB7CB;--ink-3:#9FADC3;--ink-mute:#78869F;--hair:rgba(206,224,255,.10);--hair-2:rgba(206,224,255,.17);--sp-blue:#6BB3EA;--sp-deep:#3A72DE;--sp-cerise:#E884D6;--sp-pink:#F2BCE9;--st-neutral:#AAB7CB;--st-neutral-t:rgba(170,183,203,.12);--st-attention:#E3B45C;--st-attention-t:rgba(227,180,92,.13);--st-negative:#EC9790;--st-negative-t:rgba(236,151,144,.13);--st-positive:#86CDB4;--st-positive-t:rgba(134,205,180,.13);--c1:#E6F2FF;--c2:#B9DDFF;--c3:#8CC6F8;--c4:#62ADEC;--c5:#3F90D6;--c6:#3576B0;--lift-1:0 1px 2px rgba(2,6,14,.46),0 14px 34px -18px rgba(2,6,14,.68);--lift-2:0 2px 7px rgba(2,6,14,.52),0 32px 66px -26px rgba(2,6,14,.80);--aur-a:76,127,232;--aur-b:107,179,234;--aur-c:232,132,214;--aur-1:.26;--aur-2:.19;--aur-3:.22;--vig:radial-gradient(120% 100% at 55% 42%,transparent 50%,rgba(6,11,22,.30) 100%)} *{box-sizing:border-box} body{background:var(--base);background-image:linear-gradient(176deg,var(--page-top) 0%,transparent 46%);color:var(--ink);font-family:Archivo,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:15px;line-height:1.6;font-variant-numeric:tabular-nums;letter-spacing:-.003em;-webkit-font-smoothing:antialiased;position:relative} .amb{position:fixed;inset:-10%;pointer-events:none;z-index:0} .amb.a{filter:blur(84px);background:radial-gradient(62% 52% at 12% 4%,rgba(var(--aur-a),var(--aur-1)),transparent 72%),radial-gradient(56% 48% at 90% 20%,rgba(var(--aur-b),var(--aur-3)),transparent 72%),radial-gradient(64% 54% at 28% 82%,rgba(var(--aur-a),var(--aur-1)),transparent 74%)} .amb.b{filter:blur(70px);opacity:.9;background:radial-gradient(50% 42% at 78% 64%,rgba(var(--aur-c),var(--aur-2)),transparent 72%),radial-gradient(44% 38% at 6% 44%,rgba(var(--aur-c),var(--aur-2)),transparent 72%)} .amb.v{background:var(--vig)} .display{font-size:34px;line-height:1.12;font-weight:600;letter-spacing:-.028em;margin:0;text-wrap:balance} .title{font-size:19px;line-height:1.3;font-weight:600;letter-spacing:-.014em;margin:0} p,li,td,th{font-size:15px;line-height:1.6;font-weight:400;margin:0} .micro{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:11px;line-height:1.4;font-weight:600;letter-spacing:.09em;text-transform:uppercase} header.mast{padding-block:76px 30px;display:flex;flex-direction:column;gap:16px} header.mast .micro{color:var(--sp-blue)} header.mast p{color:var(--ink-2);max-width:64ch;font-size:17px;line-height:1.6} h3.sub{font-size:15px;font-weight:600;margin:0;letter-spacing:-.008em} .g1,.g2,.g3{border-radius:var(--r);position:relative} .g1{background:var(--glass-1);backdrop-filter:var(--blur-1);-webkit-backdrop-filter:var(--blur-1);box-shadow:var(--lift-1),var(--edge)} .g2{background:var(--glass-2);backdrop-filter:var(--blur-2);-webkit-backdrop-filter:var(--blur-2);box-shadow:var(--lift-2),var(--edge)} .g3{background:var(--glass-3);backdrop-filter:var(--blur-2);-webkit-backdrop-filter:var(--blur-2);box-shadow:var(--lift-1),var(--edge)} .pad{padding:22px} .pad-s{padding:16px 18px} .inner{background:var(--inner);border-radius:var(--r-sm);padding:14px 16px} .solid{background:var(--glass-solid);border-radius:var(--r);box-shadow:var(--lift-1),var(--edge)} .grid{display:grid;gap:16px} .g2c{grid-template-columns:repeat(auto-fit,minmax(272px,1fr))} .g3c{grid-template-columns:repeat(auto-fit,minmax(205px,1fr))} .g4c{grid-template-columns:repeat(auto-fit,minmax(158px,1fr))} .stack{display:flex;flex-direction:column;gap:12px} .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap} .sw{border-radius:var(--r);overflow:hidden;background:var(--glass-1);backdrop-filter:var(--blur-1);-webkit-backdrop-filter:var(--blur-1);box-shadow:var(--lift-1),var(--edge)} .btn{font-family:inherit;font-size:14px;font-weight:600;border:0;border-radius:var(--r-pill);padding:10px 20px;cursor:pointer;letter-spacing:-.006em;transition:transform var(--ease),box-shadow var(--ease),background var(--ease)} .btn-p{background:linear-gradient(180deg,#0071CE 0%,#005DB4 42%,#0035A6 100%);color:#fff;box-shadow:0 1px 1px rgba(6,22,54,.18),0 10px 22px -12px rgba(0,63,168,.70),inset 0 1px 0 rgba(255,255,255,.28)} .btn-p:hover{transform:translateY(-1px);box-shadow:0 1px 1px rgba(6,22,54,.20),0 16px 30px -14px rgba(0,63,168,.80),inset 0 1px 0 rgba(255,255,255,.32)} .btn-s{background:var(--glass-2);backdrop-filter:var(--blur-1);-webkit-backdrop-filter:var(--blur-1);color:var(--ink);box-shadow:var(--lift-1),var(--edge)} .btn-t{background:transparent;color:var(--ink-2);padding-inline:12px} .btn-t:hover{background:var(--inner)} .btn:disabled{background:var(--inner);color:var(--ink-mute);box-shadow:none;cursor:not-allowed;transform:none} .btn:focus-visible{outline:2px solid var(--sp-blue);outline-offset:3px} .tag{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;line-height:1.3;padding:4px 11px;border-radius:var(--r-pill);background:var(--inner);color:var(--ink-2);letter-spacing:.01em} .tag.neutral{background:var(--st-neutral-t);color:var(--st-neutral)} .tag.attention{background:var(--st-attention-t);color:var(--st-attention)} .tag.negative{background:var(--st-negative-t);color:var(--st-negative)} .tag.positive{background:var(--st-positive-t);color:var(--st-positive)} .tag svg{width:12px;height:12px;flex:none} .pips{display:inline-flex;gap:6px;align-items:center} .pip{width:14px;height:14px;border-radius:50%;display:grid;place-items:center} .pip.done{background:linear-gradient(180deg,#2C8A74,#1F6F5B);box-shadow:inset 0 1px 0 rgba(255,255,255,.3)} .pip.draft{background:linear-gradient(180deg,#A87213,#8A5A00);box-shadow:inset 0 1px 0 rgba(255,255,255,.28)} .pip.stale{background:var(--st-attention-t);box-shadow:inset 0 0 0 1.8px var(--st-attention)} .pip.missing{background:transparent;box-shadow:inset 0 0 0 1.5px var(--hair-2)} .pip i{font-style:normal;font-family:"IBM Plex Mono",monospace;font-size:8px;font-weight:600;color:#fff;line-height:1} .pip.stale i{color:var(--st-attention)} .pip.missing i{color:var(--ink-mute)} .tblwrap{overflow-x:auto;border-radius:var(--r);background:var(--glass-solid);box-shadow:var(--lift-1),var(--edge)} .tbl{width:100%;border-collapse:collapse} .tbl thead th{text-align:left;padding:12px 16px;color:var(--ink-3);font-family:"IBM Plex Mono",monospace;font-size:10.5px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;white-space:nowrap;border-bottom:1px solid var(--hair)} .tbl tbody td{padding:13px 16px;border-top:1px solid var(--hair);vertical-align:middle} .tbl tbody tr:first-child td{border-top:0} .tbl tbody tr{transition:background var(--ease)} .tbl tbody tr:hover{background:var(--inner)} .tbl .n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap} .toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding-bottom:14px} .field{flex:1;min-width:190px;display:flex;align-items:center;gap:9px;background:var(--glass-2);backdrop-filter:var(--blur-1);-webkit-backdrop-filter:var(--blur-1);border-radius:var(--r-pill);padding:9px 15px;color:var(--ink-3);box-shadow:var(--edge),0 1px 2px rgba(6,22,54,.04)} .field input{border:0;background:transparent;font-family:inherit;font-size:14px;color:var(--ink);width:100%;outline:none} .chipsel{background:var(--glass-2);backdrop-filter:var(--blur-1);-webkit-backdrop-filter:var(--blur-1);border-radius:var(--r-pill);padding:9px 14px;font-size:13px;font-weight:500;color:var(--ink-2);display:flex;gap:7px;align-items:center;box-shadow:var(--edge),0 1px 2px rgba(6,22,54,.04)} .tabs{display:flex;gap:3px;padding:0 5px} .tab{font-family:inherit;font-size:13.5px;font-weight:600;border:0;background:transparent;color:var(--ink-3);padding:11px 16px;border-radius:var(--r) var(--r) 0 0;cursor:pointer;transition:color var(--ease),background var(--ease)} .tab[aria-selected="true"]{background:var(--glass-2);backdrop-filter:var(--blur-2);-webkit-backdrop-filter:var(--blur-2);color:var(--ink);box-shadow:var(--edge)} .tabpanel{background:var(--glass-2);backdrop-filter:var(--blur-2);-webkit-backdrop-filter:var(--blur-2);border-radius:0 var(--r) var(--r) var(--r);box-shadow:var(--lift-1),var(--edge);padding:20px} .ai:not(.msg){border-radius:var(--r);padding:18px 20px;display:flex;flex-direction:column;gap:10px;background:linear-gradient(135deg,rgba(0,51,161,.075) 0%,rgba(0,113,206,.045) 48%,rgba(204,39,176,.065) 100%),var(--glass-1);backdrop-filter:var(--blur-1);-webkit-backdrop-filter:var(--blur-1);box-shadow:var(--lift-1),var(--edge)} .ai .hd{display:flex;align-items:center;gap:8px} .ai .hd .micro{color:var(--sp-blue)} .ai p{color:var(--ink)} .ai .ground{font-size:13px;color:var(--ink-3)} .ai .foot{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap} .chev{background:transparent;border:0;color:var(--ink-3);font-family:"IBM Plex Mono",monospace;font-size:10.5px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;cursor:pointer;padding:0} .tile{border-radius:var(--r);padding:18px 20px;display:flex;flex-direction:column;gap:7px;background:linear-gradient(180deg,rgba(255,255,255,.28),rgba(255,255,255,0)),var(--glass-1);backdrop-filter:var(--blur-1);-webkit-backdrop-filter:var(--blur-1);box-shadow:var(--lift-1),var(--edge)} .tile .micro{color:var(--ink-3)} .tile .v{font-size:30px;font-weight:600;line-height:1.08;letter-spacing:-.03em} .tile .sub{font-size:13px;color:var(--ink-3);line-height:1.45} .tile.flag{background:linear-gradient(180deg,rgba(138,90,0,.10),rgba(138,90,0,.04)),var(--glass-1)} .tile.flag .v{color:var(--st-attention)} .loop{display:flex;border-radius:var(--r);overflow:hidden;background:var(--glass-1);backdrop-filter:var(--blur-1);-webkit-backdrop-filter:var(--blur-1);box-shadow:var(--lift-1),var(--edge)} .loop div{flex:1;padding:14px 16px;display:flex;flex-direction:column;gap:4px} .loop div + div{border-left:1px solid var(--hair)} .loop .micro{color:var(--ink-3)} .loop b{font-size:19px;font-weight:600;letter-spacing:-.02em} .loop .on{background:linear-gradient(180deg,rgba(0,113,206,.10),rgba(0,113,206,.03))} .loop .on b{color:var(--sp-blue)} .rail-demo{border-radius:var(--r);overflow:hidden;box-shadow:var(--lift-2);display:flex;min-height:230px} .empty{border-radius:var(--r);padding:28px 22px;display:flex;flex-direction:column;gap:12px;align-items:flex-start;background:var(--inner)} .legend{display:flex;gap:16px;flex-wrap:wrap} .legend i{width:10px;height:10px;border-radius:3px;display:inline-block;margin-right:7px} .legend span{font-size:13px;color:var(--ink-2);display:inline-flex;align-items:center} code.inl{font-family:"IBM Plex Mono",monospace;font-size:12.5px;background:var(--inner);padding:2px 6px;border-radius:var(--r-sm);color:var(--ink-2)} .note{border-radius:var(--r);padding:16px 18px;display:flex;flex-direction:column;gap:7px;background:linear-gradient(180deg,rgba(138,90,0,.09),rgba(138,90,0,.03)),var(--glass-1);backdrop-filter:var(--blur-1);-webkit-backdrop-filter:var(--blur-1);box-shadow:var(--lift-1),var(--edge)} .note .micro{color:var(--st-attention)} .note p{color:var(--ink)} @media (max-width:640px){.loop{flex-direction:column} .loop div + div{border-left:0;border-top:1px solid var(--hair)} .rail-demo{flex-direction:column} .rail-demo .nav{width:auto} } @media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}} .fld{display:flex;flex-direction:column;gap:6px} .fld > label{font-family:"IBM Plex Mono",monospace;font-size:10.5px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3)} .ctl{display:flex;align-items:center;gap:9px;background:var(--glass-2);backdrop-filter:var(--blur-1);-webkit-backdrop-filter:var(--blur-1);border-radius:var(--r);padding:11px 14px;box-shadow:var(--edge),0 1px 2px rgba(6,22,54,.04);transition:box-shadow var(--ease)} .ctl input,.ctl textarea,.ctl select{border:0;background:transparent;font-family:inherit;font-size:15px;color:var(--ink);width:100%;outline:none;letter-spacing:-.003em} .ctl textarea{resize:vertical;min-height:76px;line-height:1.55} .ctl.focus{box-shadow:var(--edge),0 0 0 3px rgba(0,113,206,.18),0 1px 2px rgba(6,22,54,.05)} .ctl.err{box-shadow:var(--edge),0 0 0 3px rgba(150,48,42,.16),0 1px 2px rgba(6,22,54,.05);background:linear-gradient(0deg,var(--st-negative-t),var(--st-negative-t)),var(--glass-2)} .ctl.warn{box-shadow:var(--edge),0 0 0 3px rgba(138,90,0,.15),0 1px 2px rgba(6,22,54,.05);background:linear-gradient(0deg,var(--st-attention-t),var(--st-attention-t)),var(--glass-2)} .ctl.off{background:var(--inner);box-shadow:none} .ctl.off input{color:var(--ink-mute)} .hint{font-size:13px;color:var(--ink-3);line-height:1.45} .hint.e{color:var(--st-negative);display:flex;gap:6px;align-items:flex-start} .hint.w{color:var(--st-attention);display:flex;gap:6px;align-items:flex-start} .hint svg{width:13px;height:13px;flex:none;margin-top:2px} .req{color:var(--st-negative);font-weight:600} .seg{display:inline-flex;gap:2px;padding:3px;border-radius:var(--r-pill);background:var(--inner)} .seg button{font-family:inherit;font-size:13px;font-weight:600;border:0;background:transparent;color:var(--ink-3);padding:7px 16px;border-radius:var(--r-pill);cursor:pointer;letter-spacing:-.004em;transition:color var(--ease),background var(--ease)} .seg button[aria-pressed="true"]{background:var(--glass-3);color:var(--ink);box-shadow:var(--edge),0 1px 3px rgba(6,22,54,.10)} .tog{display:inline-flex;align-items:center;gap:11px;cursor:pointer} .tog .track{width:44px;height:26px;border-radius:var(--r-pill);background:var(--inner);position:relative;transition:background var(--ease);box-shadow:inset 0 1px 2px rgba(6,22,54,.08)} .tog .track .knob{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(6,22,54,.28),inset 0 1px 0 rgba(255,255,255,.9);transition:transform var(--ease)} .tog.on .track{background:linear-gradient(180deg,#0071CE,#005DB4 60%,#0056B4)} .tog.on .track .knob{transform:translateX(18px)} .tog span{font-size:14px;color:var(--ink-2)} .opt{display:inline-flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:14px;color:var(--ink-2)} .box,.dot{width:19px;height:19px;flex:none;border-radius:var(--r-sm);background:var(--glass-3);box-shadow:var(--edge),inset 0 0 0 1px var(--hair-2);display:grid;place-items:center;margin-top:1px} .dot{border-radius:50%} .opt.on .box,.opt.on .dot{background:linear-gradient(180deg,#0071CE,#005DB4 60%,#0056B4);box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 1px 3px rgba(0,63,168,.35)} .box svg,.dot svg{width:12px;height:12px;color:#fff;opacity:0} .opt.on .box svg{opacity:1} .opt.on .dot::after{content:"";width:7px;height:7px;border-radius:50%;background:#fff} .sl{display:flex;flex-direction:column;gap:9px} .drop{border-radius:var(--r);padding:26px 20px;background:var(--inner);display:flex;flex-direction:column;align-items:center;gap:9px;text-align:center} .sth{display:flex;align-items:flex-start;gap:0} .sth .nd{flex:1;display:flex;flex-direction:column;gap:8px;position:relative;padding-top:2px} .sth .bar{display:flex;align-items:center;gap:0} .sth .cir{width:26px;height:26px;border-radius:50%;flex:none;display:grid;place-items:center;font-family:"IBM Plex Mono",monospace;font-size:10.5px;font-weight:600} .sth .cir.done{background:linear-gradient(180deg,#2C8A74,#1F6F5B);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.3)} .sth .cir.now{background:linear-gradient(180deg,#0071CE,#005DB4 60%,#0035A6);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 0 0 4px rgba(0,113,206,.14)} .sth .cir.todo{background:var(--glass-3);color:var(--ink-mute);box-shadow:var(--edge),inset 0 0 0 1px var(--hair-2)} .sth .cir.block{background:var(--st-negative-t);color:var(--st-negative);box-shadow:inset 0 0 0 1.5px var(--st-negative)} .sth .ln{flex:1;height:2px;background:var(--hair-2);border-radius:2px} .sth .ln.done{background:linear-gradient(90deg,#1F6F5B,#2C8A74)} .sth .lbl{font-size:13px;font-weight:600;letter-spacing:-.006em;padding-right:12px} .sth .sub{font-size:12.5px;color:var(--ink-3);padding-right:12px;line-height:1.45} .stv{display:flex;flex-direction:column} .stv .nd{display:grid;grid-template-columns:26px minmax(0,1fr);gap:0 14px;position:relative;padding-bottom:16px} .stv .nd:last-child{padding-bottom:0} .stv .nd::before{content:"";position:absolute;left:12.5px;top:26px;bottom:0;width:2px;background:var(--hair-2)} .stv .nd:last-child::before{display:none} .stv .cir{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-family:"IBM Plex Mono",monospace;font-size:10.5px;font-weight:600;z-index:1} .stv .c{display:flex;flex-direction:column;gap:6px;padding-top:2px;min-width:0} .stv .hdr{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap} .stv .hdr b{font-size:14px;font-weight:600;letter-spacing:-.006em} .stv .hdr .when{font-family:"IBM Plex Mono",monospace;font-size:10.5px;color:var(--ink-3);letter-spacing:.05em} .stv .ev{font-size:13.5px;color:var(--ink-2);line-height:1.5} .pad ul,.stack ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px} .pad ul li,.stack ul li{position:relative;padding-left:17px;font-size:14px;line-height:1.6;color:var(--ink-2)} .pad ul li::before{content:"";position:absolute;left:1px;top:8px;width:5px;height:5px;border-radius:50%;background:var(--sp-blue);opacity:.5} .stack ul li::before{content:"";position:absolute;left:1px;top:8px;width:5px;height:5px;border-radius:50%;background:var(--sp-blue);opacity:.5} .pad ul li b,.stack ul li b{color:var(--ink);font-weight:600} .prog{height:6px;border-radius:var(--r-pill);background:var(--inner);overflow:hidden;box-shadow:inset 0 1px 2px rgba(6,22,54,.08)} .prog i{display:block;height:100%;border-radius:var(--r-pill);background:linear-gradient(90deg,#0033A1,#0071CE)} .prog.mini{width:130px;height:4px;flex:none} .stages{display:flex;flex-direction:column;gap:9px} .stages div{display:flex;gap:10px;align-items:center;font-size:13.5px} .stages .tick{width:16px;height:16px;border-radius:50%;flex:none;display:grid;place-items:center} .stages .tick.ok{background:var(--st-positive-t);color:var(--st-positive)} .stages .tick.run{background:var(--inner);box-shadow:inset 0 0 0 1.5px var(--sp-blue)} .stages .tick.wait{background:var(--inner);box-shadow:inset 0 0 0 1.5px var(--hair-2)} .stages .ok + span{color:var(--ink-2)} .stages .run + span{color:var(--ink);font-weight:600} .stages .wait + span{color:var(--ink-mute)} .scene{position:relative;border-radius:var(--r);overflow:hidden;background:var(--glass-3);backdrop-filter:var(--blur-2);-webkit-backdrop-filter:var(--blur-2);box-shadow:var(--lift-2),var(--edge);min-height:340px} .three{display:grid;grid-template-columns:132px minmax(0,1fr) 250px;gap:1px;border-radius:var(--r);overflow:hidden;background:var(--hair);box-shadow:var(--lift-1),var(--edge);min-height:270px} .toast{display:inline-flex;align-items:center;gap:13px;padding:13px 16px;border-radius:var(--r);background:var(--glass-2);backdrop-filter:var(--blur-2);-webkit-backdrop-filter:var(--blur-2);box-shadow:var(--lift-2),var(--edge)} .toast .ic{width:22px;height:22px;border-radius:50%;flex:none;display:grid;place-items:center;background:var(--st-positive-t);color:var(--st-positive)} .toast b{font-size:14px;font-weight:600;letter-spacing:-.006em} .toast small{display:block;font-size:12.5px;color:var(--ink-3)} .toast .undo{font-family:inherit;font-size:13px;font-weight:600;color:var(--sp-blue);background:transparent;border:0;cursor:pointer;padding:0 2px} .menu{width:236px;border-radius:var(--r);padding:6px;background:var(--glass-2);backdrop-filter:var(--blur-2);-webkit-backdrop-filter:var(--blur-2);box-shadow:var(--lift-2),var(--edge);display:flex;flex-direction:column;gap:1px} .menu a{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:9px 12px;border-radius:var(--r-sm);font-size:14px;color:var(--ink-2);text-decoration:none} .menu a:hover{background:var(--inner);color:var(--ink)} .menu a kbd{font-family:"IBM Plex Mono",monospace;font-size:10.5px;color:var(--ink-3)} .menu hr{height:1px;background:var(--hair);border:0;margin:5px 0} .menu a.danger{color:var(--st-negative)} .crumb{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ink-3);flex-wrap:wrap} .crumb a{color:var(--ink-2);text-decoration:none} .crumb a:hover{color:var(--ink)} .crumb b{color:var(--ink);font-weight:600} .av{width:30px;height:30px;border-radius:50%;flex:none;display:grid;place-items:center;font-size:11.5px;font-weight:600;color:#fff;background:linear-gradient(150deg,#0058B8,#0033A1);box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 1px 3px rgba(6,22,54,.20)} .av.c2{background:linear-gradient(150deg,#B93CA5,#8C1E79)} .canvas{border-radius:var(--r);overflow:hidden;box-shadow:var(--lift-2),var(--edge);background:var(--glass-3);backdrop-filter:var(--blur-2);-webkit-backdrop-filter:var(--blur-2);min-height:420px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:20px;padding:36px 24px;text-align:center;position:relative} .canvas .glowwrap{width:100%;max-width:520px;padding:26px} .canvas .composer{position:relative;display:flex;align-items:center;gap:11px;padding:15px 18px;border-radius:var(--r);background:var(--glass-2);backdrop-filter:var(--blur-2);-webkit-backdrop-filter:var(--blur-2);box-shadow:var(--edge),0 2px 6px rgba(6,22,54,.07),0 0 34px -6px rgba(0,113,206,.38),0 0 60px -10px rgba(204,39,176,.26)} .canvas .composer input{border:0;background:transparent;font-family:inherit;font-size:16px;color:var(--ink);width:100%;outline:none;letter-spacing:-.006em} .canvas .composer input::placeholder{color:var(--ink-3)} .canvas h3{font-family:inherit;font-size:26px;font-weight:600;letter-spacing:-.024em;margin:0;line-height:1.2} .canvas .sublede{font-size:14.5px;color:var(--ink-3);max-width:46ch;margin:0} .chips{display:flex;gap:9px;flex-wrap:wrap;justify-content:center} .chips button{font-family:inherit;font-size:13px;font-weight:500;color:var(--ink-2);background:var(--glass-2);backdrop-filter:var(--blur-1);-webkit-backdrop-filter:var(--blur-1);border:0;border-radius:var(--r-pill);padding:8px 15px;cursor:pointer;box-shadow:var(--edge),0 1px 2px rgba(6,22,54,.04)} .chips button:hover{color:var(--ink)} .proactive{width:100%;max-width:560px;display:flex;flex-direction:column;gap:10px;text-align:left} .convo{border-radius:var(--r);overflow:hidden;box-shadow:var(--lift-1),var(--edge);background:var(--glass-3);backdrop-filter:var(--blur-2);-webkit-backdrop-filter:var(--blur-2);display:flex;flex-direction:column;min-height:420px} .convo .thread{flex:1;padding:18px;display:flex;flex-direction:column;gap:14px} .convo .dock{padding:14px 16px;display:flex;flex-direction:column;gap:10px;background:var(--glass-2);backdrop-filter:var(--blur-2);-webkit-backdrop-filter:var(--blur-2);box-shadow:inset 0 1px 0 var(--hair)} .convo .dock .composer{display:flex;align-items:center;gap:11px;padding:12px 15px;border-radius:var(--r);background:var(--glass-3);box-shadow:var(--edge),0 1px 2px rgba(6,22,54,.05)} .convo .dock .composer input{border:0;background:transparent;font-family:inherit;font-size:15px;color:var(--ink);width:100%;outline:none} .msg{max-width:78%;display:flex;flex-direction:column;gap:5px} .msg.me{align-self:flex-end;align-items:flex-end} .msg.ai{align-self:flex-start} .msg .who{font-family:"IBM Plex Mono",monospace;font-size:10px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3)} .msg .bub{padding:12px 15px;border-radius:var(--r);font-size:14.5px;line-height:1.55} .msg.me .bub{background:linear-gradient(180deg,#0071CE,#005DB4 62%,#0059B6);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.24),0 6px 16px -10px rgba(0,63,168,.6)} .msg.ai .bub{background:var(--glass-2);backdrop-filter:var(--blur-1);-webkit-backdrop-filter:var(--blur-1);color:var(--ink);box-shadow:var(--edge),0 1px 2px rgba(6,22,54,.05)} .raildrw{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:1px;border-radius:var(--r);overflow:hidden;background:var(--hair);box-shadow:var(--lift-1),var(--edge);min-height:310px} @media (max-width:760px){.three{grid-template-columns:minmax(0,1fr)} .raildrw{grid-template-columns:minmax(0,1fr)} .sth{flex-direction:column;gap:14px} .sth .ln{display:none} } .scene{min-height:380px} .scope{display:inline-flex;align-items:center;gap:8px;align-self:flex-start;padding:5px 10px 5px 8px;border-radius:var(--r-pill);background:rgba(0,113,206,.10);color:var(--sp-blue);font-size:12px;font-weight:600} .cmdk{width:min(520px,100%);border-radius:var(--r);overflow:hidden;background:var(--glass-2);backdrop-filter:var(--blur-2);-webkit-backdrop-filter:var(--blur-2);box-shadow:var(--lift-2),var(--edge)} @media (max-width:860px){.diff > div{grid-template-columns:minmax(0,1fr)} }:root{--r-shell:28px;--r-canvas:22px;--r-sheet:16px;--r-tile:12px} @media (max-width:900px){.bleed{margin-inline:0}} .studio2{position:relative;border-radius:var(--r-shell);display:grid;grid-template-columns:318px minmax(0,1fr);min-height:600px;overflow:hidden;background:linear-gradient(112deg,rgba(255,255,255,.74) 0%,rgba(255,255,255,.52) 26%,rgba(255,255,255,.28) 52%,rgba(255,255,255,.14) 100%),radial-gradient(60% 80% at 4% 0%,rgba(0,51,161,.10),transparent 70%),radial-gradient(52% 66% at 100% 100%,rgba(204,39,176,.09),transparent 72%);backdrop-filter:blur(30px) saturate(180%);-webkit-backdrop-filter:blur(30px) saturate(180%);box-shadow:var(--lift-2),inset 0 1px 0 rgba(255,255,255,.95)}:root[data-theme="dark"] .studio2,:root:not([data-theme="light"]) .studio2{} @media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .studio2{background:linear-gradient(112deg,rgba(120,165,225,.24) 0%,rgba(120,165,225,.17) 30%,rgba(120,165,225,.11) 60%,rgba(120,165,225,.07) 100%),radial-gradient(60% 80% at 4% 0%,rgba(76,127,232,.20),transparent 70%),radial-gradient(52% 66% at 100% 100%,rgba(232,132,214,.14),transparent 72%);box-shadow:var(--lift-2),inset 0 1px 0 rgba(214,232,255,.18)} }:root[data-theme="dark"] .studio2{background:linear-gradient(112deg,rgba(120,165,225,.24) 0%,rgba(120,165,225,.17) 30%,rgba(120,165,225,.11) 60%,rgba(120,165,225,.07) 100%),radial-gradient(60% 80% at 4% 0%,rgba(76,127,232,.20),transparent 70%),radial-gradient(52% 66% at 100% 100%,rgba(232,132,214,.14),transparent 72%);box-shadow:var(--lift-2),inset 0 1px 0 rgba(214,232,255,.18)} .chat2{display:flex;flex-direction:column;padding:22px 6px 18px 22px;min-width:0;position:relative} .t-ai{display:flex;flex-direction:column;gap:5px} @media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .chat2 .cmp{background:rgba(120,165,225,.17);box-shadow:inset 0 1px 0 rgba(214,232,255,.18),0 2px 9px -5px rgba(2,6,14,.52)}}:root[data-theme="dark"] .chat2 .cmp{background:rgba(120,165,225,.17);box-shadow:inset 0 1px 0 rgba(214,232,255,.18),0 2px 9px -5px rgba(2,6,14,.52)} .seam{position:absolute;top:0;bottom:0;right:-1px;width:56px;pointer-events:none;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.22))} @media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .seam{background:linear-gradient(90deg,rgba(120,165,225,0),rgba(120,165,225,.11))}}:root[data-theme="dark"] .seam{background:linear-gradient(90deg,rgba(120,165,225,0),rgba(120,165,225,.11))} .canv{margin:14px 14px 14px 0;border-radius:var(--r-canvas);display:flex;flex-direction:column;min-width:0;overflow:hidden;background:var(--glass-solid);box-shadow:var(--lift-2),inset 0 1px 0 rgba(255,255,255,.95)} @media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .canv{box-shadow:var(--lift-2),inset 0 1px 0 rgba(214,232,255,.18)}}:root[data-theme="dark"] .canv{box-shadow:var(--lift-2),inset 0 1px 0 rgba(214,232,255,.18)} .canv .bar2{padding:13px 18px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;box-shadow:inset 0 -1px 0 var(--hair)} .canv .bar2 .ttl2{font-size:14px;font-weight:600;letter-spacing:-.008em;margin-right:auto} .canv .gen2{display:flex;align-items:center;gap:11px;padding:10px 18px;box-shadow:inset 0 -1px 0 var(--hair);background:linear-gradient(90deg,rgba(0,51,161,.07),rgba(0,113,206,.04) 55%,rgba(204,39,176,.05))} .canv .gen2 span{font-size:12.5px;color:var(--ink-2)} .canv .gen2 .dot3{width:7px;height:7px;border-radius:50%;background:var(--sp-blue);flex:none} .canv .body3{flex:1;display:grid;grid-template-columns:66px minmax(0,1fr) 50px;min-height:0} .thumbs2{padding:16px 9px;display:flex;flex-direction:column;gap:9px;align-items:center;box-shadow:inset -1px 0 0 var(--hair)} .thumbs2 .th2{width:46px;height:32px;border-radius:8px;background:var(--inner);display:grid;place-items:center;cursor:pointer;font-family:"IBM Plex Mono",monospace;font-size:9.5px;font-weight:600;color:var(--ink-3)} .thumbs2 .th2.on{background:rgba(0,113,206,.12);box-shadow:0 0 0 2px var(--sp-blue);color:var(--sp-blue)} .vrail2{padding:16px 7px;display:flex;flex-direction:column;align-items:center;box-shadow:inset 1px 0 0 var(--hair)} .vrail2 .v2{width:30px;padding:7px 0;text-align:center;font-family:"IBM Plex Mono",monospace;font-size:9.5px;font-weight:600;color:var(--ink-3);border-radius:8px;cursor:pointer} .vrail2 .v2.on{background:rgba(0,113,206,.12);color:var(--sp-blue)} .vrail2 .tk{width:1px;height:13px;background:var(--hair-2)} .paper2{padding:26px 22px;display:flex;justify-content:center;align-items:flex-start;min-width:0;overflow:hidden} @media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .sheet2{background:linear-gradient(170deg,rgba(76,127,232,.14),rgba(0,0,0,0) 44%),var(--glass-solid);box-shadow:0 1px 2px rgba(2,6,14,.34),0 20px 48px -24px rgba(2,6,14,.62),inset 0 1px 0 rgba(214,232,255,.16)}}:root[data-theme="dark"] .sheet2{background:linear-gradient(170deg,rgba(76,127,232,.14),rgba(0,0,0,0) 44%),var(--glass-solid);box-shadow:0 1px 2px rgba(2,6,14,.34),0 20px 48px -24px rgba(2,6,14,.62),inset 0 1px 0 rgba(214,232,255,.16)} .kpi2.upd{box-shadow:0 0 0 2px rgba(0,113,206,.30);background:rgba(0,113,206,.07);position:relative} .kpi2.upd::after{content:"updated";position:absolute;top:-8px;right:9px;font-family:"IBM Plex Mono",monospace;font-size:8.5px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:#fff;background:var(--sp-blue);padding:2px 6px;border-radius:5px} .assump{border-radius:var(--r-tile);padding:13px 15px;background:var(--inner);font-size:12px;color:var(--ink-3);line-height:1.55} .rscale{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px} .rscale div{background:var(--inner);padding:14px;display:flex;flex-direction:column;gap:5px} .rscale .s1{border-radius:28px} .rscale .s2{border-radius:22px} .rscale .s3{border-radius:16px} .rscale .s4{border-radius:12px} .rscale .s5{border-radius:10px} .rscale b{font-size:13.5px;font-weight:600} .rscale code{font-family:"IBM Plex Mono",monospace;font-size:11px;color:var(--sp-blue)} .rscale span{font-size:12px;color:var(--ink-3);line-height:1.45} @media (max-width:860px){.studio2{grid-template-columns:minmax(0,1fr);min-height:0;border-radius:var(--r-canvas)} .chat2{padding:18px} .seam{display:none} .canv{margin:0 14px 14px} .canv .body3{grid-template-columns:minmax(0,1fr)} .thumbs2{flex-direction:row;box-shadow:inset 0 -1px 0 var(--hair);overflow-x:auto} .vrail2{flex-direction:row;box-shadow:inset 0 1px 0 var(--hair);overflow-x:auto} .paper2{padding:16px 12px} .sheet2{padding:20px} } @media (max-width:620px){.sheet2 .kpis2{grid-template-columns:minmax(0,1fr)} .kpi2.upd::after{right:auto;left:12px} } @media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .convo,:root:not([data-theme="light"]) .scene,:root:not([data-theme="light"]) .canvas,:root:not([data-theme="light"]) .tabpanel,:root:not([data-theme="light"]) .kb .kc{background:var(--glass-solid);backdrop-filter:none;-webkit-backdrop-filter:none} }:root[data-theme="dark"] .convo,:root[data-theme="dark"] .scene,:root[data-theme="dark"] .canvas,:root[data-theme="dark"] .tabpanel,:root[data-theme="dark"] .kb .kc{background:var(--glass-solid);backdrop-filter:none;-webkit-backdrop-filter:none} .themesw{display:flex;align-items:center;gap:10px;flex-wrap:wrap} .kb{display:grid;grid-template-columns:repeat(auto-fit,minmax(218px,1fr));gap:12px} .kb .col{background:var(--glass-1);backdrop-filter:var(--blur-1);-webkit-backdrop-filter:var(--blur-1);border-radius:var(--r);box-shadow:var(--lift-1),var(--edge);padding:12px;display:flex;flex-direction:column;gap:9px} .kb .ch{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 2px} .kb .ch .micro{color:var(--ink-3)} .kb .ct{font-family:"IBM Plex Mono",monospace;font-size:10.5px;font-weight:600;color:var(--ink-3);background:var(--inner);border-radius:var(--r-sm);padding:2px 7px;font-variant-numeric:tabular-nums} .kb .kc{background:var(--glass-3);border-radius:var(--r-sm);padding:11px 12px;display:flex;flex-direction:column;gap:8px;box-shadow:var(--edge),0 1px 2px rgba(6,22,54,.05)} .kb .kc b{font-size:13.5px;font-weight:600;letter-spacing:-.006em;line-height:1.4} .kb .kc .kid{font-family:"IBM Plex Mono",monospace;font-size:10px;color:var(--ink-3);letter-spacing:.06em} .kb .kc .kf{display:flex;align-items:center;justify-content:space-between;gap:8px} .kb .dz{border-radius:var(--r-sm);min-height:54px;background:var(--inner);outline:1.5px dashed var(--hair-2);outline-offset:-2px;display:grid;place-items:center;font-size:12.5px;color:var(--ink-3)} .kb .col.wip .ct{background:var(--st-attention-t);color:var(--st-attention)} .cal{background:var(--glass-solid);border-radius:var(--r);box-shadow:var(--lift-1),var(--edge);padding:16px;display:flex;flex-direction:column;gap:12px} .cal .chd{display:flex;align-items:center;justify-content:space-between;gap:10px} .cal .chd b{font-size:14px;font-weight:600} .cal .grid7{display:grid;grid-template-columns:repeat(7,1fr);gap:3px} .cal .dow{font-family:"IBM Plex Mono",monospace;font-size:9.5px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);text-align:center;padding:4px 0} .cal .d{aspect-ratio:1;border-radius:var(--r-sm);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:13px;color:var(--ink-2);font-variant-numeric:tabular-nums;cursor:pointer;transition:background var(--ease)} .cal .d:hover{background:var(--inner)} .cal .d.out{color:var(--ink-mute);cursor:default} .cal .d.out:hover{background:transparent} .cal .d.today{box-shadow:inset 0 0 0 1.5px var(--sp-blue);color:var(--ink);font-weight:600} .cal .d.sel{background:linear-gradient(180deg,#0071CE,#005DB4 60%,#0035A6);color:#fff;font-weight:600;box-shadow:inset 0 1px 0 rgba(255,255,255,.26)} .cal .d.sel .evd{background:#fff} .cal .evd{width:4px;height:4px;border-radius:50%;background:var(--sp-blue)} .cal .d.busy .evd{background:var(--st-attention)} .agenda{display:flex;flex-direction:column;gap:1px;border-radius:var(--r);overflow:hidden;background:var(--hair)} .agenda .ar{display:grid;grid-template-columns:76px minmax(0,1fr) auto;gap:12px;align-items:center;background:var(--glass-solid);padding:12px 14px} .agenda .at{font-family:"IBM Plex Mono",monospace;font-size:11px;color:var(--ink-3);letter-spacing:.05em;font-variant-numeric:tabular-nums} .agenda .an{display:flex;flex-direction:column;gap:2px;min-width:0} .agenda .an b{font-size:13.5px;font-weight:600;letter-spacing:-.006em} .agenda .an span{font-size:12.5px;color:var(--ink-3)} .slots{display:grid;grid-template-columns:repeat(auto-fit,minmax(92px,1fr));gap:8px} .slot{font-family:inherit;font-size:13px;font-weight:500;border:0;border-radius:var(--r-pill);padding:9px 12px;cursor:pointer;background:var(--glass-2);backdrop-filter:var(--blur-1);-webkit-backdrop-filter:var(--blur-1);color:var(--ink-2);box-shadow:var(--edge),0 1px 2px rgba(6,22,54,.04);font-variant-numeric:tabular-nums} .slot[aria-pressed="true"]{background:linear-gradient(180deg,#0071CE,#005DB4 60%,#0035A6);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.26)} .slot:disabled{background:var(--inner);color:var(--ink-mute);box-shadow:none;cursor:not-allowed;text-decoration:line-through} .pc{display:flex;gap:13px;align-items:flex-start;padding:15px 16px;border-radius:var(--r);background:var(--glass-1);backdrop-filter:var(--blur-1);-webkit-backdrop-filter:var(--blur-1);box-shadow:var(--lift-1),var(--edge)} .pc .av{width:40px;height:40px;font-size:13.5px} .pc .pb{display:flex;flex-direction:column;gap:5px;min-width:0;flex:1} .pc .pn{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap} .pc .pn b{font-size:14.5px;font-weight:600;letter-spacing:-.008em} .pc .pn span{font-size:12.5px;color:var(--ink-3)} .pc .pm{display:flex;flex-direction:column;gap:3px} .pc .pm div{display:flex;gap:8px;align-items:center;font-size:12.5px;color:var(--ink-2)} .pc .pm .k{font-family:"IBM Plex Mono",monospace;font-size:9.5px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);min-width:56px} .pc .pa{display:flex;gap:7px;flex-wrap:wrap;padding-top:2px} .faces{display:inline-flex;align-items:center} .faces .av{width:26px;height:26px;font-size:10px;box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 0 0 2px var(--glass-solid)} .faces .av + .av{margin-left:-6px} .faces .more{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;margin-left:-6px;background:var(--inner);color:var(--ink-2);font-family:"IBM Plex Mono",monospace;font-size:9.5px;font-weight:600;box-shadow:0 0 0 2px var(--glass-solid)} .feed{display:flex;flex-direction:column} .feed .fi{display:grid;grid-template-columns:22px minmax(0,1fr);gap:0 13px;position:relative;padding-bottom:15px} .feed .fi:last-child{padding-bottom:0} .feed .fi::before{content:"";position:absolute;left:10.5px;top:22px;bottom:0;width:2px;background:var(--hair-2)} .feed .fi:last-child::before{display:none} .feed .fd{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;z-index:1;background:var(--glass-3);box-shadow:var(--edge),inset 0 0 0 1px var(--hair-2);color:var(--ink-3)} .feed .fd svg{width:11px;height:11px} .feed .fd.pos{background:var(--st-positive-t);color:var(--st-positive);box-shadow:none} .feed .fd.att{background:var(--st-attention-t);color:var(--st-attention);box-shadow:none} .feed .fd.neg{background:var(--st-negative-t);color:var(--st-negative);box-shadow:none} .feed .fb{display:flex;flex-direction:column;gap:4px;padding-top:1px;min-width:0} .feed .fh{display:flex;gap:9px;align-items:baseline;flex-wrap:wrap} .feed .fh b{font-size:13.5px;font-weight:600;letter-spacing:-.006em} .feed .fh span{font-size:13.5px;color:var(--ink-2)} .feed .fw{font-family:"IBM Plex Mono",monospace;font-size:10px;color:var(--ink-3);letter-spacing:.05em;margin-left:auto} .feed .fp{font-size:12.5px;color:var(--ink-3);line-height:1.5} .pg{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-top:13px} .pg .rng{font-family:"IBM Plex Mono",monospace;font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);font-variant-numeric:tabular-nums} .pg .pgs{display:flex;gap:4px;align-items:center} .pgb{font-family:inherit;font-size:13px;font-weight:600;border:0;cursor:pointer;min-width:30px;height:30px;border-radius:var(--r-sm);background:transparent;color:var(--ink-2);font-variant-numeric:tabular-nums;transition:background var(--ease),color var(--ease)} .pgb:hover:not(:disabled){background:var(--inner);color:var(--ink)} .pgb[aria-current="page"]{background:var(--glass-3);color:var(--ink);box-shadow:var(--edge),0 1px 3px rgba(6,22,54,.10)} .pgb:disabled{color:var(--ink-mute);cursor:not-allowed} .pg .gap{color:var(--ink-mute);padding:0 2px;font-size:13px} .chart{border-radius:var(--r);padding:18px 20px 16px;display:flex;flex-direction:column;gap:14px;background:var(--glass-1);backdrop-filter:var(--blur-1);-webkit-backdrop-filter:var(--blur-1);box-shadow:var(--lift-1),var(--edge)} .chart .chh{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap} .chart .cht{display:flex;flex-direction:column;gap:3px} .chart .cht b{font-size:14px;font-weight:600;letter-spacing:-.008em} .chart .cht .unit{font-family:"IBM Plex Mono",monospace;font-size:9.5px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3)} .chart .plot{position:relative} .chart svg{display:block;width:100%;height:auto;overflow:visible} .chart .ax{font-family:"IBM Plex Mono",monospace;font-size:9.5px;fill:var(--ink-3);letter-spacing:.04em} .chart .gl{stroke:var(--hair);stroke-width:1} .chart .nodata{border-radius:var(--r-sm);background:var(--inner);padding:26px 18px;display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center} .chart .nodata b{font-size:13.5px;font-weight:600} .chart .nodata span{font-size:12.5px;color:var(--ink-3)} .spark{display:inline-block;vertical-align:-2px;width:74px;height:18px} .delta{font-family:"IBM Plex Mono",monospace;font-size:11px;font-weight:600;font-variant-numeric:tabular-nums} .delta.up{color:var(--st-positive)} .delta.dn{color:var(--st-negative)} @media (max-width:640px){.agenda .ar{grid-template-columns:64px minmax(0,1fr)} .agenda .ar >:last-child{grid-column:1/-1} }
```

**Fonts as shipped:** Archivo 400/500/600 and IBM Plex Mono 400/500/600, both from Google Fonts and both openly licensed. **Archivo is the DEFAULT body face, not a fixed one — Step 2b decides whether it is replaced by the client's.** IBM Plex Mono stays. **If the mono is not
actually embedded, table headers fall back silently and the whole grid loses its register.**

⚠️ **Two token groups are declared as BARE triples** — `--aur-a` / `--aur-b` / `--aur-c`, consumed
as `rgba(var(--aur-a),a)`. **There is no `rgb(` to match, so a find-and-replace over hexes and
`rgba(...)` will skip them and leave the ambient field on the previous brand.** At 5% opacity that
does not look broken, it just casts the whole page in the wrong hue. Their hex equivalents are
`#0033A1` / `#0071CE` / `#CC27B0` in light and `#4C7FE8` / `#6BB3EA` / `#E884D6` in dark.

## Step 1 · Sample the brand

* **Read the CSS custom properties off `:root` on the live site** — not a screenshot, not the brand
  book. *On daikincomfort.com they are literally `--daikin_blue`, `--daikin_orange`,
  `--daikinGradient`.* Take the neutral ramp too. **The type stack is its own step — see Step 2b.**
* **🔴 A brand book's print primaries are not necessarily the hue the client means by "our colour".**
  Proofpoint's second attempt used H 196 — the hue of their own 5415 Blue — and was still wrong. The
  answer came as a swatch: *"Its more of sea green and bluish…"*, sampled as `#102F2D` off their live
  site. **When a swatch is available, sample it. Do not reason toward it.**
* **Inventory before transforming** — v3.4 carries **54 distinct hexes and 25 `rgb()` triples**.
  Count, transform, diff the count.

## Step 2 · Harvest the logo

**Acquisition, in order. Stop at the first that yields a real file:**

1. **Inline `<svg>` in the site header**, or a linked `.svg` (`/logo.svg`, `/assets/logo*.svg`) —
   always preferred; it scales and recolours cleanly.
2. `<link rel="apple-touch-icon">` — usually 180px, square, the mark alone.
3. `<meta property="og:image">` — usually the lockup, often with padding to crop.
4. `/favicon.svg` or `/favicon.ico`.
5. **Ask.** See stop 2 — never trace.

**Then derive the kit. Seven variants, because a navbar and a favicon are not the same problem:**

| Variant | Where it goes | Min size | Ground |
| --- | --- | --- | --- |
| **Primary lockup** | Login, splash, cover slide, document header | 140px wide | Light page only |
| **Horizontal lockup** | Product header, email signature | 110px wide | Light page or tier-1 glass |
| **Stacked lockup** | Narrow columns, print, square crops | 96px wide | Light page only |
| **Mark only** | Collapsed rail, tab strip, compact header | 24px | Any |
| **Reversed mono** | **The nav rail** — the one branded surface | 24px | Brand gradient |
| **One-colour** | Watermark, single-ink print | 24px | Any |
| **App / favicon** | Tab, bookmark, PWA | 16 · 32 · 180 · 512 | Its own |

**Rules, and they are measured like anything else:**

* **Clear space is half the mark's height on all four sides.** Nothing crosses it, including the
  product name.
* **The mark is measured at ≥ 3:1 against its ground.** It is a graphical object, not text — 3:1 is
  the bar, and it still has to be met, in every variant and both themes.
* **Account and org logos are circles** (given on SailPoint: *"the logo used should be circular"*).
  Crop to a circle; never letterbox a rectangle inside one.
* **🔴 The rail is a gradient, so the logo on it is REVERSED MONO** — not the colour version with a
  white plate or glow behind it. A knocked-out mark on the brand gradient is the single most common
  place a prototype stops looking like the client owns it.
* **Never** recolour the mark outside the approved mono and reversed versions · place the
  full-colour logo on the brand fill · stretch, rotate, outline or shadow it · redraw it.
* **Record provenance** — which URL each file came from. Mark anything unverified `[UNVERIFIED]`.

## Step 2b · Type — research the real face, then decide what you may legally ship

**Two separate questions, and conflating them is the mistake.** *What typeface does the client
actually use?* is research. *May we put that file in our prototype?* is licensing, and the answer is
usually no.

### Identify it — in this order

⚠️ **Fetch the linked STYLESHEET, not the page.** A page fetch returns converted text with no
`@font-face` in it — tried on a live client site and it came back with zero font information while
the site plainly loads webfonts. Read the CSS file the page links to, or use the browser.

1. **`<link>` to `fonts.googleapis.com/css2?family=…`** — names the family outright, and tells you it
   is openly licensed. Best case; you are done.
2. **`@font-face` in the stylesheet** — `font-family` plus a `src: url(….woff2)`. The filename
   usually carries the family name.
3. **The loader domain names the foundry:** `use.typekit.net` / `p.typekit.net` → **Adobe Fonts** ·
   `fast.fonts.net` / `*.fontdeck` / Monotype paths → **Monotype** · `cloud.typography.com` →
   **Hoefler&Co**.
4. **Computed `font-family` on `body` and on a heading** — catches the case where the brand face is
   only used for display and the body is a system stack.
5. **Their brand or press page**, which often names the typeface in words.
6. **Ask.** Do not guess from a screenshot; a wrong guess propagates into every screen.

**Record what you found even when you cannot use it.** The style guide names the real face as what
production should license. That sentence is worth having in front of the client.

### 🔴 The licensing rule — identify the real face, ship an open one

**A webfont licence does not travel to us.** This is not caution, it is what the licences say:

* **Adobe Fonts cannot be self-hosted at all** and cannot be used by a third party — *"Adobe doesn't
  offer the ability to host fonts locally"*, and a client's site *"must load Adobe Fonts through
  their own Creative Cloud subscription"*. An agency cannot carry them into its own build.
* **Monotype webfonts are single-domain and metered** — a licence covers *"a single domain"*, runs on
  *"prepaid pageviews"*, and **agencies "may not share a single webfont license across multiple
  websites"**.
* **Google Fonts are open** (SIL OFL / Apache 2.0) — self-hosting, commercial use and redistribution
  are all permitted. This is why they are the fallback.

**So the rule, and it is not negotiable: never download and redistribute a client's licensed webfont
into our prototype.**

| What you found | What to ship |
| --- | --- |
| A Google Font | **Use it.** Link it or self-host it |
| Any other open face (OFL/Apache on GitHub or a foundry's free tier) | **Use it**, after checking the licence text itself |
| A licensed face — Adobe, Monotype, Hoefler, a bespoke foundry cut | **The closest open substitute**, with the real face named in the style guide |
| A display or script face used only in the logo | **Do not use it for UI at all.** It is a logo face; the body face is a separate question |
| Nothing identifiable | **Keep the system's own faces** and say so |

### Choosing the substitute — match the metrics, not the vibe

Two faces that "look similar" at 48px can wreck a 13px table. **Match, in this order:
x-height ratio · advance width · classification (grotesque / neo-grotesque / geometric / humanist) ·
stroke contrast · terminal style · whether it has tabular numerals**, which the system needs on
every number.

Starting points, **each to be verified by overlaying the two at the same size, never accepted from
this table alone**:

| Client's face | Open starting point |
| --- | --- |
| Helvetica / Helvetica Neue / Neue Haas Grotesk / Arial | **Inter** |
| Graphik, Founders Grotesk, Aktiv Grotesk | **Inter** or **Archivo** |
| Proxima Nova, Brandon, Sofia Pro | **Archivo** or **Figtree** |
| Gotham, Montserrat-adjacent geometrics | **Montserrat** |
| Avenir, Museo Sans, Nunito-adjacent humanists | **Nunito Sans** |
| Futura, Avant Garde | **Jost** |
| Circular, Poppins-adjacent geometrics | **Poppins** |
| DIN, Eurostile | **Barlow** or **Archivo Narrow** |
| Frutiger, Myriad, Univers | **Source Sans 3** |
| Tiempos, Georgia, a transitional serif | **Source Serif 4** |
| Garamond, an old-style serif | **EB Garamond** |

### ⚠️ A font swap invalidates the audit — re-measure

Changing the body face changes x-height and advance width, so it moves **apparent size, line length,
vertical rhythm and every fixed-width layout**. After the swap:

* **Re-run the contrast audit in both themes.** Contrast itself does not move, but perceived weight
  does — a lighter face at `--ink-3` can read thinner than the measured ratio suggests.
* **Re-measure fixed-width layouts.** A wider face is exactly what pushes a six-station rail back out
  of its container.
* **Check the numerals are tabular**, or every number in the system loses its alignment.
* **Check the four type sizes still hold their hierarchy** — a large x-height face makes 13px and
  15px look like the same size.

**🔴 Keep IBM Plex Mono regardless.** The mono is structural, not brand — it carries table headers,
eyebrows, KPI labels, timestamps and citation chips, and its 10.5px table header is a measured value.
Clients almost never have a brand mono, and swapping it changes the grid's register for no gain.
**Swap the body face; keep the mono.**

## Step 3 · Transform, preserving LUMINANCE

**The whole value of porting a validated system is that its measurements survive. They survive only
if you hold the right quantity fixed, and it is not the one in the colour picker.**

Contrast is a function of relative luminance alone. **HSL lightness is not luminance** — green at
L .40 is far brighter than blue at L .40. Measured on the Proofpoint port: holding HSL-L fixed while
rotating 207° → 176° took the primary from **4.54:1 to 3.12:1**, silently, on a token the document
prints a number for.

```python
import colorsys
def _lin(c): c/=255; return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
def Y(rgb): r,g,b=rgb; return .2126*_lin(r)+.7152*_lin(g)+.0722*_lin(b)
def hsl_rgb(h,s,l): return tuple(round(v*255) for v in colorsys.hls_to_rgb(h,l,s))

def reskin(rgb, hue, sat):
    """Saturation is CHOSEN (that is the muting). Lightness is SEARCHED. hue/sat/l in 0..1."""
    target, lo, hi = Y(rgb), 0.0, 1.0
    for _ in range(60):
        mid = (lo+hi)/2
        if Y(hsl_rgb(hue, sat, mid)) < target: lo = mid
        else: hi = mid
    return hsl_rgb(hue, sat, (lo+hi)/2)
```

⚠️ **Do not add a "drop saturation if Y is unreachable" fallback.** In HLS, lightness 1.0 is white at
every saturation, so every `Y` in [0,1] is always reachable; that branch can only fire spuriously,
on a tolerance tighter than integer-RGB rounding, and when it fires it flattens a colour to grey
while keeping its hue. `#86CDB4` came back `#BFBFBF`. **Saturation is chosen; lightness is searched.**

**Assign colour by job and keep the jobs separate:** brand/chrome · status · categorical ·
sequential.

* **The brand colour has exactly three uses** — the one primary action, the active nav item, the
  selected state. Not headings, icons, counts, or links in tables. Everything else greyscale.
* **Reserve the warm end for risk states** so a categorical colour never reads as an alarm. ⚠️ **If
  the brand itself is warm, Step 4 inverts this.**
* **Muting is a saturation cut, never a lightness cut** — a lightness cut moves the quantity you are
  holding. Worked example: blues → H176 at S × 0.70 (cap .62); the cerise family → H152 at S × 0.62
  (cap .44) for the gradient tail; positive → H138 against a green brand; amber → H28; red → H6;
  anything under S .06 left alone.
* **Four statuses, tonal only** — 8–10% tint, text at the 700 step, never a saturated fill.
  **Status always ships as icon + word + colour.**
* **Charts: one hue at several lightness steps.** Fixed hue order, never cycled.
* **🔴 Brand-as-accent and brand-as-fill are two different values.** White on the Proofpoint fill
  measured 4.15 against a claimed 4.94 — **the fill gradient runs one step darker than the accent
  token**, and it governs the primary button, user chat bubble, toggles, checked boxes, the current
  stepper node and the bulk-bar counter. **Check every gradient stop, not just the mid one.** In
  dark, brand-as-text lightens while brand-as-fill does not.

## Step 4 · The warm-brand checks (skip if the brand is cool)

Three things appear on a red or orange brand and on no cool one:

* **Negative status collides with the brand and no contrast figure will warn you.** A red brand and
  a red error measure 1.54 contrast — but contrast is a *lightness* metric and says nothing about
  categorical separation. **Measure ΔE.** At H 350 negative sits 26 ΔE from the brand against 90 ΔE
  in the blue original; **H 344 recovers 32 ΔE** and is about the ceiling before the error reads as a
  brand tint. Icon + word + colour becomes load-bearing rather than belt-and-braces.
* **The chart ramp must leave the brand hue entirely.** A six-step red ramp reads as six alarm
  levels. Send it cool — still one hue at several lightness steps, and it can never read as risk.
* **The accent needs more headroom.** A straight port put Titan's accent at 4.48 on the page, a fail
  where the blue measured 4.54.

## Step 5 · Both themes, and both reachable

**Light and dark are both deliverables. The mode you built in is not the only one that gets
checked.**

* **v3.3 shipped both themes and zero `<script>`**, so it silently followed the reader's OS and the
  reviewer only ever saw dark: *"do we not have light mode."* Two themes measured and argued over
  across a whole section, one of them invisible. **Shipping both is not enough — both must be
  *reachable*.**
* **A theme built by inversion fails on contact.** Light-mode brand hexes in a dark ambient field
  paint shadow instead of light; that is what blotched the first SailPoint dark mode.

**The style guide ships a theme switch** — built from `.seg` (D0), defaulting to the OS, remembered
in `localStorage`. **A screen built from the design system does not**, because a theme toggle in
product chrome is our scaffolding shipped to the client. On a product build, ship the mode the
design was made in and **keep the other theme's tokens live in the stylesheet**, so the second theme
is one attribute away rather than a rebuild.

**Dark specifics:** ambient washes go *lighter* than the page · edges catch light upward in dark and
downward in light · one hue carries two categorical steps in dark, three in light · **a container
that HOLDS other glass takes the opaque rung**, or nested glass composites two rungs above its
intended one and drags every ink token after it.

**Light specifics — it is not dark with the tokens flipped:** near-white brand tint base · **aurora
alphas roughly halved** · tier 1 `rgba(255,255,255,.72)`, tier 2 `.82`, tier 3 brand at 5% · inset
highlight `rgba(255,255,255,.9)` · shadows to the brand's darkest tone at 8–12% · **the accent glow
drops, replaced by a soft focus ring**.
⚠️ **A tinted light background changes the surface a chart was validated against** — Daikin's palette
passes on `#F4F8FC` and a third slot drops below 3:1 by `#EEF4FA`. Cap the tint and re-run the
validator. **Re-measure fixed-width layouts after restyling** — larger radii and padding are what
push a six-station rail back out of its container.

## Step 6 · Audit, composited, both themes

**Walk every text role with alpha composited over its real parent chain, in light and in dark.** The
reference run on v3.4 covered 35 new roles and ended with 3 under AA in each theme, all three
deliberately dimmed states.

**Mechanical checks, all pass/fail:**

* **Rendered and screenshotted in light AND dark.** A theme nobody has looked at is broken.
* `grep -o 'stroke[A-Z]'` → **nothing.** 79 camelCase SVG attributes once shipped in our own design
  language with every icon at browser-default stroke. **JSX takes camelCase; plain HTML takes
  kebab-case — same defect, opposite fix, both silent.**
* `grep -E '\-\-[a-z-]+: ?[0-9]+,[0-9]+,[0-9]+'` → every **bare rgb triple** accounted for. v3.4
  declares its ambient field as `--aur-a:0,51,161`, consumed as `rgba(var(--aur-a),a)`. **There is no
  `rgb(` to match, so a hex-and-rgba replace leaves the ambient field on the previous client's
  brand** — at 5% opacity it does not look broken, it just casts the page in the wrong hue.
* Card `border-width` computes 0 · gradient cards carry no inset ring · `backdrop-filter` computes
  `blur(...) saturate(...)`, not `none` · 1px top edge on every glass surface.
* Radii only {10, 6, pill, circle} outside the studio.
* Table header IBM Plex Mono 10.5px **and the face actually embedded** — if it silently falls back
  the whole grid loses its register.
* **If the body face was swapped (Step 2b): numerals are tabular, the four type sizes still hold
  their hierarchy, and no fixed-width layout has overflowed.**
* Tag font-size < button font-size · status tags ≥ 4.5 composited, both themes · **logo mark ≥ 3:1
  on its ground, every variant**.
* One `<style>`, one `</style>` · no horizontal page scroll · zero JS errors.
* **Theme switch correct under both OS schemes and across a reload.**
* **Narrow a filter until it returns nothing** and look at which empty state appears.

**Four traps, each of which produced a false result on a real run:**

1. **Gradient grounds read as transparent.** A walker reading `backgroundColor` finds nothing on a
   `linear-gradient` surface and falls through to the page — it reported **1.03:1** on rail text that
   measures **12.12:1**. Put an explicit `background-color` under every gradient: honest measurement
   plus a real fallback ground.
2. **Alpha ignored.** Composite the tint over its actual parent or every tonal status tag reports
   ~1.2 and you "fix" what was never broken. **Measuring the wrong thing is its own failure mode.**
3. **🔴 Inject CSS before the LAST `</style>`, not the first.** The first may be the host page's own
   skeleton — the rules land outside the stylesheet, are stripped on export, and every component
   renders with browser defaults while the file looks complete and the elements are all present in
   the DOM. **This is written down and it still happened while building v3.4.** Verify a *computed
   value* on a new component — not the source text, not the presence of the element.
4. **A handler audit false-clears if `[data-theme]` is on `<html>`** — `el.closest('[data-theme]')`
   then matches every element. Exclude `document.documentElement`. Same trap in Playwright:
   `page.click('[data-theme]')` clicks `<html>` and your dark screenshot comes back light — select
   `button[data-theme]`.

## Step 7 · Ship

**Three deliverables:**

1. **Living style guide** — self-contained HTML, the full section set, light and dark with a working
   switch, published as an artifact. Doubles as the visual spec the build prompt points at. Carry:
   the swatch and its provenance · the token block · type scale · glass tiers · ambient field · every
   component **rendered, not described** · the table toolbar with all four states including
   filtered-empty · the AI Insight card · the container doctrine.
2. **Token block** — one `:root`, tokens named by **job** never by colour, **a measured ratio printed
   beside each**, non-text ones marked. A token carrying a number nobody re-measured after a hue
   rotation is a defect.
3. **Logo kit** — the seven variants with the usage matrix, clear space, minimum sizes, misuse list
   and provenance.

**And a type note:** the client's real typeface named, what was shipped instead, and why — *"Brand face
 is Gotham (Monotype, single-domain licence); shipped Montserrat as the closest open substitute.
 Production should license Gotham."* **A client reading that learns something; a silent substitution
 looks like we did not notice.**

**Plus a port note on the page itself**, stating the source version, max |ΔY| across all colours, and
every decision the port forced. **Anchor the one branded surface to the client** — the nav and rail
gradients start at the sampled swatch.

**Swap the sample domain, not the doctrine.** Proofpoint: Deal Gate → Quote Builder; gate artefacts
→ product configuration / pricing summary / legal review / order form; identities → seats; Okta IG →
Defender for O365; Stage 20/40 → awaiting approval / approved. **Every measurement stayed.**

⚠️ **Anonymise at extraction: the format travels, the client name does not.** Check the artifact's
share setting before handing over a link — the Proofpoint one shipped as "anyone with the link".
**If you fix something in the stylesheet, say so in the hand-over** — an unreported fix means
the next run reintroduces it and the skins quietly diverge.

---

# REFERENCE

## Form — the parts people get wrong

* **No borders on cards.** Separation is elevation and tone, never a line. Hairlines *inside* a card
  — row separators, a divider between two regions — are fine; the rule is about the card's outline.
* **A card carrying colour gets exactly one treatment** — gradient wash alone, **or** solid tint plus
  one inset hairline. Never both. A gradient already says "selected"; a ring on top of it is the most
  common violation, and it shows up most on selected options inside a chat input. A solid tint
  without a ring reads as a flat slab, which is why the inverse holds.
* **Corner radius is a fixed five-step scale. Never improvise a value.** **10px** everywhere — cards,
  tiles, containers, inputs, selects, buttons, panes, drawers, modals, table containers · **6px**
  small inner elements — tags, chips, code · **pill** for toolbar search, facets and accent pills ·
  **circle** for avatars and account logos · **studio only** shell 28 / canvas 22 / sheet 16 /
  tile 12, because a 10px corner on an 1,100px object reads as a cut rather than a form. **Never
  8/12/14/16 outside that scale, and never a mix on one page** — mixed radii are the single most
  common reason a build reads as unfinished. ⚠️ A blanket flatten to 10px was tried on the SailPoint
  wireframe 22 Sept 2026 and reverted within the hour. **Do not re-propose it.**
* **Ambient aurora in the brand theme, never flat grey.** Layered low-opacity radial blooms
  distributed down the page so a long document does not go flat below the fold. Percentage-sized
  radials on the body; avoid `background-attachment: fixed`, which bands in full-page captures.
  **Dense internal tool: 3–4% maximum, two or three blooms, page body only** — never behind a table
  or a side pane, which take a solid near-white ground so rows stay legible.
* **Glass in three tiers plus a nested rung**, with a **1px inset top highlight** — that detail is
  what sells it as light catching an edge. Nested `inner` surfaces instead of a second bordered box
  is what stops a UI looking cheap.
* **Two elevation levels, never a third.** Resting and raised. Rows do not lift on hover; they change
  tone.
* **Four type sizes, two weights** (400/600), `tabular-nums` on every number. **The mono face is
  structural, not decorative** — table headers, eyebrows, KPI labels, citation and version chips take
  it; body copy never does. If the mono is not actually embedded the headers fall back silently and
  the whole grid loses its register.
* **One icon weight, two sizes** — 16px in tables and chips, 18px in nav. Stroke 1.6.
* **Motion is 120–160ms ease-out on panes, drawers and tonal hover, and nothing else moves.** No
  count-ups, no card entrance animations, no skeleton shimmer.
* **Tags are quiet and smaller than the smallest button** — 11–11.5px against a 13–14px button,
  tonal, no border, no sentence inside. A tag states a fact; it must never read as pressable.

## Components — the doctrine, not just the class

* **Every table gets a toolbar**: search left, filters right, nothing in the middle, **above and
  outside** the card (the card is the table's **ground**, not its container). The search **reports
  its result beside itself — "4 of 7"**. Three or four facets (D8), drawn from the visible rows so a
  facet can never offer a value returning nothing. Applied filters are removable chips with one
  *Clear all*.
  **⚠️ A filtered-empty table is NOT an empty table and they must never share a state.** *"No rows
  match your search and filters"* with a clear action is a different fact from *"No opportunities at
  Stage 20 yet"* with a create action. **Showing the second when the first is true is the single most
  common table bug and it makes working software look broken.** A static reference matrix — a
  discount-authority table, a legend, a key-value spec block — is not a record list and takes no
  toolbar.
* **Pagination is built once and reused.** The range names the **total** ("1–10 of 47"), reflects the
  filter, disables rather than hides at the ends, and does not appear under ~25 rows.
* **Every AI or system-generated insight goes in a labelled AI Insight card** — subtle brand
  gradient, one CTA inside the same card, overflow behind a chevron, never by growing the card or
  truncating mid-sentence. The user must always be able to tell what the data *says* from what we
  *inferred*. **Reference: Topcon's approval-suggestion step** — a *"Suggestion only — you decide"*
  chip, a grounding line naming the source SOP and precedent set, per-row confidence, a reason per
  row, **and one row deliberately excluded with its reason shown.** Copy that shape.
* **Kanban** is for states a person changes and items that can move *backwards*. Fixed-order work is
  a **stepper**. WIP limits shown in the attention tone. The drop zone is **the one dashed edge we
  allow**, because the dash means something; every other dashed edge is decoration.
* **Calendar has three shapes** — month grid ("when is it free"), agenda ("what is happening"), slot
  picker ("commit to one"). Shipping a month grid when the user must choose a *time* is the common
  version of this mistake. Today takes a ring, selection takes the fill, **never both on one cell**.
  A taken slot is struck through and disabled, **never hidden** — hiding it makes a busy day look
  empty.
* **A person is a record, not a string.** Person card or face stack anywhere a human is named. Cap
  the stack at three faces plus a count; the overflow chip is a count, not an avatar; initials, never
  a generic silhouette.
* **An activity feed is not a stepper** — a stepper's shape is known in advance, a feed's is not.
  Newest first, mono timestamps, actor and object bold but not the verb, automated entries say
  "System", and a change carries its reason. A history that records *what* without *why* gets
  re-litigated in a meeting.
* **Chart frame:** the system owns the card, title, **unit**, legend placement and no-data state; the
  ramp and marks follow the palette rules and the `dataviz` skill. A chart without a stated unit is a
  decoration. **Never colour a delta by its arithmetic sign** — colour it by whether the movement is
  good, and name the comparison period beside it.
* **Container doctrine:** **modal** only for irreversible or legally significant acts (withdraw,
  reject with mandatory reason, e-signature, stop ship) — blocking is the point, never nested, never
  holding a scrolling table · **right drawer** (~480px, dismissible) for configuration attached to
  the current record · **third pane** (persistent, resizable, pushes rather than overlays) for the
  inspector, whose whole value is surviving a move to the next row · **stepper** where the *order* is
  part of the meaning · **full page** only for objects deserving a shareable URL · **inline expand**
  for hierarchies · **bottom sheet** never, on desktop.
* **A control sits inside the boundary of what it changes** — no divider between an active tab and
  the panel it governs. **Named exception: the table toolbar**, above and outside the card.
* **Header carries identity, navigation context, notifications, profile. Nothing else.** No role or
  persona switcher — a visible `Planner · CSR · Manager · Auditor` control tells the client instantly
  this is a mock, and real RBAC is an attribute of the signed-in user, so role switching lives in the
  profile menu. No theme toggle, no demo-path control. A quiet scope indicator is fine.
* **Left nav: logo → navigation → profile at the bottom**, on a premium brand gradient.
* **One composer per surface. One right-hand rail, not two** — assistant and inspector share it as
  two modes; opening the assistant swaps the mode and remembers the inspector's state.
* **Copilot — two shapes, deliberately.** On a dashboard or working screen: a **floating icon
  bottom-right expanding into a floating box** that floats *over* content and never docks, pushes or
  reflows, with its own layout — input pinned to its bottom, thread scrolling above. Inside a
  two-pane studio: **a region of the shell**, interface left, conversation right, no card, no fill,
  no divider — *a pane that lives in the layout is not a floater*. On its own screen: a centred
  column built around the input, no page header. User messages right, agent left. Suggested prompts
  **outside** the input. **Loading is a sequence, not a spinner** — show the real stages; a copilot
  that shows its stages reads as reasoning, a spinner reads as latency. **The copilot speaks first.**
* **No stacked sublines under headers, no redundant preview data.** One header, one line of support
  at most, and only if it carries something the header does not. Show data by the priority of the
  flow the user is in on the screen they are on.
* **A fifth data state: UNSET.** Beyond empty / loading / error / populated — **a field belonging to
  a journey the user has not completed shows as visibly unset, never a seeded default dressed as
  their own answer.** On one build this produced a cost one-pager reading $26,250 against an actual
  $55,550 and a visit "booked" for March 2011, while the Next card told her to plan the visit the
  one-pager said was already booked.

## The use-case dial

Same system, same components, both themes. What moves is restraint, ground and radius scale.

| Use case | Ambient | Ground | Radii | Colour |
| --- | --- | --- | --- | --- |
| **Dense internal tool** (PLM, config, ops console) | aurora 3–4%, 2–3 blooms, body only | solid near-white behind tables and side panes | 10 / 6 / pill | brand on primary action, active nav, selected — nothing else |
| **Client-facing demo surface** | full aurora, blur 58–70px, vignette | glass tiers 1–3 | 10 / 6 / pill / circle | brand gradient on the nav rail; one accent pill |
| **Artefact / document studio** | quiet — the canvas is the subject | sheet white on a tinted shell | 28 / 22 / 16 / 12 | greyscale plus one brand accent |
| **Dark-first ops console** | blooms *lighter* than the page | opaque rung for any container holding glass | 10 / 6 / pill | brand-as-text steps up; brand-as-fill holds |
| **Ported screens from another build** | inherit the host | — | **normalised, see below** | inherit |

**Ported code gets one card, imposed from outside.** Screens from a separate build each bring their
own idea of a card — on the Enroll · Belong canvases there were **six paddings, four radii and three
shadows** between them, invisible one screen at a time and obvious the moment a dozen stack in one
column. **Do not edit them one by one.** One normalising block at the end of the ported stylesheet:
one radius, one surface, one shadow · **three padding tokens only** — a card you read into, a row
inside a card, a compact cell · a card holding rows takes **no padding of its own** and its rows
carry the rhythm · **media cropped to one aspect ratio** (`height:auto` on an illustration is how two
cards in a row end up different heights) · **restate the selected and status rings after the
normaliser** or the reset eats them · check the containers too — the agent's note, the stepper and
the action bar must sit in the **same column** as the cards.

## The defect register — re-derived on the system itself

**⛔ A figure asserted about the system from a measurement taken on a PORT of it is not evidence.**
One "defect" was recorded that way — a claim that §14's chart ramp fails its own 2.60 figure — and
had to be **withdrawn**: measured across all twenty triples, the best is exactly 2.60, and the dark
pair is exactly 4.24, both as the document claims. A luminance-preserving port makes this trap
worse, not better, because the port's numbers genuinely are the source's, so a wrong number looks
doubly confirmed. **Check every "the file says" against the file.**

The standing lessons, all derived from defects on the record:

* **White on the brand fill** — check every gradient stop, not just the mid one.
* **`.ai` vs `.msg.ai`** — an unscoped insight-card selector captures every agent chat turn.
* **Nested glass in dark** — a container holding glass takes the opaque rung.
* **A theme with no switch** follows the reader's OS and half your work is invisible.
* **Bare rgb triples** survive any regex port.
* **A wrong number in a document is not a wrong colour.** Correct the number.

## Hand it over with these three answers

> **What is the WOW factor here? Name it in one sentence.**
> **What would Amogh or the client push back on first?**
> **What is the weakest part, and do you know it?**

**Answering the third honestly is not a confession, it is the deliverable.** A hand-over that names
its own weakest part gets fixed; one that hides it gets found.