// ─── state.js ────────────────────────────────────────────────────────────────
// Single source of truth for all progress data.
// Persists to localStorage immediately.
// Syncs to Firebase when available (cross-device).
// ─────────────────────────────────────────────────────────────────────────────

import { firebaseSync } from './firebase.js';

const STORAGE_KEY = 'meng_academy_v1';

// Default state shape
const DEFAULT_STATE = {
  xp:       { cv: 0, ml: 0, tdl: 0, rob: 0, hw: 0 },
  done:     [],          // array of completed item IDs
  gh:       {},          // { itemId: 'https://github.com/...' }
  answered: {},          // { itemId: optionIndex }
  hints:    {},          // { itemId: true }
  openCh:   {},          // { chapterId: true }
  lastSeen: null,        // ISO timestamp
};

let _state = { ...DEFAULT_STATE };
let _listeners = [];

// ── Load from localStorage ────────────────────────────────────────────────────
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      _state = deepMerge(DEFAULT_STATE, saved);
    }
  } catch (e) {
    console.warn('State load failed, using defaults:', e);
  }
  return _state;
}

// ── Save to localStorage + trigger Firebase sync ──────────────────────────────
function persistState() {
  try {
    _state.lastSeen = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
    firebaseSync(_state);   // non-blocking, best-effort
  } catch (e) {
    console.warn('State save failed:', e);
  }
  _listeners.forEach(fn => fn(_state));
}

// ── Public API ────────────────────────────────────────────────────────────────
export function getState() { return _state; }

export function subscribe(fn) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

export function markDone(itemId, sectionKey, xp) {
  if (_state.done.includes(itemId)) return;
  _state.done.push(itemId);
  _state.xp[sectionKey] = (_state.xp[sectionKey] || 0) + xp;
  persistState();
}

export function saveGithub(itemId, url) {
  _state.gh[itemId] = url;
  persistState();
}

export function saveAnswer(itemId, idx) {
  if (_state.answered[itemId] !== undefined) return;
  _state.answered[itemId] = idx;
  persistState();
}

export function showHint(itemId) {
  _state.hints[itemId] = true;
  persistState();
}

export function toggleChapter(chapterId) {
  _state.openCh[chapterId] = !_state.openCh[chapterId];
  persistState();
}

export function mergeRemoteState(remote) {
  // Called by firebase.js when remote data arrives
  // Remote wins for done/xp (takes the union/max)
  // Local wins for UI state (openCh)
  const merged = {
    ..._state,
    done:     [...new Set([..._state.done, ...(remote.done || [])])],
    gh:       { ...(remote.gh || {}), ..._state.gh },
    answered: { ...(remote.answered || {}), ..._state.answered },
    hints:    { ...(remote.hints || {}), ..._state.hints },
    xp:       mergeXP(_state.xp, remote.xp || {}),
  };
  _state = merged;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
  _listeners.forEach(fn => fn(_state));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function mergeXP(local, remote) {
  const keys = new Set([...Object.keys(local), ...Object.keys(remote)]);
  const result = {};
  for (const k of keys) {
    result[k] = Math.max(local[k] || 0, remote[k] || 0);
  }
  return result;
}

function deepMerge(defaults, saved) {
  const result = { ...defaults };
  for (const key of Object.keys(saved)) {
    if (key in defaults && typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
      result[key] = { ...defaults[key], ...saved[key] };
    } else {
      result[key] = saved[key];
    }
  }
  return result;
}

export function totalXP(state) {
  return Object.values(state.xp).reduce((a, b) => a + b, 0);
}

export function isDone(state, id)     { return state.done.includes(id); }
export function getGH(state, id)      { return state.gh[id] || ''; }
export function getAnswer(state, id)  { return state.answered[id]; }
export function hasHint(state, id)    { return !!state.hints[id]; }
export function isChOpen(state, id)   { return !!state.openCh[id]; }
