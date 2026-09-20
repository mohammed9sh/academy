// ─── router.js ───────────────────────────────────────────────────────────────
// Manages navigation state.
// Uses URL hash so the back button works and links are shareable.
// Routes:
//   #/                         → home
//   #/section/:key             → section page
//   #/unit/:sectionKey/:id     → unit page (step 0)
// ─────────────────────────────────────────────────────────────────────────────

let _onNavigate = null;

// ── Current route ─────────────────────────────────────────────────────────────
export function getRoute() {
  const hash = window.location.hash || '#/';
  return parseHash(hash);
}

function parseHash(hash) {
  const path = hash.replace('#', '') || '/';
  const parts = path.split('/').filter(Boolean);

  if (parts.length === 0)                             return { view: 'home' };
  if (parts[0] === 'section' && parts[1])             return { view: 'section',  sectionKey: parts[1] };
  if (parts[0] === 'unit' && parts[1] && parts[2])   return { view: 'unit',     sectionKey: parts[1], unitId: parts[2] };

  return { view: 'home' };
}

// ── Navigation functions ──────────────────────────────────────────────────────
export function goHome() {
  window.location.hash = '#/';
}

export function goSection(sectionKey) {
  window.location.hash = `#/section/${sectionKey}`;
}

export function goUnit(sectionKey, unitId) {
  window.location.hash = `#/unit/${sectionKey}/${unitId}`;
}

export function goBack() {
  window.history.back();
}

// ── Listen for route changes ──────────────────────────────────────────────────
export function onRouteChange(fn) {
  _onNavigate = fn;
  window.addEventListener('hashchange', () => fn(getRoute()));
}
