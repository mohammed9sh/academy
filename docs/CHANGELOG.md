# Changelog

All notable changes to this project, newest first.

## 2026-09-19 — Pre-deploy polish: favicon, OG/social preview, meta tags

- Generated a proper site icon (`assets/icon-512.png`, `assets/favicon-32.png`, `assets/apple-touch-icon.png`) and a 1200x630 link-preview image (`assets/og-image.png`) — `assets/` was previously empty, so shares/bookmarks had no image at all
- Added `<meta name="description">`, Open Graph tags, and Twitter card tags to `index.html` so the link looks right when shared (LinkedIn, email, Slack)
- Confirmed no secrets or leftover TODO/placeholder text anywhere in `app/`, `content/`, or the HTML/CSS before going public
- Open item carried into `docs/PROJECT_CONTEXT.md`: `og:image`/`twitter:image` need to become absolute URLs once the GitHub Pages URL exists, and all 8 sections need a manual click-through after first deploy to confirm none show the leftover "Coming soon" badge

## 2026-09-19 — Project structure & documentation pass

- Added `docs/PROJECT_CONTEXT.md`, `docs/ARCHITECTURE.md`, `docs/CHANGELOG.md` (this file)
- Rewrote `README.md` to accurately reflect the finished 8-section state (previously listed only 5 sections and stale dev instructions)
- Added `CONTRIBUTING.md`, `LICENSE` (MIT), `.gitignore`
- Removed stray extraction artifacts: a malformed `{app,content...}` folder created by a broken brace-expansion command, and duplicate `SESSION_LOG.md` copies (`academy/`, `home/claude/academy/`) left behind by unzipping `mohammed-academy.zip`
- Folded the old root-level `SESSION_LOG.md` content into the entry below and retired that file — this changelog is now the single build history

## 2026-08-15 — Full 8-section build complete

### Architecture rebuild (monolith → proper web app)

Rebuilt from a single 319KB HTML file (all content, logic, CSS, and widgets mixed together) into:

```
academy/
├── index.html          13-line entry point only
├── style.css            All styling, organized by component
├── resources.html       Standalone Resources & Roadmap page
├── README.md
├── app/
│   ├── main.js           Bootstrap, loads content, wires routing
│   ├── router.js         URL hash navigation (#/section/key)
│   ├── state.js          Progress tracking + Firebase sync API
│   ├── firebase.js       Optional cross-device sync (anonymous auth)
│   ├── renderer.js       Pure rendering functions → HTML strings
│   └── widgets.js        All 6 interactive canvas widgets (isolated)
└── content/
    ├── resources.json
    ├── math/index.json
    ├── cv/index.json
    ├── ml/index.json
    ├── tdl/index.json
    ├── robotics/index.json
    ├── hardware/index.json
    ├── advanced_robotics/index.json
    └── simulation/index.json
```

Stack: vanilla JS ES6 modules, JSON content files, URL hash routing, localStorage + optional Firebase Firestore, GitHub Pages. Run locally: `cd academy && python3 -m http.server 5000`.

### Content migration

All content from the original monolithic HTML extracted with a custom Python parser handling: `u()`/`a()` call formats, backtick template literals, nested objects (watch/concept/challenge/project), two different assignment formats (call-style for cv/ml/tdl, object-style for rob/hw), and hw6 projects with `SIM:`/`HARDWARE:` prefixed deliverables converted to proper sub-objects.

**Content totals after migration + new sections:**

| Section | Ch | Units | Projects | Assigns | XP |
|---|---|---|---|---|---|
| ∑ Mathematics Foundations | 1 | 4 | — | 1 | 360 |
| 👁️ Computer Vision | 6 | 15 | — | 6 | 4,250 |
| 🧠 AI & ML Foundations | 7 | 21 | — | 7 | 4,260 |
| 🛡️ Trustworthy Deep Learning | 4 | 10 | — | 4 | 2,770 |
| 🤖 Robotics & Physical Systems | 5 | 15 | — | 5 | 3,920 |
| 🔧 Hands-On Hardware | 6 | 16 | 6 | 6 | 6,170 |
| 🦾 Advanced Robotics | 3 | 8 | — | 3 | 2,620 |
| ⚙️ Engineering Design & Simulation | 2 | 5 | — | 2 | 1,410 |
| **TOTAL** | **34** | **94** | **6** | **34** | **25,760** |

### New sections built from scratch

- **Mathematics Foundations** (`math/`) — lighter Watch → Concept → Challenge format, no project step, always unlocked as an optional pre-section. Units: Linear Algebra (MIT 18.06 Strang), Probability (Harvard Stat 110), Multivariate Calculus (MIT 18.02 + 3B1B), Differential Equations (MIT 18.03SC).
- **Advanced Robotics** (`advanced_robotics/`) — Ch1 Robot Manipulation & Grasping (ICP, antipodal grasps, behavior cloning/DAgger); Ch2 Underactuated Systems (Lyapunov stability, iLQR, PPO); Ch3 Modern Kinematics (SO(3)/SE(3), screw theory, space Jacobian) — all from MIT Tedrake / Lynch & Park.
- **Engineering Design & Simulation** (`simulation/`) — Ch1 System Modeling (state-space, controllability/observability, HIL testing); Ch2 Control Design (root locus, Bode, LQR/LQG/MPC).

### Resource integration (`resources.json` + `resources.html`)

29 resources cataloged, all free or free-to-audit, each with what it is, how it's used, access level, and priority. Key picks: EECS 498 (Michigan) replacing CS231N as primary CV resource; Murphy's *Probabilistic Machine Learning* as primary TDL/ML reference; MIT 6.832 Robotic Manipulation, Modern Robotics, and MIT Underactuated Robotics for the robotics track; Harvard Stat 110 for probability; Corke RVC3 as code companion. 24 broken Watch URLs fixed with a copy-pasteable-title + Google-search fallback for any future breakage. 8 "Go Deeper" secondary resources added to specific units.

### UI/UX fixes

- Math section unlock fixed in three places in `renderer.js` (`renderChapterBlock`, `renderUnitRow`, `renderAssignmentRow`) — see `docs/ARCHITECTURE.md` §3 for the follow-up needed here.
- Broken Watch link fallback in the UI.
- Cache-busting via `no-cache` meta headers and a `?v=2` query string on `style.css`; dev port moved from 8000 to 5000.
- "Go Deeper" secondary watch card renders below the primary Watch link when a unit has a `secondary_watch` field.

### Resources & Roadmap page (`resources.html`)

Standalone page loading `content/resources.json` dynamically: a 5-number stats row, an 8-phase roadmap timeline, and a resource table filterable by priority and by section.

### What was not yet done as of this entry

- Firebase configuration (`FIREBASE_CONFIG = null` in `app/main.js`)
- GitHub Pages deployment
