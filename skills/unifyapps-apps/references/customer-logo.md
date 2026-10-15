# The customer's logo — get it, confirm it, use it

> **Standing rule, set by Maher 2026-09-25:** every app we build for a customer carries **that
> customer's real logo**. We always go and get it, we **show it to the user and ask them to confirm it
> is the right one** before it goes anywhere, and then it is used throughout the app. This is part
> of the Maher Methodology and of every config app, code app, Studio build and demo — he does not
> need to ask for it.

It sits under INVENT NOTHING: a logo is a fact about the customer. A wrong one (a parent group's
mark on a subsidiary's app, a pre-rebrand version, a competitor's with a similar name, a logo
someone "tidied up") is the same failure as an invented source system — it is on screen, it is
theirs, and they notice first.

## 1. Get it — at the start of the build, not at the end

Do this in Phase 0 alongside the design direction, because the palette is sampled from it.

In this order, stopping at the first that gives a clean file:

1. **An official file the user already has** (brand pack, RFP deck, email signature). Offer it in the
   confirmation question ("No, use this file instead", build question B2); if they give one, that is the source.
2. **The customer's own website.** The header logo — inline `<svg>` or the `<img>` in the site
   header — is the current, official mark. Also collect `<link rel="icon">` /
   `apple-touch-icon` for the favicon. Look for a separate version drawn for dark backgrounds
   (footer logos are often the reversed one).
3. **Their CRM record**, if they are in HubSpot: `hs_logo_url` on the company (skip any value on
   the retired `logo.clearbit.com`). See `code-apps.md` "Company logos from HubSpot".
4. **Official secondary sources** — their press/media kit page, or Wikimedia Commons for large
   public companies. Record which one; these can lag a rebrand.

**What to collect:**

| File | Why |
|---|---|
| `logo.svg` (preferred) or a PNG ≥ 512 px wide, transparent background | app shell, light surfaces |
| `logo-on-dark.svg` / `.png` — **only if the customer publishes one** | the dark hero band and dark page headers |
| `favicon.svg` / `.png` / `.ico` — their own, if they have one | browser tab |
| `SOURCE.md` | the URL each file came from, date retrieved, and who confirmed it and when |

**Never:**
- redraw, trace, re-typeset, recolour, crop into a new shape or AI-generate a logo — not even to
  "clean it up". If the only file is poor, say so and ask for a better one;
- use a logo from a different legal entity without asking (group vs subsidiary, regional arm,
  sister brand — a holding group vs one of its divisions is exactly this question);
- invent a reversed/white version. If there is no dark-ground version, the logo sits on a light
  plate (a white or neutral chip with padding) inside the dark band, or ask the user;
- hotlink the customer's site at runtime. Copy the file into the build; their site changes.

## 2. Confirm it with the user — before it is used anywhere

Show the actual image, not a description of it:

1. Send the file(s) with `SendUserFile` (`display: "render"`) — every variant you intend to use.
2. In the same message state, per file: **source URL**, format and pixel size, which entity it
   belongs to, and **where it will be used** (header, dark hero, favicon, documents).
3. Ask plainly: *"Is this the correct, current logo for <Customer>? OK to use it in the app?"*
4. **Wait for a clear yes.** Until then, build with the customer's name set in text in the shell,
   not with a guessed logo. If they say no, or name a different entity or version, go back to §1. If they choose
   "no logo, show the name as text", the app uses the confirmed customer name in text everywhere a logo would go,
   and `SOURCE.md` records that choice.

Write the confirmation into `SOURCE.md` ("confirmed by <user>, <date>, in session") and into
the project memory for that customer, so a later session does not ask again for the same file.

## 3. Use it — everywhere the app shows who it is for

**Code apps** (the Maher Methodology default):
- Commit the confirmed files to the repo under `app/public/brand/` with `SOURCE.md` beside them.
- App shell / nav header: the customer logo, sized to the header height, with
  `alt="<Customer> logo"`.
- First screen: the logo in the dark hero band (the `logo-on-dark` version or the light plate).
- Favicon and `<title>` in `index.html` point at the customer's favicon and name (that serves the
  builder preview only — see the next point for the published app).
- Anything the app generates that carries a brand — PDF/DOCX exports, printable reports, email
  templates — carries the customer logo. Chart exports: `setExportLogo(url)` in the chart kit's
  `export.ts` (MCIT build) draws it at the head of the PNG, the workbook image and the print.
- ✅ 2026-09-28 (API-SPEC §60.15): the PUBLISHED page's favicon is
  `e_interface.properties.metadata.logo.favicon`, written into the served `index.html` **at
  publish** (the repo's `<link rel="icon">` is replaced). Set `metadata.logo.{favicon, small,
  large}` to files on the app's own host (`https://<appId>-<tenant>.tensor-….unifyapps.com/brand/…`,
  i.e. `app/public/brand/`), then publish again. An emblem-only favicon may be the official file
  with only its `viewBox` narrowed — say so in `SOURCE.md`.

**Config apps** (`unifyapps-config-apps`):
- `cfg.createApp({ …, logo: {small, large, favicon} })` takes the logo block — the defaults are
  the UnifyApps assets. A customer file needs a URL the platform will load; whether an uploaded
  file (`/api/file/download/…` from a FileUpload) or an external HTTPS URL is accepted here is
  **not yet verified** — test, read back, look at the published app, record in `API-SPEC.md`.
- Independently of that, put the logo on the page itself with an `Image` block (`cfg.image(src)`)
  in the header stack / hero of the first page.

**Palette:** sample the brand colours from the confirmed logo and the customer's own CSS
(`ai-app-patterns.md` §19 "Type" — one customer's site gave navy `#002961`, blue `#004E8D`, cyan
`#008AD3`). The theme is derived from the confirmed brand, never from a guess.

**The UnifyApps mark** stays where the platform or the product needs it (the animated mark in
`assets/brand-mark/` for UnifyApps-branded surfaces). The customer's logo is the app's identity;
do not replace one with the other without asking.

**Demo films** (`demo-studio`): set `brand.logo` in `demo.config.json` to the same confirmed
dark-ground file — never a different one fetched later.

## 4. Checklist — before calling the app done

- [ ] Logo obtained from a named official source; `SOURCE.md` records the URL and date.
- [ ] **The user confirmed it in chat** (and the variants actually used) — recorded in `SOURCE.md`.
- [ ] Shown in the shell header and on the first screen; crisp at 1× and 2×, not stretched.
- [ ] Legible on the dark hero (dark-ground version or light plate — never a recoloured copy).
- [ ] Favicon and tab title are the customer's.
- [ ] Exports/documents that carry a brand carry this logo.
- [ ] `metadata.logo` result (customer file accepted or not) recorded in `API-SPEC.md`.
- [ ] Checked on the **builder preview**, not only the dev server (and on the published URL when the user asked for
      published testing).
