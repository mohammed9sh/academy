# Mohammed's Engineering Academy — Project Context

Read this at the start of every new session, before touching any code.

## What this project is

A browser-based, Brilliant-style interactive learning platform covering Mohammed's applied AI / computer vision / robotics curriculum — built as a public portfolio project for recruiter visibility, not a product for external end users. It tracks his own study progress through 8 sections while doubling as a demonstration of shipping a real, modular web app.

## Architecture rules (do not change without discussion)

- No framework, no build step — vanilla JS ES6 modules, loaded directly by the browser.
- Content is data, not code: all curriculum content lives in `content/<section>/index.json`. Adding a unit never requires touching `app/*.js`.
- `index.html` is a shell only — no logic in it.
- Each `app/*.js` file owns exactly one concern (routing, state, rendering, widgets, sync) and doesn't reach into another file's internals.
- No duplicated helpers — shared logic lives in one place and is called from everywhere it's needed.
- Every function is commented: what it does, what its parameters mean.
- Changes are small and verified: run locally (`python3 -m http.server 5000`) and confirm the app still works before moving to the next change.
- Full rules and the current file-by-file breakdown: `docs/ARCHITECTURE.md`.

## Current state

8/8 sections complete — 34 chapters, 94 units, 6 hands-on projects, 34 assignments, 25,760 XP total. All content migrated off the original monolithic HTML file into the structure below. Full build history: `docs/CHANGELOG.md`.

## Open decisions / unresolved points

- **Firebase cross-device sync** — `FIREBASE_CONFIG` is `null` in `app/main.js`. Needs a free Firebase project set up before this works.
- **GitHub Pages deployment** — not yet live. The README's "Live Demo" link is a placeholder until this happens.
- **Math-section unlock logic** is currently duplicated inline in three places in `renderer.js` (flagged, not yet fixed — see `docs/ARCHITECTURE.md` §3).
- **`og:image`/`twitter:image` in `index.html`** use a relative path (`assets/og-image.png`). Most crawlers (LinkedIn, Slack, X) require an *absolute* URL to reliably show the preview image — switch these to the full `https://<username>.github.io/<repo>/assets/og-image.png` once the Pages URL is known, and re-test with a link-preview debugger before sharing the link.
- **First deploy smoke test**: click through all 8 sections once live to confirm none of them shows the leftover "Coming soon" badge from `renderer.js`/`main.js` (dead code from when sections were still WIP — should never fire now, but hasn't been verified against the live build).
