// ─── widgets.js ──────────────────────────────────────────────────────────────
// All interactive canvas/SVG widgets for Section 3 Robotics.
// Each widget: mount(containerId) → renders HTML + starts animation loop.
// Clean API: one function per widget, fully self-contained.
// ─────────────────────────────────────────────────────────────────────────────

// ── Widget registry — maps unit ID to widget function ─────────────────────────
const WIDGET_MAP = {
  'r1-2': mountTransformWidget,
  'r2-1': mountOdometryWidget,
  'r3-2': mountKalmanWidget,
  'r4-1': mountRRTWidget,
  'r5-2': mountCircleFitWidget,
  'r5-3': mountMahalanobisWidget,
};

export function mountWidget(unitId, containerId) {
  const fn = WIDGET_MAP[unitId];
  if (!fn) return;
  // Small delay to ensure DOM is ready
  requestAnimationFrame(() => fn(containerId));
}

// ─────────────────────────────────────────────────────────────────────────────
// WIDGET 1 — 2D Rigid Body Transform
// ─────────────────────────────────────────────────────────────────────────────
function mountTransformWidget(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `
    <div class="widget">
      <div class="widget-title">🎮 Interactive: 2D Rigid Body Transform</div>
      <div class="slider-row">
        <label>θ (rotation)</label>
        <input type="range" id="tf-theta" min="-180" max="180" value="30" step="1">
        <span class="slider-val" id="tf-theta-val">30°</span>
      </div>
      <div class="slider-row">
        <label>x (translate)</label>
        <input type="range" id="tf-x" min="-3" max="3" value="1" step="0.1">
        <span class="slider-val" id="tf-x-val">1.0</span>
      </div>
      <div class="slider-row">
        <label>y (translate)</label>
        <input type="range" id="tf-y" min="-3" max="3" value="0.5" step="0.1">
        <span class="slider-val" id="tf-y-val">0.5</span>
      </div>
      <canvas id="tf-canvas" width="460" height="280"></canvas>
      <div class="widget-output" id="tf-output"></div>
    </div>
  `;

  function update() {
    const theta = parseFloat(document.getElementById('tf-theta').value) * Math.PI / 180;
    const x     = parseFloat(document.getElementById('tf-x').value);
    const y     = parseFloat(document.getElementById('tf-y').value);
    const tDeg  = Math.round(theta * 180 / Math.PI);
    document.getElementById('tf-theta-val').textContent = tDeg + '°';
    document.getElementById('tf-x-val').textContent     = x.toFixed(1);
    document.getElementById('tf-y-val').textContent     = y.toFixed(1);

    const c = Math.cos(theta), s = Math.sin(theta);
    document.getElementById('tf-output').innerHTML =
      `T = <span class="hl">[[${c.toFixed(3)}, ${(-s).toFixed(3)}, ${x.toFixed(2)}],\n` +
      `     [${s.toFixed(3)},  ${c.toFixed(3)}, ${y.toFixed(2)}],\n` +
      `     [0.000,  0.000,  1.000]]</span>\n\n` +
      `Point p=[1,0] transformed → <span class="hl2">[${(c+x).toFixed(3)}, ${(s+y).toFixed(3)}]</span>`;

    drawTF(theta, x, y, c, s);
  }

  function drawTF(theta, x, y, c, s) {
    const canvas = document.getElementById('tf-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2, sc = 60;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0d15'; ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = '#1a1d27'; ctx.lineWidth = 1;
    for (let i = -5; i <= 5; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i*sc, 0); ctx.lineTo(cx + i*sc, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, cy + i*sc); ctx.lineTo(W, cy + i*sc); ctx.stroke();
    }

    // Draw frame
    function drawFrame(ox, oy, angle, label) {
      const len = 55;
      ctx.lineWidth = 2.5;
      // X axis (red)
      ctx.strokeStyle = '#e85c5c';
      ctx.beginPath(); ctx.moveTo(ox, oy);
      ctx.lineTo(ox + len*Math.cos(angle), oy - len*Math.sin(angle)); ctx.stroke();
      ctx.fillStyle = '#e85c5c'; ctx.font = '11px monospace';
      ctx.fillText('x', ox + len*Math.cos(angle) + 4, oy - len*Math.sin(angle) + 4);
      // Y axis (green)
      ctx.strokeStyle = '#4caf7d';
      ctx.beginPath(); ctx.moveTo(ox, oy);
      ctx.lineTo(ox + len*Math.cos(angle + Math.PI/2), oy - len*Math.sin(angle + Math.PI/2)); ctx.stroke();
      ctx.fillStyle = '#4caf7d';
      ctx.fillText('y', ox + len*Math.cos(angle + Math.PI/2) + 4, oy - len*Math.sin(angle + Math.PI/2));
      // Label
      ctx.fillStyle = '#e8eaf6'; ctx.font = 'bold 12px sans-serif';
      ctx.fillText(label, ox + 5, oy - 10);
    }

    // World frame (origin)
    drawFrame(cx, cy, 0, 'World');
    // Body frame (transformed)
    drawFrame(cx + x*sc, cy - y*sc, theta, 'Body');

    // Transformed point
    const px = cx + (c + x)*sc, py = cy - (s + y)*sc;
    ctx.fillStyle = '#6c8fef'; ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#6c8fef'; ctx.font = '11px monospace'; ctx.fillText('p', px + 7, py - 3);

    // Origin dot
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI*2); ctx.fill();
  }

  ['tf-theta', 'tf-x', 'tf-y'].forEach(id => {
    document.getElementById(id).addEventListener('input', update);
  });
  update();
}

// ─────────────────────────────────────────────────────────────────────────────
// WIDGET 2 — Differential Drive Odometry
// ─────────────────────────────────────────────────────────────────────────────
function mountOdometryWidget(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `
    <div class="widget">
      <div class="widget-title">🚗 Interactive: Differential Drive Odometry</div>
      <div class="slider-row">
        <label>Left wheel ω</label>
        <input type="range" id="odo-wl" min="-2" max="2" value="1" step="0.1">
        <span class="slider-val" id="odo-wl-val">1.0</span>
      </div>
      <div class="slider-row">
        <label>Right wheel ω</label>
        <input type="range" id="odo-wr" min="-2" max="2" value="1.5" step="0.1">
        <span class="slider-val" id="odo-wr-val">1.5</span>
      </div>
      <div class="slider-row">
        <label>Wheel radius r</label>
        <input type="range" id="odo-r" min="0.05" max="0.3" value="0.1" step="0.01">
        <span class="slider-val" id="odo-r-val">0.10</span>
      </div>
      <div class="slider-row">
        <label>Track width d</label>
        <input type="range" id="odo-d" min="0.1" max="0.6" value="0.3" step="0.01">
        <span class="slider-val" id="odo-d-val">0.30</span>
      </div>
      <canvas id="odo-canvas" width="460" height="260"></canvas>
      <div class="widget-output" id="odo-output"></div>
      <button class="widget-btn" id="odo-reset">Reset path</button>
      <button class="widget-btn green" id="odo-step">Step forward (Δt=0.1s)</button>
    </div>
  `;

  let pose = { x: 0, y: 0, theta: 0 };
  let path = [{ x: 0, y: 0 }];

  function getParams() {
    return {
      wl: parseFloat(document.getElementById('odo-wl').value),
      wr: parseFloat(document.getElementById('odo-wr').value),
      r:  parseFloat(document.getElementById('odo-r').value),
      d:  parseFloat(document.getElementById('odo-d').value),
    };
  }

  function update() {
    const { wl, wr, r, d } = getParams();
    document.getElementById('odo-wl-val').textContent = wl.toFixed(1);
    document.getElementById('odo-wr-val').textContent = wr.toFixed(1);
    document.getElementById('odo-r-val').textContent  = r.toFixed(2);
    document.getElementById('odo-d-val').textContent  = d.toFixed(2);

    const vl = wl*r, vr = wr*r;
    const v = (vl + vr)/2, omega = (vr - vl)/d;
    document.getElementById('odo-output').innerHTML =
      `v_l=${vl.toFixed(3)} m/s   v_r=${vr.toFixed(3)} m/s\n` +
      `Linear vel  v = (v_r+v_l)/2 = <span class="hl">${v.toFixed(3)} m/s</span>\n` +
      `Angular vel ω = (v_r-v_l)/d = <span class="hl2">${omega.toFixed(3)} rad/s</span>\n` +
      `Pose: x=<span class="hl3">${pose.x.toFixed(3)}</span>  y=<span class="hl3">${pose.y.toFixed(3)}</span>  θ=<span class="hl3">${(pose.theta*180/Math.PI).toFixed(1)}°</span>`;
    draw();
  }

  function step() {
    const { wl, wr, r, d } = getParams();
    const dt = 0.1;
    const vl = wl*r, vr = wr*r;
    const v = (vl+vr)/2, omega = (vr-vl)/d;
    if (Math.abs(omega) < 1e-6) {
      pose.x += v*dt*Math.cos(pose.theta);
      pose.y += v*dt*Math.sin(pose.theta);
    } else {
      const R = v/omega;
      pose.x += R*(Math.sin(pose.theta + omega*dt) - Math.sin(pose.theta));
      pose.y += R*(-Math.cos(pose.theta + omega*dt) + Math.cos(pose.theta));
      pose.theta += omega*dt;
    }
    path.push({ x: pose.x, y: pose.y });
    if (path.length > 400) path.shift();
    update();
  }

  function draw() {
    const canvas = document.getElementById('odo-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2, sc = 70;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0d15'; ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#1a1d27'; ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(cx+i*sc,0); ctx.lineTo(cx+i*sc,H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,cy+i*sc); ctx.lineTo(W,cy+i*sc); ctx.stroke();
    }

    if (path.length > 1) {
      ctx.strokeStyle = 'rgba(232,125,64,0.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx+path[0].x*sc, cy-path[0].y*sc);
      for (let i = 1; i < path.length; i++) ctx.lineTo(cx+path[i].x*sc, cy-path[i].y*sc);
      ctx.stroke();
    }

    const rx = cx+pose.x*sc, ry = cy-pose.y*sc;
    ctx.fillStyle = '#e87d40'; ctx.beginPath(); ctx.arc(rx,ry,10,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#e85c5c'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(rx,ry);
    ctx.lineTo(rx+20*Math.cos(pose.theta), ry-20*Math.sin(pose.theta)); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx,cy,4,0,Math.PI*2); ctx.fill();
  }

  ['odo-wl','odo-wr','odo-r','odo-d'].forEach(id =>
    document.getElementById(id).addEventListener('input', update));
  document.getElementById('odo-reset').addEventListener('click', () => {
    pose = {x:0,y:0,theta:0}; path = [{x:0,y:0}]; update();
  });
  document.getElementById('odo-step').addEventListener('click', step);
  update();
}

// ─────────────────────────────────────────────────────────────────────────────
// WIDGET 3 — Kalman Filter
// ─────────────────────────────────────────────────────────────────────────────
function mountKalmanWidget(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `
    <div class="widget">
      <div class="widget-title">📡 Interactive: Kalman Filter — Predict & Update</div>
      <div class="slider-row">
        <label>Process noise Q</label>
        <input type="range" id="kf-q" min="0.01" max="2" value="0.3" step="0.01">
        <span class="slider-val" id="kf-q-val">0.30</span>
      </div>
      <div class="slider-row">
        <label>Measurement noise R</label>
        <input type="range" id="kf-r" min="0.1" max="5" value="1.0" step="0.1">
        <span class="slider-val" id="kf-r-val">1.0</span>
      </div>
      <canvas id="kf-canvas" width="460" height="220"></canvas>
      <div class="widget-output" id="kf-output"></div>
      <button class="widget-btn" id="kf-predict">Predict (uncertainty grows)</button>
      <button class="widget-btn accent" id="kf-update">Update with measurement</button>
      <button class="widget-btn" id="kf-reset">Reset</button>
    </div>
  `;

  let mu = 0, sigma = 1, measurement = null;

  function getQR() {
    return {
      Q: parseFloat(document.getElementById('kf-q').value),
      R: parseFloat(document.getElementById('kf-r').value),
    };
  }

  function update() {
    const { Q, R } = getQR();
    document.getElementById('kf-q-val').textContent = Q.toFixed(2);
    document.getElementById('kf-r-val').textContent = R.toFixed(1);
    const K = measurement !== null ? sigma/(sigma+R) : null;
    document.getElementById('kf-output').innerHTML =
      `State:  μ = <span class="hl">${mu.toFixed(3)}</span>   σ² = <span class="hl">${sigma.toFixed(3)}</span>\n` +
      `Q (process noise) = <span class="hl2">${Q.toFixed(2)}</span>   R (sensor noise) = <span class="hl2">${R.toFixed(1)}</span>\n` +
      (measurement !== null ? `Measurement z = <span class="hl3">${measurement.toFixed(3)}</span>   Kalman gain K = <span class="hl3">${K.toFixed(3)}</span>` :
       'Press Predict to grow uncertainty, then Update to correct it.');
    draw();
  }

  function gauss(x, m, s) {
    return Math.exp(-0.5*Math.pow((x-m),2)/s) / Math.sqrt(2*Math.PI*s);
  }

  function draw() {
    const canvas = document.getElementById('kf-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0d15'; ctx.fillRect(0,0,W,H);

    const cx=W/2, sc=55;
    const { R } = getQR();

    function drawG(m, s, color, label) {
      const peak = gauss(m,m,s);
      const hs = (H*0.58)/peak;
      ctx.strokeStyle=color; ctx.lineWidth=2.5; ctx.beginPath();
      let first=true;
      for (let px=0; px<W; px++) {
        const xv=(px-cx)/sc, y=H-20-gauss(xv,m,s)*hs;
        first ? (ctx.moveTo(px,y),first=false) : ctx.lineTo(px,y);
      }
      ctx.stroke();
      ctx.globalAlpha=0.1; ctx.fillStyle=color;
      ctx.beginPath(); first=true;
      for (let px=0; px<W; px++) {
        const xv=(px-cx)/sc, y=H-20-gauss(xv,m,s)*hs;
        if(first){ctx.moveTo(px,H-20);ctx.lineTo(px,y);first=false;}else ctx.lineTo(px,y);
      }
      ctx.lineTo(W,H-20); ctx.closePath(); ctx.fill(); ctx.globalAlpha=1;
      ctx.fillStyle=color; ctx.font='bold 11px sans-serif';
      const lx=cx+m*sc;
      ctx.fillText(label, lx+4, H-25-gauss(m,m,s)*hs-5);
    }

    drawG(mu, sigma, '#6c8fef', 'state estimate');
    if (measurement !== null) drawG(measurement, R, '#e6a817', 'measurement');

    ctx.strokeStyle='#2e3250'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,H-20); ctx.lineTo(W,H-20); ctx.stroke();
    for (let i=-4; i<=4; i++) {
      ctx.fillStyle='#5c6090'; ctx.font='10px monospace';
      ctx.fillText(i, cx+i*sc-4, H-6);
    }
  }

  document.getElementById('kf-q').addEventListener('input', update);
  document.getElementById('kf-r').addEventListener('input', update);
  document.getElementById('kf-predict').addEventListener('click', () => {
    const { Q } = getQR(); sigma += Q; measurement = null; update();
  });
  document.getElementById('kf-update').addEventListener('click', () => {
    const { R } = getQR();
    if (measurement === null) measurement = mu + (Math.random()-0.5)*3;
    const K = sigma/(sigma+R);
    mu = mu + K*(measurement-mu);
    sigma = (1-K)*sigma;
    measurement = null;
    update();
  });
  document.getElementById('kf-reset').addEventListener('click', () => {
    mu=0; sigma=1; measurement=null; update();
  });
  update();
}

// ─────────────────────────────────────────────────────────────────────────────
// WIDGET 4 — RRT Path Planning
// ─────────────────────────────────────────────────────────────────────────────
function mountRRTWidget(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `
    <div class="widget">
      <div class="widget-title">🗺️ Interactive: RRT Path Planning</div>
      <div class="widget-note">Click canvas to add obstacles. Then grow the tree.</div>
      <canvas id="rrt-canvas" width="460" height="300" style="cursor:crosshair"></canvas>
      <div class="widget-output" id="rrt-output">
Start: <span class="hl">[20, 150]</span>  Goal: <span class="hl2">[440, 150]</span>
Click canvas to add obstacles (circles), then press Grow.</div>
      <button class="widget-btn" id="rrt-grow10">Grow RRT (10 steps)</button>
      <button class="widget-btn accent" id="rrt-grow100">Grow 100 steps</button>
      <button class="widget-btn" id="rrt-reset">Reset</button>
    </div>
  `;

  let tree = [{x:20,y:150,parent:-1}];
  let obstacles = [{x:150,y:100,r:40},{x:280,y:180,r:50},{x:380,y:100,r:35}];
  let foundPath = null;

  const canvas = document.getElementById('rrt-canvas');

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width/rect.width, sy = canvas.height/rect.height;
    obstacles.push({ x:(e.clientX-rect.left)*sx, y:(e.clientY-rect.top)*sy, r:28 });
    foundPath = null;
    draw();
  });

  function inCollision(x, y) {
    return obstacles.some(o => Math.hypot(x-o.x, y-o.y) < o.r + 8);
  }

  function grow(steps=10) {
    const goal = {x:440, y:150};
    for (let i=0; i<steps; i++) {
      let rx, ry;
      if (Math.random() < 0.1) { rx=goal.x; ry=goal.y; }
      else { rx=Math.random()*460; ry=Math.random()*300; }

      let nearest=0, bestD=Infinity;
      for (let j=0; j<tree.length; j++) {
        const d=Math.hypot(tree[j].x-rx, tree[j].y-ry);
        if(d<bestD){bestD=d;nearest=j;}
      }
      const dx=rx-tree[nearest].x, dy=ry-tree[nearest].y;
      const len=Math.hypot(dx,dy);
      const s=Math.min(28,len);
      const nx=tree[nearest].x+dx/len*s, ny=tree[nearest].y+dy/len*s;

      if (!inCollision(nx,ny)) {
        tree.push({x:nx,y:ny,parent:nearest});
        if (!foundPath && Math.hypot(nx-goal.x,ny-goal.y) < 20) {
          foundPath=[];
          let idx=tree.length-1;
          while(idx>=0){foundPath.unshift(idx);idx=tree[idx].parent;}
        }
      }
    }
    document.getElementById('rrt-output').innerHTML =
      `Tree nodes: <span class="hl">${tree.length}</span>  ` +
      (foundPath ? `Path found! <span class="hl3">${foundPath.length} waypoints</span>` :
       'Path not yet found — keep growing');
    draw();
  }

  function reset() {
    tree=[{x:20,y:150,parent:-1}];
    obstacles=[{x:150,y:100,r:40},{x:280,y:180,r:50},{x:380,y:100,r:35}];
    foundPath=null;
    document.getElementById('rrt-output').innerHTML =
      `Start: <span class="hl">[20, 150]</span>  Goal: <span class="hl2">[440, 150]</span>\nClick canvas to add obstacles, then press Grow.`;
    draw();
  }

  function draw() {
    const ctx = canvas.getContext('2d');
    const W=canvas.width, H=canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0d15'; ctx.fillRect(0,0,W,H);

    for (const o of obstacles) {
      ctx.fillStyle='rgba(232,92,92,0.2)'; ctx.strokeStyle='#e85c5c'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fill(); ctx.stroke();
    }

    ctx.strokeStyle='rgba(108,143,239,0.25)'; ctx.lineWidth=1;
    for (let i=1; i<tree.length; i++) {
      const n=tree[i], p=tree[n.parent];
      ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(n.x,n.y); ctx.stroke();
    }

    if (foundPath) {
      ctx.strokeStyle='#4caf7d'; ctx.lineWidth=3; ctx.beginPath();
      ctx.moveTo(tree[foundPath[0]].x, tree[foundPath[0]].y);
      for (let i=1; i<foundPath.length; i++)
        ctx.lineTo(tree[foundPath[i]].x, tree[foundPath[i]].y);
      ctx.stroke();
    }

    ctx.fillStyle='#e6a817'; ctx.beginPath(); ctx.arc(20,150,8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff'; ctx.font='bold 10px sans-serif'; ctx.fillText('S',16,154);
    ctx.fillStyle='#4caf7d'; ctx.beginPath(); ctx.arc(440,150,18,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff'; ctx.fillText('GOAL',425,154);
  }

  document.getElementById('rrt-grow10').addEventListener('click',  () => grow(10));
  document.getElementById('rrt-grow100').addEventListener('click', () => grow(100));
  document.getElementById('rrt-reset').addEventListener('click', reset);
  draw();
}

// ─────────────────────────────────────────────────────────────────────────────
// WIDGET 5 — Circle Fitting (NU ME495 Algorithm)
// ─────────────────────────────────────────────────────────────────────────────
function mountCircleFitWidget(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `
    <div class="widget">
      <div class="widget-title">🔵 Interactive: Circle Fitting — NU ME495 Algorithm</div>
      <div class="widget-note">Click canvas to add measurement points. Algorithm fits a circle automatically.</div>
      <canvas id="cf-canvas" width="460" height="280" style="cursor:crosshair"></canvas>
      <div class="widget-output" id="cf-output">Click to add 3+ points, or use the sample arc button.</div>
      <button class="widget-btn" id="cf-reset">Reset points</button>
      <button class="widget-btn accent" id="cf-sample">Add sample arc (simulate HC-SR04 scan)</button>
    </div>
  `;

  let points = [];
  const canvas = document.getElementById('cf-canvas');

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width/rect.width, sy = canvas.height/rect.height;
    points.push({ x:(e.clientX-rect.left)*sx, y:(e.clientY-rect.top)*sy });
    fitAndDraw();
  });

  function addSampleArc() {
    points = [];
    const cx=230, cy=140, r=85;
    for (let a=-Math.PI/3; a<=Math.PI/3; a+=0.13) {
      points.push({
        x: cx + r*Math.cos(a) + (Math.random()-0.5)*5,
        y: cy + r*Math.sin(a) + (Math.random()-0.5)*5,
      });
    }
    fitAndDraw();
  }

  function fitCircle(pts) {
    if (pts.length < 3) return null;
    const n = pts.length;
    let mx=0, my=0;
    for (const p of pts) { mx+=p.x; my+=p.y; }
    mx/=n; my/=n;
    const xi=pts.map(p=>p.x-mx), yi=pts.map(p=>p.y-my);
    const zi=xi.map((x,i)=>x*x+yi[i]*yi[i]);

    let sa=0,sb=0,sc=0,sd=0,se=0,sf=0,sg=0,sh=0,si=0;
    for (let i=0;i<n;i++){
      const x=xi[i],y=yi[i],z=zi[i];
      sa+=x*x;sb+=x*y;sc+=x;sd+=y*y;se+=y;sf+=1;
      sg+=z*x;sh+=z*y;si+=z;
    }

    let A=[[sa,sb,sc,sg],[sb,sd,se,sh],[sc,se,sf,si]];
    for (let col=0; col<3; col++) {
      let maxRow=col;
      for (let row=col+1; row<3; row++)
        if (Math.abs(A[row][col])>Math.abs(A[maxRow][col])) maxRow=row;
      [A[col],A[maxRow]]=[A[maxRow],A[col]];
      for (let row=col+1; row<3; row++) {
        const f=A[row][col]/A[col][col];
        for (let j=col; j<=3; j++) A[row][j]-=f*A[col][j];
      }
    }
    const c2=A[2][3]/A[2][2];
    const c1=(A[1][3]-A[1][2]*c2)/A[1][1];
    const c0=(A[0][3]-A[0][2]*c2-A[0][1]*c1)/A[0][0];
    const a2=c0/2, b2=c1/2;
    const R=Math.sqrt(c2+a2*a2+b2*b2);
    return { cx:a2+mx, cy:b2+my, r:R };
  }

  function fitAndDraw() {
    const canvas = document.getElementById('cf-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W=canvas.width, H=canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0d15'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#1a1d27'; ctx.lineWidth=1;
    for (let i=0; i<W; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,H); ctx.stroke(); }
    for (let i=0; i<H; i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(W,i); ctx.stroke(); }

    for (const p of points) {
      ctx.fillStyle='#6c8fef'; ctx.beginPath(); ctx.arc(p.x,p.y,5,0,Math.PI*2); ctx.fill();
    }

    if (points.length >= 3) {
      const fit = fitCircle(points);
      if (fit && fit.r > 0 && fit.r < 500) {
        ctx.strokeStyle='#e87d40'; ctx.lineWidth=2; ctx.setLineDash([6,3]);
        ctx.beginPath(); ctx.arc(fit.cx,fit.cy,fit.r,0,Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle='#e87d40'; ctx.beginPath(); ctx.arc(fit.cx,fit.cy,5,0,Math.PI*2); ctx.fill();

        let rmse=0;
        for (const p of points)
          rmse += Math.pow(Math.hypot(p.x-fit.cx, p.y-fit.cy)-fit.r, 2);
        rmse = Math.sqrt(rmse/points.length);

        document.getElementById('cf-output').innerHTML =
          `Points: <span class="hl">${points.length}</span>\n` +
          `Fitted center: <span class="hl2">(${fit.cx.toFixed(1)}, ${fit.cy.toFixed(1)})</span>  Radius: <span class="hl2">${fit.r.toFixed(1)}px</span>\n` +
          `RMSE: <span class="hl3">${rmse.toFixed(2)}px</span>  ${rmse < 6 ? '✓ Good fit' : '⚠ Noisy fit — add more arc points'}`;
      }
    } else {
      document.getElementById('cf-output').innerHTML =
        `Points: <span class="hl">${points.length}</span>  Need at least 3 points to fit a circle.`;
    }
  }

  document.getElementById('cf-reset').addEventListener('click', () => { points=[]; fitAndDraw(); });
  document.getElementById('cf-sample').addEventListener('click', addSampleArc);
  fitAndDraw();
}

// ─────────────────────────────────────────────────────────────────────────────
// WIDGET 6 — Mahalanobis Distance (Data Association)
// ─────────────────────────────────────────────────────────────────────────────
function mountMahalanobisWidget(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `
    <div class="widget">
      <div class="widget-title">📏 Interactive: Mahalanobis Distance — Data Association</div>
      <div class="slider-row">
        <label>Landmark 1 position</label>
        <input type="range" id="mah-l1" min="-3" max="3" value="-1" step="0.1">
        <span class="slider-val" id="mah-l1-val">-1.0</span>
      </div>
      <div class="slider-row">
        <label>Landmark 2 position</label>
        <input type="range" id="mah-l2" min="-3" max="3" value="1.5" step="0.1">
        <span class="slider-val" id="mah-l2-val">1.5</span>
      </div>
      <div class="slider-row">
        <label>Measurement z</label>
        <input type="range" id="mah-z" min="-3" max="3" value="0" step="0.1">
        <span class="slider-val" id="mah-z-val">0.0</span>
      </div>
      <div class="slider-row">
        <label>Uncertainty σ</label>
        <input type="range" id="mah-s" min="0.2" max="2" value="0.8" step="0.05">
        <span class="slider-val" id="mah-s-val">0.8</span>
      </div>
      <canvas id="mah-canvas" width="460" height="200"></canvas>
      <div class="widget-output" id="mah-output"></div>
    </div>
  `;

  function update() {
    const l1 = parseFloat(document.getElementById('mah-l1').value);
    const l2 = parseFloat(document.getElementById('mah-l2').value);
    const z  = parseFloat(document.getElementById('mah-z').value);
    const s  = parseFloat(document.getElementById('mah-s').value);

    document.getElementById('mah-l1-val').textContent = l1.toFixed(1);
    document.getElementById('mah-l2-val').textContent = l2.toFixed(1);
    document.getElementById('mah-z-val').textContent  = z.toFixed(1);
    document.getElementById('mah-s-val').textContent  = s.toFixed(2);

    const d1 = Math.pow((z-l1)/s, 2);
    const d2 = Math.pow((z-l2)/s, 2);
    const match = d1 < d2 ? 'Landmark 1' : 'Landmark 2';
    const mc    = d1 < d2 ? 'hl'         : 'hl2';

    document.getElementById('mah-output').innerHTML =
      `Mahalanobis dist to L1: <span class="hl">${d1.toFixed(3)}</span>  (${Math.sqrt(d1).toFixed(2)}σ away)\n` +
      `Mahalanobis dist to L2: <span class="hl2">${d2.toFixed(3)}</span>  (${Math.sqrt(d2).toFixed(2)}σ away)\n` +
      `→ Measurement associated with <span class="${mc}">${match}</span> (minimum Mahalanobis distance)`;

    draw(l1, l2, z, s);
  }

  function gauss(x, m, s) {
    return Math.exp(-0.5*Math.pow((x-m)/s,2)) / (s*Math.sqrt(2*Math.PI));
  }

  function draw(l1, l2, z, s) {
    const canvas = document.getElementById('mah-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W=canvas.width, H=canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0a0d15'; ctx.fillRect(0,0,W,H);

    const cx=W/2, sc=60;

    function drawG(mu, sigma, color, label) {
      const peak = gauss(mu,mu,sigma);
      const hs = (H*0.6)/peak;
      ctx.strokeStyle=color; ctx.lineWidth=2.5; ctx.beginPath();
      let first=true;
      for (let px=0; px<W; px++) {
        const xv=(px-cx)/sc, y=H-20-gauss(xv,mu,sigma)*hs;
        first ? (ctx.moveTo(px,y),first=false) : ctx.lineTo(px,y);
      }
      ctx.stroke();
      ctx.fillStyle=color; ctx.font='bold 11px sans-serif';
      ctx.fillText(label, cx+mu*sc+4, H-25-gauss(mu,mu,sigma)*hs-5);
    }

    drawG(l1, s, '#6c8fef', 'L1');
    drawG(l2, s, '#9c6ef0', 'L2');

    const mpx = cx + z*sc;
    ctx.strokeStyle='#e6a817'; ctx.lineWidth=2; ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.moveTo(mpx,0); ctx.lineTo(mpx,H-20); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='#e6a817'; ctx.font='bold 11px sans-serif'; ctx.fillText('z',mpx+4,18);

    ctx.strokeStyle='#2e3250'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,H-20); ctx.lineTo(W,H-20); ctx.stroke();
    for (let i=-4; i<=4; i++) {
      ctx.fillStyle='#5c6090'; ctx.font='10px monospace';
      ctx.fillText(i, cx+i*sc-4, H-6);
    }
  }

  ['mah-l1','mah-l2','mah-z','mah-s'].forEach(id =>
    document.getElementById(id).addEventListener('input', update));
  update();
}
