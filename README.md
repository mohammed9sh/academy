# Mohammed's Engineering Academy

An interactive, Brilliant-style learning platform covering the applied AI, computer vision, and robotics curriculum behind Mohammed's PhD and R&D track. Built as a portfolio project — it doubles as a demonstration of shipping a real, modular web app, not just a study tracker.

**Status:** 8/8 sections complete · 34 chapters · 94 units · 6 hands-on projects · 34 assignments · 25,760 XP
**Live demo:** not yet deployed — see [Deployment](#deployment)

---

## Sections

| Section | Chapters | Units | Projects | Assignments | XP |
|---|---|---|---|---|---|
| ∑ Mathematics Foundations *(pre-section)* | 1 | 4 | — | 1 | 360 |
| 👁️ Computer Vision | 6 | 15 | — | 6 | 4,250 |
| 🧠 AI & ML Foundations | 7 | 21 | — | 7 | 4,260 |
| 🛡️ Trustworthy Deep Learning | 4 | 10 | — | 4 | 2,770 |
| 🤖 Robotics & Physical Systems | 5 | 15 | — | 5 | 3,920 |
| 🔧 Hands-On Hardware | 6 | 16 | 6 | 6 | 6,170 |
| 🦾 Advanced Robotics | 3 | 8 | — | 3 | 2,620 |
| ⚙️ Engineering Design & Simulation | 2 | 5 | — | 2 | 1,410 |
| **Total** | **34** | **94** | **6** | **34** | **25,760** |

Every unit follows a Watch → Concept → Challenge → Project flow (Math is Watch → Concept → Challenge only, and is always unlocked as an optional pre-section). Progress is tracked locally, with optional cross-device sync — see [Architecture](#architecture).

## Architecture

No framework, no build step — vanilla JS ES6 modules loaded directly by the browser.

```
academy/
├── index.html          Entry point — shell only, no logic
├── style.css            All styling, organized by component
├── resources.html       Standalone Resources & Roadmap page
├── LICENSE
├── CONTRIBUTING.md
├── app/
│   ├── main.js           Bootstrap — wires everything together
│   ├── router.js         URL hash-based navigation
│   ├── state.js          Progress tracking, unlock logic, localStorage + Firebase sync
│   ├── firebase.js       Optional cross-device sync (anonymous auth)
│   ├── renderer.js       Pure rendering functions → HTML strings
│   └── widgets.js        6 interactive canvas widgets (Kalman filter, RRT, etc.)
├── content/
│   ├── resources.json    Full resource catalog
│   └── <section>/index.json   One JSON file per section — pure content, no code
├── assets/                Images, fonts, and other static assets
└── docs/
    ├── PROJECT_CONTEXT.md  Read first, every session
    ├── ARCHITECTURE.md     Separation-of-concerns rules and known exceptions
    └── CHANGELOG.md        Full build history
```

**Adding content never touches JavaScript** — edit the relevant `content/<section>/index.json` file. The full architecture rules (what owns what, and why) live in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Structure | HTML5 | No framework needed for a content-driven app |
| Styling | CSS custom properties | Easy to read and maintain without a preprocessor |
| Logic | Vanilla JS ES6 modules | No build step, readable source, no dependency drift |
| Content | JSON files | Pure data — add content without touching code |
| Progress | localStorage | Works fully offline, no backend required |
| Sync (optional) | Firebase Firestore | Cross-device progress, free tier |
| Hosting | GitHub Pages | Free, automatic, portfolio-visible |

## Running locally

```bash
git clone <this-repo-url>
cd academy
python3 -m http.server 5000
# then open http://localhost:5000
```

> Must be served over HTTP — opening `index.html` directly as `file://` breaks the ES6 module imports.

## Deployment

Target: **GitHub Pages** (free). Not yet live — tracked as an open item in [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md). Once deployed, this section will carry the live link.

## Documentation

- [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) — what this project is and what must not change; read this first
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — separation-of-concerns rules, including a flagged known exception
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — full build history, newest first

## Contributing

Currently a solo project, but structured for a collaborator (or a future session) to pick up safely — see [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

[MIT](LICENSE)
