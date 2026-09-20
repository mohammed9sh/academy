// ─── firebase.js ─────────────────────────────────────────────────────────────
// Handles Firebase Firestore sync for cross-device progress.
// This file is the ONLY place Firebase is referenced.
// To disable cloud sync: just don't call init().
// To enable: call init() with your Firebase config from main.js.
// ─────────────────────────────────────────────────────────────────────────────

import { mergeRemoteState } from './state.js';

// Firebase SDK (loaded from CDN in index.html when configured)
let _db        = null;
let _userId    = null;
let _syncTimer = null;
let _configured = false;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Call this from main.js with your Firebase config.
 * If not called, the app works fine with localStorage only.
 *
 * config example:
 * {
 *   apiKey: "...",
 *   authDomain: "...",
 *   projectId: "...",
 * }
 */
export async function initFirebase(config) {
  try {
    // Dynamically import Firebase (avoids breaking the app if not configured)
    const { initializeApp }    = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
    const { getFirestore, doc, setDoc, onSnapshot, getDoc }
      = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
    const { getAuth, signInAnonymously, onAuthStateChanged }
      = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');

    const app  = initializeApp(config);
    _db        = getFirestore(app);
    const auth = getAuth(app);

    // Anonymous auth — no sign-in required from user
    await signInAnonymously(auth);

    onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      _userId     = user.uid;
      _configured = true;

      // Load remote state and merge with local
      const ref    = doc(_db, 'progress', _userId);
      const snap   = await getDoc(ref);
      if (snap.exists()) mergeRemoteState(snap.data());

      // Listen for real-time updates (e.g. from another device)
      onSnapshot(ref, (snap) => {
        if (snap.exists()) mergeRemoteState(snap.data());
      });

      console.log('Firebase sync active. User ID:', _userId);
    });

  } catch (e) {
    console.warn('Firebase init failed — running with localStorage only:', e.message);
    _configured = false;
  }
}

/**
 * Called by state.js on every state change.
 * Debounced — only writes to Firestore every 3 seconds to avoid write limits.
 */
export function firebaseSync(state) {
  if (!_configured || !_db || !_userId) return;

  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(async () => {
    try {
      const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
      const ref = doc(_db, 'progress', _userId);

      // Only sync progress data — not UI state (openCh stays local)
      await setDoc(ref, {
        xp:       state.xp,
        done:     state.done,
        gh:       state.gh,
        answered: state.answered,
        hints:    state.hints,
        lastSeen: state.lastSeen,
      }, { merge: true });

    } catch (e) {
      console.warn('Firebase sync failed:', e.message);
    }
  }, 3000);
}
