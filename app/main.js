// ─── main.js ─────────────────────────────────────────────────────────────────
// Application bootstrap.
// Loads content → initialises state → sets up routing → renders.
// This is the only file that imports from all others.
// ─────────────────────────────────────────────────────────────────────────────

import { loadState, getState, subscribe, markDone, saveGithub,
         saveAnswer, showHint as storeHint, toggleChapter } from './state.js';
import { getRoute, goHome, goSection, goUnit, onRouteChange } from './router.js';
import { renderHome, renderSection, renderUnit, findItem, getAllItems } from './renderer.js';
import { mountWidget } from './widgets.js';
import { initFirebase } from './firebase.js';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — Firebase (optional, add your config here to enable cross-device sync)
// Get a free Firebase project at https://console.firebase.google.com
// ─────────────────────────────────────────────────────────────────────────────
const FIREBASE_CONFIG = null;
// Example (replace with your own):
// const FIREBASE_CONFIG = {
//   apiKey: "AIza...",
//   authDomain: "your-project.firebaseapp.com",
//   projectId: "your-project",
// };

// ─────────────────────────────────────────────────────────────────────────────
// SECTIONS MANIFEST
// Add new sections here as you build their content files.
// status: 'ready' = fully built | 'coming' = show outline but not navigable
// ─────────────────────────────────────────────────────────────────────────────
const SECTION_MANIFEST = [
  { key: 'math',             file: './content/math/index.json',             status: 'ready' },
  { key: 'cv',               file: './content/cv/index.json',               status: 'ready' },
  { key: 'ml',               file: './content/ml/index.json',               status: 'ready' },
  { key: 'tdl',              file: './content/tdl/index.json',              status: 'ready' },
  { key: 'robotics',         file: './content/robotics/index.json',         status: 'ready' },
  { key: 'hardware',         file: './content/hardware/index.json',         status: 'ready' },
  { key: 'advanced_robotics',file: './content/advanced_robotics/index.json',status: 'ready' },
  { key: 'simulation',       file: './content/simulation/index.json',       status: 'ready' },
];

// ─── App state ────────────────────────────────────────────────────────────────
let _sections   = [];   // loaded section data
let _currentStep = 0;   // step within a unit (0=watch, 1=concept, 2=challenge, 3=project)
let _currentItem = null; // { item, sec, ch, type }

// ─── Bootstrap ───────────────────────────────────────────────────────────────
async function boot() {
  // 1. Load persisted progress
  loadState();

  // 2. Load all section content (in parallel)
  _sections = await loadSections();

  // 3. Optional: Firebase sync
  if (FIREBASE_CONFIG) {
    initFirebase(FIREBASE_CONFIG).catch(() => {});
  }

  // 4. Expose app API to window (used by onclick handlers in rendered HTML)
  window.__app = makeAppAPI();

  // 5. Subscribe to state changes → re-render
  subscribe(() => renderCurrentRoute());

  // 6. Set up routing
  onRouteChange(route => {
    _currentStep = 0;
    renderCurrentRoute(route);
  });

  // 7. Initial render
  renderCurrentRoute();
}

// ─── Load content ────────────────────────────────────────────────────────────
async function loadSections() {
  const results = await Promise.allSettled(
    SECTION_MANIFEST.map(async (m) => {
      try {
        const res  = await fetch(m.file);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { ...data, key: m.key, status: m.status };
      } catch (e) {
        // Section content not yet built — show as coming soon
        console.warn(`Content not found for ${m.key}:`, e.message);
        return getPlaceholder(m.key, m.status);
      }
    })
  );

  return results.map(r => r.value || r.reason);
}

function getPlaceholder(key, status) {
  const META = {
    math:             { icon: '∑',  title: 'Mathematics Foundations',       desc: 'Linear algebra, probability, calculus, and differential equations — the toolkit behind everything in the academy.', chapters: getPlaceholderChapters(key) },
    cv:               { icon: '👁️', title: 'Computer Vision',               desc: 'From pixels to spatial understanding — detection, depth, segmentation, and visual control for intelligent physical systems.', chapters: getPlaceholderChapters(key) },
    ml:               { icon: '🧠', title: 'AI & ML Foundations',           desc: 'The mathematical engine under everything else — concept-first so the math always serves a purpose you can see.', chapters: getPlaceholderChapters(key) },
    tdl:              { icon: '🛡️', title: 'Trustworthy Deep Learning',     desc: 'The mathematics of making models you can trust — uncertainty, calibration, robustness, and domain shift.', chapters: getPlaceholderChapters(key) },
    robotics:         { icon: '🤖', title: 'Robotics & Physical Systems',   desc: 'ROS, kinematics, state estimation, motion planning, and SLAM — enriched with NU ME495 interactive content.', chapters: getPlaceholderChapters(key) },
    hardware:         { icon: '🔧', title: 'Hands-On Hardware & Projects',  desc: 'From simulation to real hardware — Raspberry Pi, Arduino, sensors, and actuators.', chapters: getPlaceholderChapters(key) },
    advanced_robotics:{ icon: '🦾', title: 'Advanced Robotics',             desc: 'Manipulation, grasping, underactuated systems, and screw theory. Picks up where Robotics Section ends.', chapters: getPlaceholderChapters(key) },
    simulation:       { icon: '⚙️', title: 'Engineering Design & Simulation',desc: 'System modeling, frequency domain control design, LQR/LQG, and MPC for physical AI systems.', chapters: getPlaceholderChapters(key) },
  };
  return { key, status, ...META[key] };
}

function getPlaceholderChapters(key) {
  const CHAPTERS = {
    math:             ['Linear Algebra','Probability & Statistics','Multivariate Calculus','Differential Equations'],
    cv:               ['Classical Vision Foundations','Deep Learning for Vision','Detection & Segmentation','3D Vision & Depth','Perception to Action','Trustworthy Perception'],
    ml:               ['What is Learning?','Optimization','Probability & Statistical Learning','Generalization & Bias-Variance','Neural Networks from Scratch','Deep Learning in Practice','Linear Algebra for ML'],
    tdl:              ['Foundations of Uncertainty','Bayesian Deep Learning','Calibration & Reliability','Robustness & Distribution Shift'],
    robotics:         ['Robot Architecture & ROS','Kinematics & Dynamics','Probability Gaussians & State Estimation','Motion Planning & Control','SLAM & Autonomous Navigation'],
    hardware:         ['Simulation First','Raspberry Pi as a Vision System','Arduino + Sensors','Pi + Arduino Together','Capstone Hardware Projects','Hands-On Projects'],
    advanced_robotics:['Robot Manipulation & Grasping','Underactuated Systems & Dynamic Control','Modern Kinematics with Screw Theory'],
    simulation:       ['System Modeling & Simulation','Control System Design'],
  };
  return (CHAPTERS[key] || []).map((title, i) => ({
    id:    `${key}-ch${i+1}`,
    title,
    sub:   '',
    units: [],
  }));
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderCurrentRoute(route) {
  route = route || getRoute();
  const state = getState();
  const root  = document.getElementById('app');

  root.innerHTML = '<div class="app-container">' + getViewHTML(route, state) + '</div>';
  root.scrollTop = 0;
  window.scrollTo(0, 0);

  // Mount interactive widgets after DOM is painted
  if (route.view === 'unit' && _currentStep === 1 && _currentItem) {
    requestAnimationFrame(() => {
      mountWidget(_currentItem.item.id, 'widget-mount');
    });
  }
}

function getViewHTML(route, state) {
  if (route.view === 'home') {
    return renderHome(_sections, state);
  }

  if (route.view === 'section') {
    const sec = _sections.find(s => s.key === route.sectionKey);
    if (!sec) return '<div class="error-msg">Section not found.</div>';
    return renderSection(sec, state);
  }

  if (route.view === 'unit') {
    const sec = _sections.find(s => s.key === route.sectionKey);
    if (!sec) return '<div class="error-msg">Section not found.</div>';

    const found = findItem(_sections, route.unitId);
    if (!found) return '<div class="error-msg">Unit not found.</div>';

    _currentItem = found;
    return renderUnit(found.item, found.type, route.sectionKey, found.ch, _currentStep, state);
  }

  return '<div class="error-msg">Page not found.</div>';
}

// ─── App API (called from onclick handlers in rendered HTML) ──────────────────
function makeAppAPI() {
  return {
    // Navigation
    goHome:        () => goHome(),
    goSection:     (key) => { _currentStep = 0; goSection(key); },
    goUnit:        (secKey, id) => { _currentStep = 0; goUnit(secKey, id); },
    toggleChapter: (id) => { toggleChapter(id); renderCurrentRoute(); },

    // Unit steps
    nextStep() {
      _currentStep = Math.min(3, _currentStep + 1);
      renderCurrentRoute();
      // Mount widget on concept step
      if (_currentStep === 1 && _currentItem) {
        requestAnimationFrame(() => mountWidget(_currentItem.item.id, 'widget-mount'));
      }
    },

    // Challenge
    submitAnswer(idx) {
      if (!_currentItem) return;
      saveAnswer(_currentItem.item.id, idx);
      renderCurrentRoute();
    },
    revealHint() {
      if (!_currentItem) return;
      storeHint(_currentItem.item.id);
      renderCurrentRoute();
    },
    revealAnswer() {
      if (!_currentItem) return;
      storeHint(_currentItem.item.id);
      saveAnswer(_currentItem.item.id, -1);
      renderCurrentRoute();
    },

    // Track watch clicks (no-op, future analytics hook)
    trackWatchClick(unitId) {
      // Could log to Firebase analytics in future
    },

    // Project / Assignment completion
    saveGH(url) {
      if (!_currentItem) return;
      saveGithub(_currentItem.item.id, url);
    },
    completeUnit() {
      if (!_currentItem) return;
      const { item, sec } = _currentItem;
      const ghInput = document.getElementById('gh-input');
      if (ghInput) saveGithub(item.id, ghInput.value);
      markDone(item.id, sec.key, item.xp);
      _currentStep = 0;
      renderCurrentRoute();
    },
  };
}

// ─── Start ────────────────────────────────────────────────────────────────────
boot().catch(err => {
  console.error('Boot failed:', err);
  document.getElementById('app').innerHTML = `
    <div class="app-container">
      <div class="error-msg">
        Failed to start the academy: ${err.message}<br>
        Make sure you are serving the files from a local server (not opening index.html directly as a file://).
      </div>
    </div>
  `;
});
