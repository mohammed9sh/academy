# Contributing

This is currently a solo project (Mohammed), but it is structured so a collaborator — or a future session picking it back up — can work on it safely without breaking what's already there.

## Ground rules

1. **Read `docs/PROJECT_CONTEXT.md` first**, before touching any code. It states what must not change.
2. **Understand a file fully before editing it.** No blind overwrites — `renderer.js` and `widgets.js` in particular are large and shared by every section.
3. **Keep changes small and verifiable.** Make one change, run the project locally, confirm nothing broke, then move to the next. Don't bundle unrelated changes into one pass.
4. **Don't hardcode data into logic.** Curriculum content belongs in `content/<section>/index.json`. If a change means editing numbers or text inside `app/*.js`, stop and ask whether it should be data instead.
5. **Don't duplicate a helper.** If similar logic already exists (check `app/state.js` and `app/widgets.js` first), reuse or extend it instead of writing a second version.
6. **Comment new code fully** — what a function does and what its parameters mean, not just what the code already makes obvious.
7. **Log every meaningful change** in `docs/CHANGELOG.md`, with a short note of what and why.
8. **When a change affects architecture, the unlock/XP model, or curriculum structure and the right call isn't obvious — ask.** Don't guess on anything structural.

## Adding a new unit or section

Content changes never require touching JavaScript. Edit the relevant `content/<section>/index.json` file — see `docs/ARCHITECTURE.md` for the data shape. Only genuinely new *mechanics* (a new widget type, a new unlock rule) need code changes.

## Branching & commits

`main` is the branch that gets deployed. Non-trivial changes should go on a feature branch and get merged only after they've been verified locally. Commit messages should explain what changed and why — not just restate the filename.
