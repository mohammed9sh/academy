# Architecture & Organization Rules

The working discipline for this codebase — separation of concerns, no duplicated logic, no hardcoded data, small verified changes — generalized from other serious projects to fit a content-driven learning platform.

## 1. Separation of concerns

| File / folder | Owns | Must not do |
|---|---|---|
| `content/<section>/index.json` | Curriculum content: chapters, units, watch/concept/challenge/project text, XP values | Contain any JS logic |
| `app/state.js` | Progress tracking, unlock logic, localStorage + Firebase sync | Render HTML |
| `app/router.js` | URL hash-based navigation only | Know about content structure |
| `app/renderer.js` | Pure functions turning state + content into HTML strings | Fetch data, mutate state, have side effects |
| `app/widgets.js` | The 6 interactive canvas widgets (Kalman filter, RRT, etc.), isolated per widget | Depend on renderer internals |
| `app/firebase.js` | Optional cross-device sync | Be required for the app to work — everything must degrade gracefully without it |
| `app/main.js` | Bootstrap only: wires the modules above together | Contain business logic itself |
| `style.css` | All styling, organized by component | — |

None of these get embedded inside another. A rendering function never reads `localStorage` directly; a content file never contains JS.

## 2. Reuse, don't duplicate

A helper used in more than one place is written once and called from everywhere, never copy-pasted. Before adding a new helper, check `app/state.js` and `app/widgets.js` for something equivalent first.

## 3. Data isn't hardcoded — known exception

Curriculum content, XP values, and unlock rules should live in `content/*.json` or as named constants — never buried inline inside `renderer.js` or `widgets.js`.

**Flagged, not yet fixed:** the math-section unlock check (`sec.key === 'math'`) is currently duplicated inline in three places in `renderer.js` — `renderChapterBlock`, `renderUnitRow`, and `renderAssignmentRow`. It works correctly today, but it's exactly the kind of repeated inline rule this section warns against, and it should eventually move to a single config-driven check (e.g. an `alwaysUnlocked` flag read from `content/math/index.json` or a shared `isAlwaysUnlocked(sectionKey)` helper in `state.js`). Left as-is for now since it touches unlock logic project-wide — see `docs/PROJECT_CONTEXT.md` open decisions.

## 4. Small, verifiable steps

Every change is run locally (`python3 -m http.server 5000`) and confirmed working before moving to the next. No single change touches content, rendering, and state at once.

## 5. Understand, then change

Read a file in full before editing it. No blind overwrites of `renderer.js` or `widgets.js` — both are large and shared by every section.

## 6. Ask when unsure

Any decision that changes the unlock model, the XP system, or the content schema gets discussed before being built. These are structural, not cosmetic, and a wrong guess here is expensive to unwind.

## 7. Documentation discipline

- `docs/PROJECT_CONTEXT.md` — read first, every session.
- `docs/CHANGELOG.md` — every meaningful change logged, newest first.
- This file — kept in sync with reality, including flagged known exceptions rather than silently living with drift.
