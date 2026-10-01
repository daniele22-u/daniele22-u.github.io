/* =========================================================
   Daniele Uras — portfolio · interazioni
   ========================================================= */
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  // colori letti dai token CSS, aggiornati quando cambia il tema
  const colors = {};
  function readColors() {
    const cs = getComputedStyle(root);
    for (const k of ['fg', 'fg-dim', 'line', 'line-soft', 'rec', 'accent', 'trace', 'bg', 'bg-2']) {
      colors[k] = cs.getPropertyValue('--' + k).trim();
    }
  }
  readColors();
  const themeListeners = [];

  /* ---------- tema ---------- */
  document.querySelector('.theme-toggle').addEventListener('click', () => {
    const isLight = getComputedStyle(root).colorScheme === 'light';
    const next = isLight ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    readColors();
    themeListeners.forEach(fn => fn());
  });

  /* ---------- tagline che si scrive da sola ---------- */
  const typed = document.querySelector('.typed');
  if (typed) {
    const words = typed.dataset.words.split('|');
    let w = 0, i = 0, del = false;
    const tick = () => {
      const word = words[w];
      typed.textContent = word.slice(0, i);
      if (!del && i === word.length) { del = true; return setTimeout(tick, 1800); }
      if (del && i === 0) { del = false; w = (w + 1) % words.length; }
      i += del ? -1 : 1;
      setTimeout(tick, del ? 40 : 90);
    };
    if (reduceMotion) typed.textContent = words[0]; else tick();
  }

  /* ---------- marquee ---------- */
  const CHANNELS = ['Fp1','Fp2','AF3','AF4','F7','F3','Fz','F4','F8','FT7','FC3','FCz','FC4','FT8','T7','C3','Cz','C4','T8','TP7','CP3','CPz','CP4','TP8','P7','P3','Pz','P4','P8','PO7','PO3','POz','PO4','PO8','O1','Oz','O2'];
  document.querySelectorAll('.marquee .track').forEach(track => {
    let s = '';
    if (track.dataset.fill === 'channels') {
      s = CHANNELS.map(c => c.toUpperCase()).join(' · ') + ' · ';
    } else {
      for (let k = 0; k < 90; k++) {
        const v = Math.random() * 120 - 60;
        s += (v < 0 ? '−' : '+') + Math.abs(v).toFixed(2) + ' µV / ';
      }
    }
    track.textContent = (s + s + s + s);
  });

  /* ---------- orologio ---------- */
  const clock = document.getElementById('clock');
  const stamp = document.getElementById('stamp');
  const t0 = performance.now();
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  setInterval(() => {
    const ms = performance.now() - t0;
    if (clock) clock.textContent = `${pad(Math.floor(ms / 3.6e6))}:${pad(Math.floor(ms / 6e4) % 60)}:${pad(Math.floor(ms / 1000) % 60)}.${pad(Math.floor(ms) % 1000, 3)}`;
    if (stamp) stamp.textContent = new Date().toISOString().replace('T', ' ').slice(0, 19) + 'Z';
  }, reduceMotion ? 1000 : 47);

  /* ---------- utilità canvas ---------- */
  function fitCanvas(cv) {
    const r = cv.getBoundingClientRect();
    cv.width = Math.max(1, Math.round(r.width * DPR));
    cv.height = Math.max(1, Math.round(r.height * DPR));
    const ctx = cv.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    return { ctx, w: r.width, h: r.height };
  }

  // anima solo quando il canvas è visibile
  function animateWhenVisible(el, frame) {
    let visible = false, raf = 0;
    const loop = (t) => { frame(t / 1000); if (visible) raf = requestAnimationFrame(loop); };
    if (reduceMotion) { frame(3.0); return () => frame(3.0); }
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(loop);
    }).observe(el);
    return () => { if (!visible) frame(performance.now() / 1000); };
  }

  // pseudo-random deterministico
  function rng(seed) {
    return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  }

  // segnale tipo EEG: somma di sinusoidi (delta→beta) + burst alpha modulati
  function makeChannel(seed) {
    const r = rng(seed * 9973 + 7);
    const comps = [];
    const bands = [[0.8, 1.0], [2.5, 0.6], [5.5, 0.45], [9 + r() * 2, 0.0], [14, 0.25], [19, 0.18], [27, 0.12], [38, 0.08]];
    for (const [f, a] of bands) comps.push({ f: f * (0.9 + r() * 0.2), a: a * (0.6 + r() * 0.8), p: r() * Math.PI * 2 });
    const alphaF = bands[3][0], alphaP = r() * 6.28, envF = 0.15 + r() * 0.2, envP = r() * 6.28;
    return (t) => {
      let v = 0;
      for (const c of comps) v += c.a * Math.sin(6.2832 * c.f * t + c.p);
      const env = Math.max(0, Math.sin(6.2832 * envF * t + envP));
      v += 1.1 * env * env * Math.sin(6.2832 * alphaF * t + alphaP);
      return v;
    };
  }

  /* ---------- HERO: tracciato EEG multicanale ---------- */
  const eeg = document.getElementById('eeg');
  if (eeg) {
    const LABELS = ['Fp1','F3','F7','FC3','C3','T7','CP3','P3','P7','PO7','O1','Oz','O2','PO8','P8','P4','CP4','T8','C4','FC4','F8','F4','Fp2'];
    const sigs = LABELS.map((_, i) => makeChannel(i + 1));
    let S = fitCanvas(eeg);
    const mouse = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 };
    eeg.parentElement.addEventListener('pointermove', (e) => {
      const r = eeg.getBoundingClientRect();
      mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top;
    });
    eeg.parentElement.addEventListener('pointerleave', () => { mouse.tx = -1e4; mouse.ty = -1e4; });

    const draw = (t) => {
      const { ctx, w, h } = S;
      ctx.clearRect(0, 0, w, h);
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;

      const n = w < 600 ? 14 : LABELS.length;
      const top = 24, bottom = 40;
      const gap = (h - top - bottom) / (n - 1);
      const left = w < 600 ? 44 : 64;
      const step = w < 600 ? 3 : 2;
      const amp = gap * 0.42;
      const WINDOW = w < 600 ? 2.5 : 5; // secondi visibili

      // griglia temporale (1 s)
      ctx.strokeStyle = colors['line-soft'];
      ctx.lineWidth = 1;
      const pxPerSec = (w - left) / WINDOW;
      const off = (t % 1) * pxPerSec;
      for (let x = w - off; x > left; x -= pxPerSec) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }

      ctx.font = `10px "JetBrains Mono", monospace`;
      ctx.textBaseline = 'middle';
      for (let c = 0; c < n; c++) {
        const y0 = top + c * gap;
        const sig = sigs[c];
        ctx.fillStyle = colors['fg-dim'];
        ctx.fillText(LABELS[c].toUpperCase(), 14, y0);
        ctx.beginPath();
        for (let x = left; x <= w; x += step) {
          const tau = t - (w - x) / pxPerSec;
          const dx = x - mouse.x, dy = y0 - mouse.y;
          // il cursore agisce come uno stimolo: aumenta l'ampiezza localmente
          const g = 1 + 2.4 * Math.exp(-(dx * dx) / 9000 - (dy * dy) / 2600);
          const y = y0 + sig(tau) * amp * 0.45 * g;
          if (x === left) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = colors.trace;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // fade sul bordo destro, dove “arriva” il segnale
      const grad = ctx.createLinearGradient(w - 80, 0, w, 0);
      grad.addColorStop(0, 'transparent'); grad.addColorStop(1, colors.bg);
      ctx.fillStyle = grad; ctx.fillRect(w - 80, 0, 80, h);
    };
    const redraw = animateWhenVisible(eeg, draw);
    window.addEventListener('resize', () => { S = fitCanvas(eeg); redraw(); });
    themeListeners.push(redraw);
  }

  /* ---------- PORTRAIT: ritratto in ASCII ---------- */
  const ascii = document.getElementById('ascii');
  const img = document.getElementById('portrait-src');
  const status = document.getElementById('ascii-status');
  if (ascii && img) {
    const RAMP = ' .·:-=+*01#%@';
    let grid = null, cols = 0, rows = 0, revealed = 0, started = false;

    const sample = () => {
      const S = fitCanvas(ascii);
      cols = Math.round(S.w / 3.6);
      rows = Math.round(cols * (img.naturalHeight / img.naturalWidth) * 0.55);
      const off = document.createElement('canvas');
      off.width = cols; off.height = rows;
      const octx = off.getContext('2d', { willReadFrequently: true });
      octx.drawImage(img, 0, 0, cols, rows);
      const data = octx.getImageData(0, 0, cols, rows).data; // lancia se il canvas è “tainted”
      grid = new Float32Array(cols * rows);
      for (let k = 0; k < cols * rows; k++) {
        grid[k] = (0.299 * data[k * 4] + 0.587 * data[k * 4 + 1] + 0.114 * data[k * 4 + 2]) / 255;
      }
      // stretch del contrasto: lo sfondo grigio e la giacca scura spariscono, restano viso e camicia
      const sorted = Array.from(grid).sort((a, b) => a - b);
      const lo = sorted[Math.floor(sorted.length * 0.6)], hi = sorted[Math.floor(sorted.length * 0.995)];
      for (let k = 0; k < grid.length; k++) grid[k] = Math.pow(Math.min(1, Math.max(0, (grid[k] - lo) / (hi - lo || 1))), 0.9);
      return S;
    };

    const render = (S, upto) => {
      const { ctx, w, h } = S;
      ctx.clearRect(0, 0, w, h);
      const cw = w / cols, chh = h / rows;
      ctx.font = `${Math.ceil(chh * 1.05)}px "JetBrains Mono", monospace`;
      ctx.textBaseline = 'top';
      ctx.fillStyle = colors.fg;
      for (let y = 0; y < Math.min(rows, upto); y++) {
        for (let x = 0; x < cols; x++) {
          const v = grid[y * cols + x];
          const ch = RAMP[Math.min(RAMP.length - 1, Math.floor(v * RAMP.length))];
          if (ch !== ' ') ctx.fillText(ch, x * cw, y * chh);
        }
      }
      // linea di scansione
      if (upto < rows) {
        ctx.fillStyle = colors.accent;
        ctx.fillRect(0, upto * chh, w, 1.5);
      }
    };

    const start = () => {
      if (started) return;
      started = true;
      let S;
      try { S = sample(); } catch (e) {
        ascii.parentElement.classList.add('no-canvas');
        status.textContent = 'subject_001';
        return;
      }
      const finish = () => { status.textContent = `rendered · ${cols}×${rows} chars`; };
      if (reduceMotion) { revealed = rows; render(S, rows); finish(); return; }
      const t1 = performance.now();
      const step = (t) => {
        revealed = Math.floor((t - t1) / 1800 * rows);
        render(S, revealed);
        status.textContent = `rendering… ${Math.min(100, Math.floor(revealed / rows * 100))}%`;
        if (revealed < rows) requestAnimationFrame(step); else { render(S, rows); finish(); }
      };
      requestAnimationFrame(step);
      const rerender = () => { try { S = sample(); render(S, rows); } catch (e) {} };
      window.addEventListener('resize', rerender);
      themeListeners.push(rerender);
    };

    const whenReady = () => {
      new IntersectionObserver(([e], obs) => {
        if (e.isIntersecting) { obs.disconnect(); document.fonts.ready.then(start); }
      }, { threshold: 0.25 }).observe(ascii);
    };
    if (img.complete && img.naturalWidth) whenReady(); else img.addEventListener('load', whenReady);
  }

  /* ---------- ABOUT: reveal ---------- */
  const card = document.querySelector('.about-card');
  if (card) {
    new IntersectionObserver(([e], obs) => {
      if (e.isIntersecting) { card.classList.add('in'); obs.disconnect(); }
    }, { threshold: 0.2 }).observe(card);
  }

  /* ---------- WORK: forme d'onda dei canali ---------- */
  const sleepSig = makeChannel(11);
  const WAVES = {
    // grafo di elettrodi che si ricollega nel tempo, sopra qualche traccia
    gnn(ctx, w, h, t) {
      const nodes = [];
      const r = rng(42);
      const cx = w * 0.5, cy = h * 0.52, rx = Math.min(w * 0.42, h * 0.75), ry = h * 0.4;
      for (let k = 0; k < 32; k++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r());
        nodes.push({ x: cx + Math.cos(a) * d * rx, y: cy + Math.sin(a) * d * ry, p: r() * 6.28 });
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist > rx * 0.55) continue;
          const s = Math.sin(t * 0.9 + a.p * 1.7 + b.p);
          if (s < 0.35) continue;
          ctx.globalAlpha = (s - 0.35) * 0.9;
          ctx.strokeStyle = s > 0.92 ? colors.accent : colors.trace;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      for (const nd of nodes) {
        const pulse = 1.8 + 1.2 * Math.max(0, Math.sin(t * 2 + nd.p));
        ctx.fillStyle = colors.fg;
        ctx.beginPath(); ctx.arc(nd.x, nd.y, pulse, 0, 6.2832); ctx.fill();
      }
      ctx.strokeStyle = colors.line;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx * 1.08, ry * 1.12, 0, 0, 6.2832); ctx.stroke();
    },
    // segnale assente: blocchi “oscurati”
    nda(ctx, w, h, t) {
      ctx.strokeStyle = colors.trace;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = h / 2 + (Math.random() - 0.5) * 3;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = colors.fg;
      const r = rng(Math.floor(t * 1.5) + 3);
      for (let k = 0; k < 5; k++) ctx.fillRect(r() * w, h * 0.2 + r() * h * 0.6, 20 + r() * 70, 8);
      ctx.fillStyle = colors['fg-dim'];
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('NO SIGNAL // REDACTED', 12, 18);
    },
    // onde lente + spindle
    sleep(ctx, w, h, t) {
      const sig = sleepSig;
      ctx.strokeStyle = colors.trace;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const tau = t - (w - x) / 60;
        const spindle = Math.exp(-Math.pow(((tau % 6) - 3) / 0.5, 2)) * Math.sin(tau * 6.2832 * 13);
        const y = h / 2 + (Math.sin(tau * 6.2832 * 0.9) * 0.9 + sig(tau) * 0.25 + spindle * 0.6) * h * 0.22;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    },
    // ipnogramma a gradini che scorre
    eeg(ctx, w, h, t) {
      const stages = ['W', 'R', 'N1', 'N2', 'N3'];
      const pad = 20, lane = (h - pad * 2) / (stages.length - 1);
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = colors['fg-dim'];
      stages.forEach((s, k) => ctx.fillText(s, 8, pad + k * lane + 3));
      ctx.strokeStyle = colors.trace;
      ctx.beginPath();
      const seq = [0, 2, 3, 4, 4, 3, 1, 3, 4, 3, 2, 1, 3, 4, 3, 1, 0, 2, 3, 3, 1, 2];
      const seg = 26;
      const shift = (t * 14) % (seg * seq.length);
      for (let x = 30; x <= w; x += 2) {
        const idx = Math.floor((x + shift) / seg) % seq.length;
        const y = pad + seq[idx] * lane;
        x === 30 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
    // contorno cerebrale con linea di scansione
    mri(ctx, w, h, t) {
      const cx = w / 2, cy = h / 2, R = h * 0.38;
      ctx.strokeStyle = colors.trace;
      for (let ring = 0; ring < 3; ring++) {
        ctx.beginPath();
        for (let a = 0; a <= 6.30; a += 0.05) {
          const rr = R * (1 - ring * 0.22) * (1 + 0.06 * Math.sin(a * 5 + ring) + 0.03 * Math.sin(a * 11));
          const x = cx + Math.cos(a) * rr * 1.25, y = cy + Math.sin(a) * rr;
          a ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.closePath(); ctx.stroke();
      }
      ctx.fillStyle = colors.accent;
      ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.ellipse(cx + R * 0.4, cy - R * 0.15, 8, 6, 0.4, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = 1;
      const sy = cy - R + ((t * 30) % (2 * R));
      ctx.fillStyle = colors.rec;
      ctx.fillRect(cx - R * 1.4, sy, R * 2.8, 1);
    },
    // stabilogramma (traiettoria del centro di pressione)
    cop(ctx, w, h, t) {
      const cx = w / 2, cy = h / 2;
      ctx.strokeStyle = colors.line;
      ctx.beginPath(); ctx.moveTo(cx - 40, cy); ctx.lineTo(cx + 40, cy); ctx.moveTo(cx, cy - 40); ctx.lineTo(cx, cy + 40); ctx.stroke();
      ctx.strokeStyle = colors.trace;
      ctx.beginPath();
      const N = 260;
      for (let k = 0; k < N; k++) {
        const tau = t - (N - k) * 0.03;
        const x = cx + (Math.sin(tau * 1.3) * 0.6 + Math.sin(tau * 3.1 + 1) * 0.3 + Math.sin(tau * 7.7) * 0.1) * h * 0.35;
        const y = cy + (Math.sin(tau * 0.9 + 2) * 0.6 + Math.sin(tau * 2.3) * 0.3 + Math.sin(tau * 6.1 + 4) * 0.1) * h * 0.3;
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
  };

  document.querySelectorAll('.ch').forEach(ch => {
    const cv = ch.querySelector('.ch-wave');
    const fn = WAVES[ch.dataset.wave];
    if (!cv || !fn) return;
    let S = fitCanvas(cv);
    const draw = (t) => { S.ctx.clearRect(0, 0, S.w, S.h); fn(S.ctx, S.w, S.h, t); };
    const redraw = animateWhenVisible(cv, draw);
    window.addEventListener('resize', () => { S = fitCanvas(cv); redraw(); });
    themeListeners.push(redraw);

    // leggera inclinazione 3D al passaggio del mouse
    if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
      ch.addEventListener('pointermove', (e) => {
        const r = ch.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        ch.style.transform = `perspective(900px) rotateY(${px * 5}deg) rotateX(${-py * 5}deg)`;
      });
      ch.addEventListener('pointerleave', () => { ch.style.transform = ''; });
    }
  });
})();
