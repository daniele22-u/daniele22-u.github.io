/* Splash "acquisizione del segnale": 8 canali EEG che si disegnano, convergono in una
   linea, il nome si apre dalla linea e lo schermo si divide rivelando il sito.
   Solo arrivando da fuori (non navigando nel sito), saltabile, assente con prefers-reduced-motion.
   Va incluso come primo elemento del <body>. Forzalo con ?splash nell'URL. */
(() => {
  const force = /[?&]splash\b/.test(location.search);
  // niente splash quando si naviga dentro il sito (es. ritorno da una pagina progetto) o con avanti/indietro
  let internal = false;
  try { internal = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
  const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  if (nav && nav.type === 'back_forward') internal = true;
  if (!force && (internal || matchMedia('(prefers-reduced-motion: reduce)').matches)) return;

  const css = `
  #splash{position:fixed;inset:0;z-index:10000;pointer-events:auto;cursor:pointer;font-family:var(--f-mono);color:var(--fg)}
  #splash .sp-half{position:absolute;left:0;right:0;height:50.5%;background:var(--bg);transition:transform .75s cubic-bezier(.76,0,.24,1)}
  #splash .sp-top{top:0}#splash .sp-bot{bottom:0}
  #splash.open .sp-top{transform:translateY(-100%)}#splash.open .sp-bot{transform:translateY(100%)}
  #splash canvas{position:absolute;inset:0;width:100%;height:100%;transition:opacity .25s}
  #splash .sp-ui{position:absolute;inset:0;padding:20px;display:grid;grid-template:auto 1fr auto/1fr auto;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--fg-dim);transition:opacity .25s}
  #splash .sp-ui b{font-weight:400;color:var(--fg)}
  #splash .sp-rec::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--rec);margin-right:8px;vertical-align:1px;animation:sp-blink 1s steps(2) infinite}
  #splash .sp-tr,#splash .sp-br{text-align:right}#splash .sp-bl,#splash .sp-br{align-self:end}
  #splash .sp-name{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;pointer-events:none;transition:opacity .25s}
  #splash .sp-name h2{margin:0;font-family:var(--f-display);font-weight:400;font-size:clamp(56px,13vw,190px);line-height:.9;letter-spacing:.01em;text-transform:uppercase;clip-path:inset(50% 0 50% 0);transition:clip-path .7s cubic-bezier(.2,.8,.2,1)}
  #splash .sp-name p{margin:14px 0 0;font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:var(--fg-dim);opacity:0;transform:translateY(6px);transition:opacity .5s .25s,transform .5s .25s}
  #splash.named .sp-name h2{clip-path:inset(0 0 0 0)}#splash.named .sp-name p{opacity:1;transform:none}
  #splash.open canvas,#splash.open .sp-ui,#splash.open .sp-name{opacity:0}
  @media (max-width:600px){#splash .sp-name p{font-size:10px;letter-spacing:.16em}#splash .sp-ui{font-size:10px;letter-spacing:.12em}}
  @keyframes sp-blink{50%{opacity:0}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const el = document.createElement('div');
  el.id = 'splash'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="sp-half sp-top"></div><div class="sp-half sp-bot"></div><canvas></canvas>
    <div class="sp-ui"><span>subject_001 · <b class="sp-msg">acquiring signal</b></span><span class="sp-tr sp-rec"><b class="sp-clock">00:00.00</b></span>
    <span></span><span></span><span class="sp-bl">ch <b class="sp-ch">00</b>/08 · 256 Hz</span><span class="sp-br">${matchMedia('(pointer: coarse)').matches ? 'tap' : 'click'} to skip</span></div>
    <div class="sp-name"><h2>Daniele Uras</h2><p>biomedical engineer · eeg · signals · ml</p></div>`;
  document.body.prepend(el);
  const html = document.documentElement, prevOverflow = html.style.overflow;
  html.style.overflow = 'hidden';

  const cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
  const DPR = Math.min(devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  const fit = () => { W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); };
  fit(); addEventListener('resize', fit);
  const cs = getComputedStyle(html), fg = cs.getPropertyValue('--fg').trim(), acc = cs.getPropertyValue('--accent').trim(), line = cs.getPropertyValue('--line').trim();
  const $clock = el.querySelector('.sp-clock'), $ch = el.querySelector('.sp-ch'), $msg = el.querySelector('.sp-msg');

  // canali: somma di sinusoidi con fasi diverse
  const NCH = 8, CH = Array.from({ length: NCH }, (_, i) => {
    const f = [], s = i * 9.13 + 1;
    for (let k = 0; k < 6; k++) f.push([1 + k * 2.3 + (s * (k + 1)) % 1.7, .9 / (k + 1), (s * 7.7 * (k + 1)) % 6.28]);
    return (x) => f.reduce((v, [w, a, p]) => v + a * Math.sin(w * x + p), 0);
  });
  const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
  // risposta evocata (forma tipo P300) che corre lungo la linea
  const erp = (u) => Math.exp(-((u - .3) ** 2) / .004) * -.5 + Math.exp(-((u - .55) ** 2) / .012) * 1.2 - Math.exp(-((u - .8) ** 2) / .01) * .35;

  const T_SWEEP = 1100, T_MERGE = 1150, T_NAME = 1650, T_OPEN = 2750, T_END = 3550;
  let t0 = null, raf = 0, done = false, named = false, opened = false;
  const finish = () => {
    if (done) return; done = true;
    cancelAnimationFrame(raf);
    el.remove(); st.remove();
    html.style.overflow = prevOverflow;
    removeEventListener('resize', fit);
  };
  const open = () => { if (opened) return; opened = true; el.classList.add('open'); setTimeout(finish, 800); };
  el.addEventListener('click', open);
  addEventListener('keydown', open, { once: true });
  addEventListener('wheel', open, { once: true, passive: true });

  const frame = (now) => {
    if (t0 === null) t0 = now;
    const t = now - t0;
    $clock.textContent = `00:${String(Math.floor(t / 1000)).padStart(2, '0')}.${String(Math.floor(t / 10) % 100).padStart(2, '0')}`;
    ctx.clearRect(0, 0, W, H);
    const mx = W * .06, cw = W - 2 * mx, cy = H / 2;
    const gap = Math.min(H * .085, 70), merge = ease((t - T_MERGE) / 450);
    let active = 0;
    for (let i = 0; i < NCH; i++) {
      const start = i * 70, prog = Math.min(1, Math.max(0, (t - start) / (T_SWEEP - 300)));
      if (prog <= 0) continue;
      active++;
      const y0 = cy + (i - (NCH - 1) / 2) * gap * (1 - merge);
      const amp = gap * .3 * (1 - merge * .85);
      // linea di base del canale
      ctx.globalAlpha = .5 * (1 - merge); ctx.strokeStyle = line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(mx, y0); ctx.lineTo(mx + cw, y0); ctx.stroke();
      ctx.globalAlpha = (.35 + .5 * (1 - i / NCH)) * (1 - merge * .6);
      ctx.strokeStyle = fg; ctx.lineWidth = 1.1;
      ctx.beginPath();
      const xe = mx + cw * prog, phase = t / 600;
      for (let x = mx; x <= xe; x += 2) {
        const u = (x - mx) / cw, y = y0 + CH[i](u * 14 + phase) * amp * .45;
        x === mx ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      // cursore di scansione
      if (prog < 1) { ctx.globalAlpha = .9; ctx.fillStyle = acc; ctx.fillRect(xe - 1, y0 - amp, 2, amp * 2); }
    }
    $ch.textContent = String(active).padStart(2, '0');
    // linea unica + risposta evocata
    if (merge > 0) {
      const k = ease((t - T_NAME + 250) / 700);
      ctx.globalAlpha = merge; ctx.strokeStyle = acc; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = mx; x <= mx + cw; x += 2) {
        const u = (x - mx) / cw, y = cy - erp((u - k) * 1.6 + .55) * gap * 1.4 * (1 - ease((t - T_NAME - 500) / 500));
        x === mx ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      if ($msg.textContent !== 'synchronised') $msg.textContent = 'synchronised';
    }
    ctx.globalAlpha = 1;
    if (t > T_NAME && !named) { named = true; el.classList.add('named'); }
    if (t > T_OPEN) open();
    if (t > T_END) return finish();
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
})();
