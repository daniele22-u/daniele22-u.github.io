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
    for (const k of ['fg', 'fg-dim', 'line', 'line-soft', 'rec', 'accent', 'cold', 'trace', 'bg', 'bg-2']) {
      colors[k] = cs.getPropertyValue('--' + k).trim();
    }
  }
  readColors();
  const themeListeners = [];

  /* ---------- tema ---------- */
  document.querySelector('.theme-toggle')?.addEventListener('click', () => {
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

  /* ---------- freccia "scorri": sparisce appena si inizia a scorrere ---------- */
  const cue = document.querySelector('.scroll-cue');
  if (cue) {
    const onScroll = () => cue.classList.toggle('gone', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
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

  /* ---------- TOPOMAP: mappa di potenziale sullo scalpo, vista dall'alto ---------- */
  const topo = document.getElementById('ascii');
  const status = document.getElementById('ascii-status');
  if (topo) {
    // elettrodi 10-20, coordinate dall'alto: x destra, y nuca (naso in alto)
    const EL = [
      ['Fp1',-.31,-.95],['Fp2',.31,-.95],['F7',-.81,-.59],['F3',-.42,-.52],['Fz',0,-.5],['F4',.42,-.52],['F8',.81,-.59],
      ['FC5',-.62,-.27],['FC1',-.2,-.25],['FC2',.2,-.25],['FC6',.62,-.27],
      ['T7',-1,0],['C3',-.5,0],['Cz',0,0],['C4',.5,0],['T8',1,0],
      ['CP5',-.62,.27],['CP1',-.2,.25],['CP2',.2,.25],['CP6',.62,.27],
      ['P7',-.81,.59],['P3',-.42,.52],['Pz',0,.5],['P4',.42,.52],['P8',.81,.59],
      ['O1',-.31,.95],['Oz',0,1],['O2',.31,.95]
    ].map(([n, x, y], k) => ({ n, x, y, k }));
    // sorgenti: dipoli che si spostano, ruotano e invertono polarità + un ritmo posteriore
    const R4 = rng(1020);
    const DIP = [0, 1, 2].map(() => ({
      ax: .25 + R4() * .35, ay: .25 + R4() * .35, wx: .11 + R4() * .12, wy: .09 + R4() * .12,
      px: R4() * 6.28, py: R4() * 6.28, wr: (.12 + R4() * .15) * (R4() < .5 ? -1 : 1), pr: R4() * 6.28,
      wa: .35 + R4() * .3, pa: R4() * 6.28
    }));
    const S2 = 2 * .42 * .42;
    const field = (x, y, t) => {
      let v = 0;
      for (const d of DIP) {
        const cx = d.ax * Math.sin(d.wx * t + d.px), cy = d.ay * Math.sin(d.wy * t + d.py);
        const th = d.wr * t + d.pr, ox = Math.cos(th) * .3, oy = Math.sin(th) * .3;
        const a = Math.sin(d.wa * t + d.pa);
        const p1 = (x - cx - ox) ** 2 + (y - cy - oy) ** 2, p2 = (x - cx + ox) ** 2 + (y - cy + oy) ** 2;
        v += a * (Math.exp(-p1 / S2) - Math.exp(-p2 / S2));
      }
      v += .35 * Math.sin(.8 * t) * Math.exp(-(x * x + (y - .7) ** 2) / .5);
      return v * .85;
    };
    // componente veloce (solo per il tracciato del canale selezionato)
    const fast = (k, t) => .18 * Math.sin(6.2832 * (9.5 + k % 3 * .4) * t + k) * (.6 + .4 * Math.sin(.9 * t + k))
      + .1 * Math.sin(6.2832 * 17 * t + k * 2.1) + .08 * Math.sin(6.2832 * 3.1 * t + k * .7);
    const UV = 20;                       // ±1 del campo = ±20 µV
    const G = 64, EXT = 1.16;            // griglia del campo, raggio della testa in unità elettrodo
    const off = document.createElement('canvas'); off.width = off.height = G;
    const octx = off.getContext('2d'), img = octx.createImageData(G, G), vals = new Float32Array(G * G);
    const rgb = (c) => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(c || ''); return m ? [1, 2, 3].map(i => parseInt(m[i], 16)) : [124, 240, 197]; };
    const LEVELS = [-.6, -.3, .3, .6];
    let S = null, hover = null, auto = 0, nextAuto = 4;
    const AUTO = ['Cz', 'Pz', 'Oz', 'C3', 'Fz', 'C4', 'P3', 'P4'].map(n => EL.findIndex(e => e.n === n));
    let geom = null;
    const pick = (e) => {
      if (!geom) return;
      const r = topo.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
      let best = null, bd = 28 * 28;
      for (const el of EL) {
        const dx = geom.cx + el.x * geom.k - mx, dy = geom.cy + el.y * geom.k - my, d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = el.k; }
      }
      hover = best;
      redraw();
    };
    topo.addEventListener('pointermove', pick);
    topo.addEventListener('pointerdown', pick);
    topo.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { hover = null; redraw(); } });

    const draw = (t) => {
      if (!S) S = fitCanvas(topo);
      const { ctx, w, h } = S;
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h * .82) * .37, cx = w / 2, cy = h * .44, k = R / EXT;
      geom = { cx, cy, k };
      const pos = rgb(colors.accent), neg = rgb(colors.cold);

      // campo sulla griglia
      for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
        const x = ((i + .5) / G * 2 - 1) * EXT, y = ((j + .5) / G * 2 - 1) * EXT;
        const v = field(x, y, t), o = (j * G + i) * 4, c = v > 0 ? pos : neg, a = Math.min(1, Math.abs(v));
        vals[j * G + i] = v;
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2];
        img.data[o + 3] = x * x + y * y < EXT * EXT * 1.08 ? 235 * Math.pow(a, .85) : 0;
      }
      octx.putImageData(img, 0, 0);
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.clip();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, cx - R, cy - R, 2 * R, 2 * R);
      // curve di livello (marching squares)
      ctx.strokeStyle = colors.fg; ctx.lineWidth = 1;
      const cs = 2 * R / G;
      for (const L of LEVELS) {
        ctx.globalAlpha = .22;
        ctx.setLineDash(L < 0 ? [3, 3] : []);
        ctx.beginPath();
        for (let j = 0; j < G - 1; j++) for (let i = 0; i < G - 1; i++) {
          const a = vals[j * G + i] - L, b = vals[j * G + i + 1] - L, c = vals[(j + 1) * G + i + 1] - L, d = vals[(j + 1) * G + i] - L;
          const pts = [];
          if ((a > 0) !== (b > 0)) pts.push([i + a / (a - b), j]);
          if ((b > 0) !== (c > 0)) pts.push([i + 1, j + b / (b - c)]);
          if ((c > 0) !== (d > 0)) pts.push([i + 1 - c / (c - d), j + 1]);
          if ((d > 0) !== (a > 0)) pts.push([i, j + 1 - d / (d - a)]);
          for (let q = 0; q + 1 < pts.length; q += 2) {
            ctx.moveTo(cx - R + (pts[q][0] + .5) * cs, cy - R + (pts[q][1] + .5) * cs);
            ctx.lineTo(cx - R + (pts[q + 1][0] + .5) * cs, cy - R + (pts[q + 1][1] + .5) * cs);
          }
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();

      // contorno della testa: cerchio, naso, orecchie
      ctx.globalAlpha = .9; ctx.strokeStyle = colors.fg; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - R * .12, cy - R * .993); ctx.lineTo(cx, cy - R * 1.13); ctx.lineTo(cx + R * .12, cy - R * .993);
      for (const s of [-1, 1]) {
        ctx.moveTo(cx + s * R * .995, cy - R * .16);
        ctx.bezierCurveTo(cx + s * R * 1.1, cy - R * .2, cx + s * R * 1.12, cy + R * .18, cx + s * R * .99, cy + R * .16);
      }
      ctx.stroke();

      // canale selezionato: hover, altrimenti giro automatico
      if (t > nextAuto) { auto = (auto + 1) % AUTO.length; nextAuto = t + 4; }
      const sel = EL[hover ?? AUTO[auto]];
      // elettrodi
      ctx.font = '9px "JetBrains Mono", monospace';
      for (const el of EL) {
        const X = cx + el.x * k, Y = cy + el.y * k, on = el === sel;
        ctx.globalAlpha = on ? 1 : .75;
        ctx.fillStyle = colors.fg;
        ctx.beginPath(); ctx.arc(X, Y, on ? 3.5 : 2, 0, 6.2832); ctx.fill();
        if (on) { ctx.strokeStyle = colors.fg; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(X, Y, 8, 0, 6.2832); ctx.stroke(); }
        if (w > 380 || on) {
          ctx.globalAlpha = on ? 1 : .45;
          ctx.fillStyle = on ? colors.fg : colors['fg-dim'];
          ctx.fillText(el.n.toUpperCase(), X + 5, Y - 5);
        }
      }

      // barra dei colori
      const bx = w - 26, by = cy - R * .5, bh = R;
      for (let q = 0; q < bh; q++) {
        const v = 1 - 2 * q / bh, c = v > 0 ? pos : neg;
        ctx.globalAlpha = Math.pow(Math.abs(v), .85) * .92;
        ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
        ctx.fillRect(bx, by + q, 6, 1);
      }
      ctx.globalAlpha = .7; ctx.strokeStyle = colors.line; ctx.strokeRect(bx - .5, by - .5, 7, bh + 1);
      ctx.fillStyle = colors['fg-dim']; ctx.textAlign = 'right';
      ctx.fillText(`+${UV}`, bx - 4, by + 8); ctx.fillText('0', bx - 4, by + bh / 2 + 3); ctx.fillText(`−${UV} µV`, bx - 4, by + bh);
      ctx.textAlign = 'left';

      // tracciato del canale selezionato (ultimi 3 s)
      const ty = h * .905, th = h * .04, tx0 = 18, tx1 = w - 18;
      ctx.globalAlpha = .5; ctx.strokeStyle = colors.line; ctx.beginPath(); ctx.moveTo(tx0, ty); ctx.lineTo(tx1, ty); ctx.stroke();
      ctx.globalAlpha = 1; ctx.strokeStyle = colors.accent; ctx.lineWidth = 1.2; ctx.beginPath();
      const N = Math.round(tx1 - tx0);
      for (let q = 0; q <= N; q++) {
        const tt = t - 3 + 3 * q / N, v = field(sel.x, sel.y, tt) + fast(sel.k, tt);
        const Y = ty - v * th;
        q ? ctx.lineTo(tx0 + q, Y) : ctx.moveTo(tx0, Y);
      }
      ctx.stroke();
      ctx.fillStyle = colors['fg-dim']; ctx.globalAlpha = .9;
      ctx.fillText(`${sel.n.toUpperCase()} · −3 s`, tx0, ty - th * 2.1);
      ctx.globalAlpha = 1;
      const val = field(sel.x, sel.y, t) * UV;
      if (status) status.textContent = `${sel.n.toUpperCase()} · ${val >= 0 ? '+' : '−'}${Math.abs(val).toFixed(1)} µV`;
    };
    const redraw = animateWhenVisible(topo, draw);
    window.addEventListener('resize', () => { S = null; redraw(); });
    themeListeners.push(redraw);
  }

  /* ---------- ABOUT: reveal ---------- */
  const card = document.querySelector('.about-card');
  if (card) {
    new IntersectionObserver(([e], obs) => {
      if (e.isIntersecting) { card.classList.add('in'); obs.disconnect(); }
    }, { threshold: 0.2 }).observe(card);
  }

  /* ---------- PATH: timeline con traccia e marker ---------- */
  const tl = document.querySelector('.tl');
  if (tl) {
    const T0 = 2021.5, T1 = 2027.0;
    const ym = (s) => { const [y, m] = s.split('-').map(Number); return y + (m - 1) / 12; };
    const X = (t) => (t - T0) / (T1 - T0);
    const items = [...document.querySelectorAll('.tl-data li')];
    const plot = tl.querySelector('.tl-plot');
    const markersBox = tl.querySelector('.tl-markers');
    const detail = document.querySelector('.tl-detail');
    let selected = items.findIndex(li => li.dataset.marker === '06');
    if (selected < 0) selected = 0;

    // asse: un tick per anno
    const axis = tl.querySelector('.tl-axis');
    for (let y = 2022; y <= 2026; y++) {
      const s = document.createElement('span');
      s.textContent = y;
      s.style.left = (X(y) * 100) + '%';
      axis.appendChild(s);
    }

    // corsie: una barra per esperienza, impilate se si sovrappongono
    const tracks = {};
    tl.querySelectorAll('.lane').forEach(l => {
      const tr = document.createElement('div');
      tr.className = 'lane-track';
      l.appendChild(tr);
      tracks[l.dataset.lane] = { el: tr, rows: [] };
    });
    const bands = [], marks = [];
    items.forEach((li, i) => {
      const t0 = ym(li.dataset.start), t1 = ym(li.dataset.end) + 1 / 12;
      const lane = tracks[li.dataset.lane];
      if (lane) {
        let row = lane.rows.findIndex(end => end <= t0);
        if (row < 0) { row = lane.rows.length; lane.rows.push(t1); } else lane.rows[row] = t1;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tl-bar';
        b.style.setProperty('--x', X(t0));
        b.style.setProperty('--w', X(t1) - X(t0));
        b.style.setProperty('--row', row);
        b.dataset.i = i;
        b.setAttribute('aria-label', li.querySelector('h3').textContent);
        lane.el.appendChild(b);
        bands[i] = b;
      }
      if (li.dataset.marker) {
        const m = document.createElement('button');
        m.type = 'button';
        m.className = 'mk';
        m.style.setProperty('--x', X(t0));
        m.dataset.i = i;
        m.dataset.t = t0;
        m.setAttribute('aria-label', li.dataset.marker + ' — ' + li.querySelector('h3').textContent);
        m.innerHTML = `<span class="mk-n">${li.dataset.marker}</span>`;
        markersBox.appendChild(m);
        marks[i] = m;
      }
    });
    Object.values(tracks).forEach(l => l.el.style.setProperty('--rows', Math.max(1, l.rows.length)));

    // marker vicini: il secondo scende di una riga
    const now = document.createElement('div');
    now.className = 'tl-now';
    now.style.setProperty('--x', X(2026 + 9.5 / 12));
    now.innerHTML = '<span>NOW</span>';
    tl.appendChild(now);

    const layoutMarkers = () => {
      const w = plot.clientWidth;
      let lastX = -1e9, lastRow2 = false;
      marks.filter(Boolean).forEach(m => {
        const x = parseFloat(m.style.getPropertyValue('--x')) * w;
        const row2 = (x - lastX < 36) && !lastRow2;
        m.classList.toggle('row2', row2);
        lastX = x; lastRow2 = row2;
      });
    };

    const renderDetail = () => {
      const li = items[selected];
      const n = li.dataset.marker || '··';
      detail.innerHTML = `<div class="d-n">${n}</div><div>${li.innerHTML}</div>`;
      bands.forEach((b, i) => b && b.classList.toggle('on', i === selected));
      marks.forEach((m, i) => m && m.classList.toggle('on', i === selected));
    };
    const select = (i) => { if (i === selected) return; selected = i; renderDetail(); if (laidOut) drawTrace(); };
    tl.addEventListener('click', (e) => {
      const el = e.target.closest('.tl-bar, .mk');
      if (el) select(+el.dataset.i);
    });
    if (window.matchMedia('(hover: hover)').matches) {
      tl.addEventListener('mouseover', (e) => {
        const el = e.target.closest('.tl-bar, .mk');
        if (el) select(+el.dataset.i);
      });
    }
    window.addEventListener('langchange', () => {
      renderDetail();
      items.forEach((li, i) => {
        const t = li.querySelector('h3').textContent;
        if (bands[i]) bands[i].setAttribute('aria-label', t);
        if (marks[i]) marks[i].setAttribute('aria-label', li.dataset.marker + ' — ' + t);
      });
    });

    // traccia: EEG di fondo + risposta evocata su ogni marker
    const cv = tl.querySelector('.tl-trace');
    const sig = makeChannel(77);
    const g = (x, mu, s) => Math.exp(-((x - mu) * (x - mu)) / (2 * s * s));
    let S = null, progress = reduceMotion ? 1 : 0;
    const markerXs = () => marks.map((m, i) => m ? { i, x: parseFloat(m.style.getPropertyValue('--x')) * S.w } : null).filter(Boolean);
    const yAt = (x, mx, base, amp) => {
      let v = sig(x / 18) * 0.28;
      for (const { x: px } of mx) {
        const d = x - px;
        if (d > -10 && d < 70) v += -0.7 * g(d, 8, 3) + 1.9 * g(d, 22, 6) - 0.6 * g(d, 42, 9);
      }
      return base - v * amp;
    };
    function drawTrace() {
      if (!S) S = fitCanvas(cv);
      const { ctx, w, h } = S;
      ctx.clearRect(0, 0, w, h);
      const mx = markerXs();
      const base = h * 0.66, amp = h * 0.2, end = w * progress;
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = colors.trace;
      ctx.beginPath();
      for (let x = 0; x <= end; x += 1.5) { const y = yAt(x, mx, base, amp); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      // risposta evocata del marker selezionato in evidenza
      const sel = mx.find(m => m.i === selected);
      if (sel && sel.x < end) {
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = Math.max(0, sel.x - 6); x <= Math.min(end, sel.x + 64); x += 1) { const y = yAt(x, mx, base, amp); x === Math.max(0, sel.x - 6) ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
      }
      // penna
      if (progress < 1) {
        ctx.fillStyle = colors.rec;
        ctx.beginPath(); ctx.arc(end, yAt(end, mx, base, amp), 3, 0, 6.2832); ctx.fill();
      }
      marks.forEach(m => { if (m) m.classList.toggle('shown', parseFloat(m.style.getPropertyValue('--x')) * w <= end + 2); });
    }

    renderDetail();
    // misure e primo disegno solo quando la timeline si avvicina allo schermo
    let laidOut = false;
    const layoutOnce = () => {
      if (laidOut) return;
      laidOut = true;
      layoutMarkers();
      drawTrace();
      // su schermi stretti la timeline scorre: parto dagli eventi più recenti
      const sc = document.querySelector('.tl-scroll');
      if (sc) sc.scrollLeft = sc.scrollWidth;
    };
    new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { obs.disconnect(); layoutOnce(); } }, { rootMargin: '400px' }).observe(tl);
    if (!reduceMotion) {
      new IntersectionObserver(([e], obs) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        layoutOnce();
        const t1 = performance.now();
        const step = (t) => {
          progress = Math.min(1, (t - t1) / 2600);
          drawTrace();
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, { threshold: 0.35 }).observe(tl);
    }
    window.addEventListener('resize', () => { if (!laidOut) return; S = null; layoutMarkers(); drawTrace(); });
    themeListeners.push(() => { if (laidOut) drawTrace(); });
  }

  /* ---------- WORK: forme d'onda dei canali ---------- */
  const sleepSig = makeChannel(11);
  const WAVES = {
    // grafo di elettrodi che si ricollega nel tempo, sopra qualche traccia
    // testa vista dall'alto: elettrodi del sistema 10-20 come nodi di un grafo che si ricollega
    gnn(ctx, w, h, t) {
      const R = Math.min(w, h) * 0.38, cx = w / 2, cy = h / 2 + R * 0.06;
      const P = [[-.31,-.95],[.31,-.95],[-.81,-.59],[-.42,-.52],[0,-.5],[.42,-.52],[.81,-.59],
                 [-.62,-.27],[-.2,-.25],[.2,-.25],[.62,-.27],[-1,0],[-.5,0],[0,0],[.5,0],[1,0],
                 [-.62,.27],[-.2,.25],[.2,.25],[.62,.27],[-.81,.59],[-.42,.52],[0,.5],[.42,.52],[.81,.59],
                 [-.31,.95],[0,1],[.31,.95]];
      const nodes = P.map(([x, y], k) => ({ x: cx + x * R * .86, y: cy + y * R * .86, p: k * 1.9 % 6.28 }));
      // testa: cerchio, naso, orecchie
      ctx.strokeStyle = colors.line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - R * .12, cy - R * .99); ctx.lineTo(cx, cy - R * 1.13); ctx.lineTo(cx + R * .12, cy - R * .99); ctx.stroke();
      for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + sgn * R * 1.03, cy, R * .06, R * .17, 0, 0, 6.2832); ctx.stroke(); }
      // connessioni che cambiano nel tempo
      for (let i = 0; i < nodes.length; i++) {
        for (let k = i + 1; k < nodes.length; k++) {
          const a = nodes[i], b = nodes[k];
          if (Math.hypot(a.x - b.x, a.y - b.y) > R * .62) continue;
          const s = Math.sin(t * 0.9 + a.p * 1.7 + b.p);
          if (s < 0.35) continue;
          ctx.globalAlpha = (s - 0.35) * 0.9;
          ctx.strokeStyle = s > 0.92 ? colors.accent : colors.trace;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      for (const nd of nodes) {
        ctx.fillStyle = colors.fg;
        ctx.beginPath(); ctx.arc(nd.x, nd.y, 1.8 + 1.2 * Math.max(0, Math.sin(t * 2 + nd.p)), 0, 6.2832); ctx.fill();
      }
    },
    // monitor di terapia intensiva: ECG + pletismografia + frequenza cardiaca
    icu(ctx, w, h, t) {
      const g = (x, mu, s) => Math.exp(-((x - mu) * (x - mu)) / (2 * s * s));
      const ecg = (tau) => {
        const p = ((tau % 0.82) + 0.82) % 0.82 / 0.82;
        return 0.12 * g(p, 0.12, 0.025) - 0.12 * g(p, 0.21, 0.008) + 1.0 * g(p, 0.235, 0.010)
             - 0.22 * g(p, 0.26, 0.010) + 0.25 * g(p, 0.45, 0.045);
      };
      const pleth = (tau) => {
        const p = ((tau - 0.18) % 0.82 + 0.82) % 0.82 / 0.82;
        return g(p, 0.25, 0.09) + 0.35 * g(p, 0.55, 0.07);
      };
      const lx = 64, span = 3;
      const traces = [[ecg, h * 0.38, h * 0.28, colors.accent], [pleth, h * 0.82, h * 0.2, colors.trace]];
      ctx.lineWidth = 1.2;
      for (const [f, y0, a, col] of traces) {
        ctx.strokeStyle = col;
        ctx.beginPath();
        for (let x = 0; x <= w - lx; x += 1.5) {
          const tau = t - (w - lx - x) / (w - lx) * span;
          const y = y0 - f(tau) * a;
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      ctx.lineWidth = 1;
      ctx.fillStyle = colors['fg-dim'];
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText('HR', w - lx + 12, 18);
      ctx.fillText('SpO₂', w - lx + 12, h * 0.62);
      ctx.fillStyle = colors.fg;
      ctx.font = '18px "JetBrains Mono", monospace';
      ctx.fillText(String(72 + Math.round(2 * Math.sin(t * 0.3))), w - lx + 12, 40);
      ctx.fillText('98', w - lx + 12, h * 0.62 + 22);
    },
    // mare: correnti stratificate e rifiuti che galleggiano alla deriva
    sea(ctx, w, h, t) {
      ctx.lineWidth = 1;
      for (let k = 0; k < 5; k++) {
        const y0 = h * (0.3 + k * 0.14), a = 5 - k * 0.6, f = 0.012 + k * 0.004;
        ctx.strokeStyle = colors.trace;
        ctx.globalAlpha = 0.9 - k * 0.15;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 3) {
          const y = y0 + a * Math.sin(x * f + t * (0.8 - k * 0.1) + k) + 2 * Math.sin(x * f * 2.7 - t * 1.3 + k * 2);
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const r = rng(9);
      for (let k = 0; k < 26; k++) {
        const sp = 8 + r() * 18, x = ((r() * w + t * sp) % (w + 20)) - 10;
        const lane = 0.3 + Math.floor(r() * 5) * 0.14;
        const y = h * lane + 6 * Math.sin(x * 0.02 + t + k) - 3;
        const s = 1.5 + r() * 2.5;
        ctx.fillStyle = r() > 0.82 ? colors.accent : colors.fg;
        ctx.fillRect(x, y, s, s);
      }
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

  // pagine progetto: animazione di intestazione con la stessa forma d'onda della card
  document.querySelectorAll('canvas.wave-hero[data-wave]').forEach(cv => {
    const fn = WAVES[cv.dataset.wave];
    if (!fn) return;
    let S = null;
    const draw = (t) => { if (!S) S = fitCanvas(cv); S.ctx.clearRect(0, 0, S.w, S.h); fn(S.ctx, S.w, S.h, t); };
    const redraw = animateWhenVisible(cv, draw);
    window.addEventListener('resize', () => { S = null; redraw(); });
    themeListeners.push(redraw);
  });

  document.querySelectorAll('.ch').forEach(ch => {
    const cv = ch.querySelector('.ch-wave');
    const fn = WAVES[ch.dataset.wave];
    if (!cv || !fn) return;
    let S = null;   // dimensionato solo quando la card entra nello schermo (evita reflow all'avvio)
    const draw = (t) => { if (!S) S = fitCanvas(cv); S.ctx.clearRect(0, 0, S.w, S.h); fn(S.ctx, S.w, S.h, t); };
    const redraw = animateWhenVisible(cv, draw);
    window.addEventListener('resize', () => { S = null; redraw(); });
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
