// ─── renderer.js ─────────────────────────────────────────────────────────────
// Pure rendering functions — they receive data and return HTML strings.
// No state mutation here. No fetching here. Just HTML generation.
// ─────────────────────────────────────────────────────────────────────────────

import { isDone, getGH, getAnswer, hasHint, isChOpen, totalXP } from './state.js';

// ── HOME PAGE ─────────────────────────────────────────────────────────────────
export function renderHome(sections, state) {
  const xp    = totalXP(state);
  const maxXP = computeMaxXP(sections);
  const pct   = maxXP > 0 ? Math.min(100, Math.round(xp / maxXP * 100)) : 0;

  return `
    <div class="home-title">Mohammed's <span>Engineering Academy</span></div>
    <div class="home-sub">Applied AI · Computer Vision · Robotics · Trustworthy ML/DL · Hands-On Hardware</div>

    <div class="xp-card">
      <div class="xp-row">
        <strong>${xp.toLocaleString()} XP</strong>
        <span>${xp} / ${maxXP} · ${pct}% complete</span>
      </div>
      <div class="xp-bar-bg">
        <div class="xp-bar-fill" style="width:${pct}%"></div>
      </div>
    </div>

    <div class="section-label">Sections</div>

    ${sections.map(sec => renderSectionCard(sec, state)).join('')}

    <div style="margin-top:1.5rem;padding:14px 16px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);display:flex;align-items:center;gap:12px;cursor:pointer" onclick="window.open('resources.html','_blank')">
      <div style="width:38px;height:38px;border-radius:10px;background:rgba(108,143,239,.1);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">🗺️</div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:600;margin-bottom:2px">Resources & Roadmap</div>
        <div style="font-size:12px;color:var(--text2)">All selected resources mapped to the academy — what to watch, when, and why</div>
      </div>
      <div style="font-size:13px;color:var(--accent)">↗</div>
    </div>
  `;
}

function renderSectionCard(sec, state) {
  const items   = getAllItems(sec);
  const done    = items.filter(i => isDone(state, i.id)).length;
  const total   = items.length;
  const pct     = total > 0 ? Math.round(done / total * 100) : 0;
  const secXP   = state.xp[sec.key] || 0;

  const isReady = sec.status === 'ready';

  return `
    <div class="section-card${isReady ? '' : ' coming'}"
         ${isReady ? `onclick="window.__app.goSection('${sec.key}')"` : ''}>
      <div class="sc-head">
        <div class="sc-icon ${sec.key}">${sec.icon}</div>
        <div class="sc-title">${sec.title}</div>
        ${!isReady ? `<span class="sc-badge">Coming soon</span>` : ''}
      </div>
      <div class="sc-desc">${sec.desc}</div>
      ${isReady ? `
        <div class="sc-progress">
          <div class="sc-progress-bg">
            <div class="sc-progress-fill ${sec.key}" style="width:${pct}%"></div>
          </div>
          <span class="sc-progress-label">${done}/${total} · ${secXP} XP</span>
        </div>
      ` : renderChapterOutline(sec)}
    </div>
  `;
}

function renderChapterOutline(sec) {
  if (!sec.chapters || sec.chapters.length === 0) return '';
  return `
    <div class="ch-outline">
      <div class="ch-outline-label">Chapters</div>
      ${sec.chapters.map((ch, i) => `
        <div class="ch-outline-item">
          <div class="ch-outline-num">${i + 1}</div>
          <span>${ch.title} <span style="color:var(--text3)">· ${ch.sub || ''}</span></span>
        </div>
      `).join('')}
    </div>
  `;
}

// ── SECTION PAGE ──────────────────────────────────────────────────────────────
export function renderSection(sec, state) {
  const secXP  = state.xp[sec.key] || 0;
  const items  = getAllItems(sec);
  const done   = items.filter(i => isDone(state, i.id)).length;

  return `
    <div class="nav">
      <button class="nav-back" onclick="window.__app.goHome()">← Home</button>
      <span class="nav-title">${sec.title}</span>
      <span class="nav-xp" style="color:var(--${sec.key})">${secXP} XP</span>
    </div>

    ${sec.chapters.map((ch, ci) => renderChapterBlock(ch, ci, sec, state)).join('')}
  `;
}

function renderChapterBlock(ch, ci, sec, state) {
  // Math section chapters always open by default
  const open     = sec.key === 'math' ? true : isChOpen(state, ch.id);
  const chItems  = [...(ch.units || []), ...(ch.projects || []), ...(ch.assignment ? [ch.assignment] : [])];
  const chDone   = chItems.filter(i => isDone(state, i.id)).length;
  const allDone  = chDone === chItems.length && chItems.length > 0;

  return `
    <div class="chapter-block">
      <div class="chapter-header${open ? ' open' : ''}"
           onclick="window.__app.toggleChapter('${ch.id}')">
        <div class="chapter-num ${allDone ? 'done' : chDone > 0 ? 'active' : ''}">
          ${allDone ? '✓' : chDone > 0 ? chDone : ci + 1}
        </div>
        <div class="chapter-info">
          <div class="chapter-name">${ch.title}</div>
          <div class="chapter-sub">${ch.sub || ''}</div>
        </div>
        <span class="chapter-arrow${open ? ' open' : ''}">▼</span>
      </div>
      <div class="chapter-body${open ? ' open' : ''}">
        ${(ch.units || []).map(u => renderUnitRow(u, sec, state)).join('')}
        ${(ch.projects || []).map(p => renderProjectRow(p, sec, state)).join('')}
        ${ch.assignment ? renderAssignmentRow(ch.assignment, sec, state) : ''}
      </div>
    </div>
  `;
}

function renderUnitRow(u, sec, state) {
  const done     = isDone(state, u.id);
  const items    = getAllItems(sec);
  // Math section is optional — never locked
  const unlocked = sec.key === 'math' ? true : isUnlocked(u.id, items, state);
  const dotClass = done ? 'done' : unlocked ? 'active' : '';

  return `
    <div class="unit-row${unlocked ? '' : ' locked'}"
         ${unlocked ? `onclick="window.__app.goUnit('${sec.key}', '${u.id}')"` : ''}>
      <div class="unit-dot ${dotClass}"></div>
      <div class="unit-info">
        <div class="unit-name">${u.title}</div>
        <div class="unit-meta">${u.meta || ''}</div>
      </div>
      <div class="unit-xp" style="color:var(--${sec.key})">+${u.xp} XP</div>
    </div>
  `;
}

function renderAssignmentRow(a, sec, state) {
  const done     = isDone(state, a.id);
  const items    = getAllItems(sec);
  const unlocked = sec.key === 'math' ? true : isUnlocked(a.id, items, state);

  return `
    <div class="assignment-row${unlocked ? '' : ' locked'}"
         ${unlocked ? `onclick="window.__app.goUnit('${sec.key}', '${a.id}')"` : ''}>
      <span class="assignment-badge">Assignment</span>
      <span class="assignment-name">${a.title}</span>
      <span class="assignment-xp">+${a.xp} XP</span>
    </div>
  `;
}

function renderProjectRow(p, sec, state) {
  const done     = isDone(state, p.id);
  const items    = getAllItems(sec);
  const unlocked = isUnlocked(p.id, items, state);

  return `
    <div class="project-row${unlocked ? '' : ' locked'}"
         ${unlocked ? `onclick="window.__app.goUnit('${sec.key}', '${p.id}')"` : ''}>
      <span class="project-badge">Project</span>
      <span class="project-name">${p.title}</span>
      <span class="project-xp">+${p.xp} XP</span>
    </div>
  `;
}

// ── UNIT PAGE ─────────────────────────────────────────────────────────────────
export function renderUnit(item, type, sectionKey, chapter, step, state) {
  const chTitle = chapter ? chapter.title : '';

  return `
    <div class="nav">
      <button class="nav-back" onclick="window.__app.goSection('${sectionKey}')">← ${chTitle}</button>
      <span class="nav-title">${item.title}</span>
      <span class="nav-xp" style="color:var(--${sectionKey})">+${item.xp} XP</span>
    </div>

    ${type === 'assignment' ? renderAssignmentPage(item, sectionKey, state) :
      type === 'project'    ? renderProjectPage(item, sectionKey, state) :
                              renderUnitSteps(item, sectionKey, step, state)}
  `;
}

// ── UNIT STEPS (Watch → Concept → Challenge → Project) ────────────────────────
function renderUnitSteps(item, sectionKey, step, state) {
  // Math pre-section uses lighter format: Watch → Concept → Challenge (no project)
  const isMathUnit = item.id && item.id.startsWith('math');
  const steps = isMathUnit ? ['watch', 'concept', 'challenge'] : ['watch', 'concept', 'challenge', 'project'];

  return `
    <div class="step-dots">
      ${steps.map((_, i) => `
        <div class="step-dot ${i < step ? 'done' : i === step ? 'active' : ''}"></div>
      `).join('')}
    </div>
    ${step === 0 ? renderWatchStep(item) :
      step === 1 ? renderConceptStep(item) :
      step === 2 ? renderChallengeStep(item, state) + (isMathUnit ? `
        <div class="actions">
          <button class="btn-primary" onclick="window.__app.completeUnit()">
            ✓ Done — earn ${item.xp} XP
          </button>
        </div>` : '') :
                   renderProjectStep(item, sectionKey, state)}
  `;
}

// ── WATCH STEP ────────────────────────────────────────────────────────────────
function renderWatchStep(item) {
  const w = item.watch;
  const isNU = w.url && w.url.includes('nu-msr');

  return `
    <div class="card">
      <div class="card-type watch">▶ Watch / Read First</div>
      <div class="card-title">${w.title}</div>
      <div class="card-body"><p>${w.focus}</p></div>
      ${isNU ? `
        <div class="box nu-resource" style="margin-top:10px">
          <div class="box-label">📚 Northwestern University — ME495 Resource</div>
          From the NU MSR graduate course "Sensing, Navigation, and Machine Learning for Robotics"
          by Prof. Matthew Elwin. Read the lecture notes directly — they are the mathematical
          depth behind this unit.
        </div>
      ` : ''}
      <a href="${w.url}" target="_blank" class="watch-link"
         onerror="this.style.display='none'"
         onclick="window.__app.trackWatchClick('${item.id}')">↗ Open resource</a>
      <div style="margin-top:6px;font-size:11px;color:var(--text3)">
        If the link is broken, search:
        <span style="font-family:monospace;color:var(--text2);cursor:pointer;padding:1px 5px;background:var(--surface2);border-radius:3px;user-select:all"
              onclick="navigator.clipboard.writeText('${w.title}').then(()=>this.textContent='Copied!').catch(()=>{})"
              title="Click to copy search term">${"${w.title}"}</span>
        <a href="https://www.google.com/search?q=${encodeURIComponent(w.title)}" target="_blank"
           style="color:var(--accent);font-size:11px;margin-left:4px">↗ Google</a>
      </div>
      ${item.secondary_watch ? `
        <div style="margin-top:10px;padding:10px 12px;background:rgba(108,143,239,.06);border:1px solid rgba(108,143,239,.2);border-radius:6px">
          <div style="font-size:10px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">📖 Go Deeper</div>
          <div style="font-size:13px;font-weight:500;color:var(--text);margin-bottom:4px">${item.secondary_watch.title}</div>
          <div style="font-size:12px;color:var(--text2);line-height:1.5;margin-bottom:8px">${item.secondary_watch.focus}</div>
          <a href="${item.secondary_watch.url}" target="_blank" class="watch-link" style="font-size:12px;padding:5px 10px">↗ Open</a>
        </div>
      ` : ''}
    </div>
    <div class="actions">
      <button class="btn-primary" onclick="window.__app.nextStep()">
        Done — show me the concept ↗
      </button>
      <button class="btn-ghost" onclick="window.__app.nextStep()">Skip for now</button>
    </div>
  `;
}

// ── CONCEPT STEP ──────────────────────────────────────────────────────────────
function renderConceptStep(item) {
  const c = item.concept;

  return `
    <div class="card">
      <div class="card-type concept">◈ Concept</div>
      <div class="card-title">${c.title}</div>
      <div class="card-body">${c.body}</div>
      <div class="box analogy">
        <div class="box-label">Analogy</div>
        ${c.analogy}
      </div>
      <div class="box visual">
        <div class="box-label">Notation</div>${c.visual}</div>
    </div>
    <div id="widget-mount"></div>
    <div class="actions">
      <button class="btn-primary" onclick="window.__app.nextStep()">
        Show me the challenge ↗
      </button>
    </div>
  `;
}

// ── CHALLENGE STEP ────────────────────────────────────────────────────────────
function renderChallengeStep(item, state) {
  const c      = item.challenge;
  const ans    = getAnswer(state, item.id);
  const hint   = hasHint(state, item.id);
  const answered = ans !== undefined;

  return `
    <div class="card">
      <div class="card-type challenge">⚡ Challenge</div>
      <div class="card-title" style="font-size:16px;line-height:1.4">${c.q}</div>

      ${hint ? `
        <div class="box hint-box" style="margin:10px 0">
          <div class="box-label">Hint</div>
          ${c.hint}
        </div>
      ` : ''}

      <div class="options">
        ${(c.opts || []).map((o, i) => {
          let cls = '';
          if (answered) {
            if (o.c)                     cls = 'reveal';
            else if (ans === i && !o.c)  cls = 'wrong';
          }
          return `
            <button class="option ${cls}"
                    onclick="${answered ? '' : `window.__app.submitAnswer(${i})`}">
              ${o.t}
            </button>
          `;
        }).join('')}
      </div>

      <div class="feedback${answered ? ' show' : ''}">${c.exp}</div>

      ${!answered ? `
        <div class="hint-row">
          <button class="hint-btn" onclick="window.__app.revealHint()">💡 Hint</button>
          <button class="hint-btn" onclick="window.__app.revealAnswer()">Show answer</button>
        </div>
      ` : ''}
    </div>

    ${answered ? `
      <div class="actions">
        <button class="btn-primary" onclick="window.__app.nextStep()">
          Build the project ↗
        </button>
      </div>
    ` : ''}
  `;
}

// ── PROJECT STEP ──────────────────────────────────────────────────────────────
function renderProjectStep(item, sectionKey, state) {
  const p    = item.project;
  const done = isDone(state, item.id);
  const gh   = getGH(state, item.id);

  return `
    ${done ? `
      <div class="celebrate">
        <h3>✓ Unit complete — +${item.xp} XP</h3>
        <p>Evidence on GitHub. Keep building.</p>
      </div>
    ` : ''}

    <div class="card">
      <div class="card-type project">◻ Mini-project — ${p.format}</div>
      <div class="card-title">${p.title}</div>
      <div class="card-body" style="margin-bottom:12px">${p.desc}</div>

      <div class="deliverables">
        ${(p.deliverables || []).map(d => `
          <div class="deliverable">
            <div class="deliverable-dot" style="background:var(--${sectionKey})"></div>
            ${d}
          </div>
        `).join('')}
      </div>

      <div class="box hint-box" style="margin-bottom:12px">
        <div class="box-label">Starter hint</div>
        ${p.hint}
      </div>

      <div class="gh-row">
        <input class="gh-input"
               type="text"
               id="gh-input"
               placeholder="Paste your GitHub repo URL when done"
               value="${gh}"
               oninput="window.__app.saveGH(this.value)"/>
      </div>

      ${!done ? `
        <button class="btn-complete"
                onclick="window.__app.completeUnit()">
          ✓ Complete — earn ${item.xp} XP
        </button>
      ` : ''}
    </div>

    ${done ? `
      <div class="actions">
        <button class="btn-primary" onclick="window.__app.goSection('${sectionKey}')">
          Back to chapter
        </button>
      </div>
    ` : ''}
  `;
}

// ── ASSIGNMENT PAGE ───────────────────────────────────────────────────────────
function renderAssignmentPage(item, sectionKey, state) {
  const done = isDone(state, item.id);
  const gh   = getGH(state, item.id);

  return `
    ${done ? `
      <div class="celebrate">
        <h3>✓ Assignment complete — +${item.xp} XP</h3>
        <p>Portfolio piece added.</p>
      </div>
    ` : ''}

    <div class="card">
      <div class="card-type assignment">★ Chapter Assignment</div>
      <div class="card-title">${item.title}</div>
      <div class="card-body" style="margin-bottom:14px">${item.desc}</div>

      <div class="deliverables">
        ${(item.deliverables || []).map(d => `
          <div class="deliverable">
            <div class="deliverable-dot" style="background:var(--purple)"></div>
            ${d}
          </div>
        `).join('')}
      </div>

      <div class="box hint-box" style="margin-bottom:10px">
        <div class="box-label">Approach hint</div>
        ${item.hint}
      </div>

      ${item.linkedin ? `
        <div class="box linkedin">
          <div class="box-label">📣 LinkedIn post template</div>
          ${item.linkedin}
        </div>
      ` : ''}

      <div class="gh-row" style="margin-top:12px">
        <input class="gh-input"
               type="text"
               id="gh-input"
               placeholder="GitHub repo URL"
               value="${gh}"
               oninput="window.__app.saveGH(this.value)"/>
      </div>

      ${!done ? `
        <button class="btn-complete"
                onclick="window.__app.completeUnit()">
          ✓ Mark complete — earn ${item.xp} XP
        </button>
      ` : ''}
    </div>

    ${done ? `
      <div class="actions">
        <button class="btn-primary" onclick="window.__app.goSection('${sectionKey}')">
          Back to chapter
        </button>
      </div>
    ` : ''}
  `;
}

// ── PROJECT PAGE (hw chapter 6 sim+hardware projects) ────────────────────────
function renderProjectPage(item, sectionKey, step, state) {
  // hw6 projects have watch/concept/challenge steps like regular units
  const hasSteps = item.watch && item.watch.title;
  if (hasSteps && step < 3) {
    const steps = ['watch', 'concept', 'challenge', 'project'];
    return `
      <div class="step-dots">
        ${steps.map((_, i) => `
          <div class="step-dot ${i < step ? 'done' : i === step ? 'active' : ''}"></div>
        `).join('')}
      </div>
      ${step === 0 ? renderWatchStep(item) :
        step === 1 ? renderConceptStep(item) :
                     renderChallengeStep(item, state)}
    `;
  }
  const done = isDone(state, item.id);
  const gh   = getGH(state, item.id);

  return `
    ${done ? `
      <div class="celebrate">
        <h3>✓ Project complete — +${item.xp} XP</h3>
        <p>Both sim and hardware versions done. Portfolio piece added.</p>
      </div>
    ` : ''}

    <div class="card" style="margin-bottom:10px">
      <div class="card-type" style="color:var(--ml)">◻ Simulation Version — Always Do This First</div>
      <div class="card-title" style="font-size:15px">${item.sim.title}</div>
      <div class="card-body" style="margin-bottom:12px">${item.sim.desc}</div>
      <div class="deliverables">
        ${(item.sim.deliverables || []).map(d => `
          <div class="deliverable">
            <div class="deliverable-dot" style="background:var(--ml)"></div>
            ${d}
          </div>
        `).join('')}
      </div>
      <div class="box hint-box" style="margin-bottom:0">
        <div class="box-label">Starter hint</div>${item.sim.hint}
      </div>
    </div>

    <div class="card" style="margin-bottom:10px; border-color:rgba(230,168,23,.3)">
      <div class="card-type" style="color:var(--hw)">🔧 Hardware Version — Do When You Have The Hardware</div>
      <div class="card-title" style="font-size:15px">${item.hw.title}</div>
      <div class="card-body" style="margin-bottom:12px">${item.hw.desc}</div>
      <div class="deliverables">
        ${(item.hw.deliverables || []).map(d => `
          <div class="deliverable">
            <div class="deliverable-dot" style="background:var(--hw)"></div>
            ${d}
          </div>
        `).join('')}
      </div>
      <div class="box hint-box" style="margin-bottom:0">
        <div class="box-label">Hardware hint</div>${item.hw.hint}
      </div>
    </div>

    <div class="card">
      <div class="card-type" style="color:#4a9ee8">📣 LinkedIn Post Template</div>
      <div style="font-size:13px;color:var(--text2);line-height:1.6">${item.linkedin}</div>
    </div>

    <div class="gh-row">
      <input class="gh-input"
             type="text"
             id="gh-input"
             placeholder="GitHub repo URL (sim or hardware)"
             value="${gh}"
             oninput="window.__app.saveGH(this.value)"/>
    </div>

    ${!done ? `
      <button class="btn-complete" onclick="window.__app.completeUnit()">
        ✓ Mark complete — earn ${item.xp} XP
      </button>
    ` : `
      <div class="actions">
        <button class="btn-primary" onclick="window.__app.goSection('${sectionKey}')">
          Back to chapter
        </button>
      </div>
    `}
  `;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
export function getAllItems(sec) {
  const items = [];
  for (const ch of (sec.chapters || [])) {
    for (const u of (ch.units    || [])) items.push(u);
    for (const p of (ch.projects || [])) items.push(p);
    if (ch.assignment) items.push(ch.assignment);
  }
  return items;
}

export function findItem(sections, id) {
  for (const sec of sections) {
    for (const ch of (sec.chapters || [])) {
      for (const u of (ch.units || [])) {
        if (u.id === id) return { item: u, sec, ch, type: 'unit' };
      }
      for (const p of (ch.projects || [])) {
        if (p.id === id) return { item: p, sec, ch, type: 'project' };
      }
      if (ch.assignment && ch.assignment.id === id) {
        return { item: ch.assignment, sec, ch, type: 'assignment' };
      }
    }
  }
  return null;
}

function isUnlocked(id, items, state) {
  // Math section is optional — all units always unlocked
  if (id && id.startsWith('math')) return true;
  const idx = items.findIndex(i => i.id === id);
  if (idx === 0) return true;
  return isDone(state, items[idx - 1].id);
}

function computeMaxXP(sections) {
  let total = 0;
  for (const sec of sections) {
    for (const item of getAllItems(sec)) {
      total += item.xp || 0;
    }
  }
  return total;
}
