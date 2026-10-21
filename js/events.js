/* events.js — the environmental events. Every decision the gate makes triggers exactly one,
 * picked at random from the place the soul went: Heaven for the admitted, Hell for the refused.
 * The camera flies to where it happens, a deep narrator voice announces it,
 * it plays out, and whatever it leaves behind stays until "Begin a new eternity".
 *
 * ─── HOW TO ADD AN EVENT ─────────────────────────────────────────────────────────────
 * register({
 *   id: 'bellTower', realm: 'heaven', short: 'a bell tower in Heaven',
 *   prepare() {                         // decide where it happens (nothing visible yet)
 *     const [x, y] = W.meadowSpot();
 *     return { realm: 'heaven', x, y, focus: { x, y: y - 150, z: 1.3 },
 *              caption: 'A bell tower grows out of the meadow.' };
 *   },
 *   run(plan) {                         // make it happen; resolve when it has played out
 *     const { body } = place('heaven-extras', plan.x, plan.y, 1, 'the bell tower');  // layers: see index.html
 *     svg('rect', { x: -12, y: -120, width: 24, height: 120, fill: '#D9C38A' }, body);
 *     return U.wait(2400);
 *   }
 * });
 * Give each event a realm: 'heaven' or 'hell' (or 'any'). focus is where the camera goes (z = zoom).
 * Draw new things around (0, 0) with their base at y = 0 so growing and swaying look right.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
(function (HG) {
  const U = HG.util;
  const W = HG.world;
  W.pickIn = r => [U.rand(r[0], r[1]), U.rand(r[2], r[3])];
  const svg = U.svg;

  const E = { list: [], recent: [] };
  const register = def => E.list.push(def);
  E.register = register;
  const count = id => (HG.state.counts[id] = (HG.state.counts[id] || 0) + 1);
  const peek = id => HG.state.counts[id] || 0;

  /** Persistent object: outer (position) > drift (gravity) > entrance animation > body (sway). */
  function place(layer, x, y, s, name, opts = {}) {
    const outer = svg('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`, class: 'persist', 'data-name': name, 'data-x': x.toFixed(0), 'data-y': (y - (opts.focusUp ?? 60)).toFixed(0) }, W.L(layer));
    const drift = svg('g', { class: 'drift' }, outer);
    const anim = opts.anim ?? 'grow';
    const entrance = svg('g', { class: anim === 'none' ? '' : anim }, drift);
    if (opts.delay) entrance.style.animationDelay = `${opts.delay}ms`;
    const body = svg('g', { class: opts.sway ? 'sway' : '' }, entrance);
    if (opts.sway) body.style.animationDelay = `${(-Math.random() * 7).toFixed(2)}s`;
    return { outer, body };
  }
  E.place = place;
  const trimNamed = (layer, name, max) => U.trim(W.L(layer), max, `.persist[data-name="${name}"]`);

  /* ═══════════════════════════════ HEAVEN ═══════════════════════════════ */

  register({
    id: 'candyRain', realm: 'heaven', short: 'candy rain in Heaven',
    prepare() {
      const n = peek('candyRain');
      return { realm: 'heaven', focus: { x: 800, y: 640, z: 0.95 }, caption: n ? 'It started to rain candy in Heaven again, harder.' : 'It started to rain candy in Heaven.' };
    },
    run() {
      const L = W.L('heaven-extras');
      const colors = ['#E9A8A0', '#A9D3BE', '#F0D68A', '#CDB3E0', '#F6F0E2', '#E9846A'];
      for (let i = 0; i < 280; i++) {
        const [x, y] = W.meadowSpot(30, 1570);
        const g = svg('g', { class: 'candy' }, L);
        const col = U.pick(colors);
        svg('polygon', { points: '-15,-5 -8,0 -15,5', fill: col, stroke: '#3B2A24', 'stroke-width': 0.8 }, g);
        svg('polygon', { points: '15,-5 8,0 15,5', fill: col, stroke: '#3B2A24', 'stroke-width': 0.8 }, g);
        svg('ellipse', { rx: 9, ry: 6, fill: col, stroke: '#3B2A24', 'stroke-width': 1 }, g);
        svg('ellipse', { cx: -2.5, cy: -2.2, rx: 3.2, ry: 1.6, fill: '#FFFFFF', opacity: 0.8 }, g);
        const rot = U.rand(-90, 90).toFixed(0);
        const sc = i < 10 ? U.rand(4, 6) : U.rand(1.1, 1.9);
        const final = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px) rotate(${rot}deg) scale(${sc.toFixed(2)})`;
        g.style.transform = final;
        g.animate([{ transform: `translate(${(x + U.rand(-40, 40)).toFixed(0)}px, 0px) rotate(0deg) scale(${sc.toFixed(2)})` }, { transform: final }],
          { duration: U.rand(1500, 2500), delay: U.rand(0, 1900), easing: 'cubic-bezier(.45,0,.9,.6)', fill: 'backwards' });
      }
      U.trim(L, 700, '.candy');
      for (let k = 0; k < 4; k++) setTimeout(() => HG.camera.shake(14, 400), 1500 + k * 450);
      count('candyRain');
      return U.wait(4200);
    }
  });

  register({
    id: 'giantFlower', realm: 'heaven', short: 'a giant flower in Heaven',
    prepare() {
      const [x, y] = W.meadowSpot();
      return { realm: 'heaven', x, y, focus: { x: U.clamp(x, 500, 1100), y: 560, z: 0.9 }, caption: 'A flower taller than the clouds grew in Heaven.' };
    },
    run(p) {
      const H = U.rand(260, 360);
      const { body } = place('heaven-extras', p.x, p.y, 2.4, 'a giant flower', { anim: 'none', sway: true, focusUp: H * 1.6 });
      HG.camera.shake(10, 1200);
      const stem = svg('path', { d: `M0,0 C30,${-H * 0.3} -30,${-H * 0.7} 0,${-H}`, stroke: '#5E8A44', 'stroke-width': 9, fill: 'none', class: 'draw', 'stroke-linecap': 'round' }, body);
      stem.style.setProperty('--len', `${(H * 1.15).toFixed(0)}`);
      const lf = svg('g', { class: 'bloom', style: 'animation-delay:.6s' }, body);
      svg('path', { d: `M3,${-H * 0.38} C40,${-H * 0.5} 70,${-H * 0.42} 82,${-H * 0.3} C50,${-H * 0.28} 24,${-H * 0.31} 3,${-H * 0.38} Z`, fill: '#7FAE58', stroke: '#3B2A24', 'stroke-width': 1.2 }, lf);
      const bloom = svg('g', { class: 'bloom' }, body);
      svg('circle', { cx: 0, cy: -H, r: 90, fill: 'url(#g-soft-gold)', opacity: 0.55 }, bloom);
      for (let i = 0; i < 12; i++) svg('ellipse', { cx: 0, cy: -H - 44, rx: 17, ry: 44, fill: U.pick(['#FFF4F8', '#FFE8F0']), stroke: '#3B2A24', 'stroke-width': 1.1, transform: `rotate(${i * 30} 0 ${-H})` }, bloom);
      svg('circle', { cx: 0, cy: -H, r: 22, fill: '#F2B23A', stroke: '#3B2A24', 'stroke-width': 1.2 }, bloom);
      for (let i = 0; i < 12; i++) svg('circle', { cx: (Math.cos(i) * 12).toFixed(1), cy: (-H + Math.sin(i) * 12).toFixed(1), r: 2.4, fill: '#C9761E' }, bloom);
      trimNamed('heaven-extras', 'a giant flower', 8);
      count('giantFlower');
      return U.wait(3400);
    }
  });

  register({
    id: 'goldenTree', realm: 'heaven', short: 'a golden tree in Heaven',
    prepare() {
      const [x, y] = W.meadowSpot();
      return { realm: 'heaven', x, y, focus: { x: U.clamp(x, 500, 1100), y: 560, z: 0.9 }, caption: 'An enormous golden tree burst out of Heaven’s meadow.' };
    },
    run(p) {
      const { body } = place('heaven-extras', p.x, p.y, U.rand(2.4, 2.9), 'a golden tree', { sway: true, focusUp: 420 });
      HG.camera.shake(12, 1400);
      svg('path', { d: 'M-9,0 C-6,-40 -12,-90 -3,-140 L3,-140 C10,-90 6,-40 9,0 Z', fill: '#7A5634', stroke: '#3B2A24', 'stroke-width': 1.2 }, body);
      svg('path', { d: 'M-2,-80 C-20,-96 -34,-102 -46,-124 M2,-100 C18,-112 30,-120 40,-146', stroke: '#5A4122', 'stroke-width': 5, fill: 'none' }, body);
      svg('circle', { cx: 0, cy: -170, r: 110, fill: 'url(#g-soft-gold)', opacity: 0.6 }, body);
      [[-44, -140, 36], [38, -156, 38], [0, -182, 44], [-20, -210, 32], [26, -206, 30], [0, -146, 32], [-56, -176, 26], [58, -186, 26]].forEach(([cx, cy, r]) => {
        svg('circle', { cx, cy, r, fill: U.pick(['#E9C46A', '#F3D98B', '#D9A94A', '#F7E3A6']), stroke: '#8A6420', 'stroke-width': 1 }, body);
      });
      for (let f = 0; f < 7; f++) svg('circle', { cx: U.rand(-50, 50).toFixed(0), cy: U.rand(-220, -130).toFixed(0), r: 4.5, fill: '#FFF4CF', filter: 'url(#f-glow)' }, body);
      trimNamed('heaven-extras', 'a golden tree', 6);
      count('goldenTree');
      return U.wait(2800);
    }
  });

  function drawKoi(g) {
    svg('path', { d: 'M-30,0 L-50,-14 L-44,0 L-50,14 Z', fill: '#F3E6CF', opacity: 0.9 }, g);
    svg('path', { d: 'M-32,0 C-18,-16 14,-16 30,0 C14,16 -18,16 -32,0 Z', fill: '#FBF4E6', stroke: '#C9B38A', 'stroke-width': 1 }, g);
    svg('ellipse', { cx: 6, cy: -4, rx: 10, ry: 5, fill: '#D9792E' }, g);
    svg('ellipse', { cx: -14, cy: 4, rx: 7, ry: 4, fill: '#8C2A1E', opacity: 0.85 }, g);
    svg('path', { d: 'M-2,8 L-10,20 L6,10 Z', fill: '#F3E6CF' }, g);
    svg('circle', { cx: 20, cy: -3, r: 2, fill: '#2B2321' }, g);
  }

  register({
    id: 'koi', realm: 'heaven', short: 'fish swimming in Heaven’s sky',
    prepare() {
      const n = U.randInt(10, 15);
      return { realm: 'heaven', n, focus: { x: 800, y: 480, z: 0.95 }, caption: 'A great shoal of fish started swimming through Heaven’s sky.' };
    },
    run(p) {
      const rev = U.chance(0.5), dur = U.rand(24, 34), baseY = U.rand(180, 520);
      for (let i = 0; i < p.n; i++) {
        const y = baseY + U.rand(-160, 160), s = U.rand(1.8, 3.4);
        const outer = svg('g', { transform: `translate(0 ${y.toFixed(0)})`, class: 'persist fish', 'data-name': 'a fish', 'data-x': '800', 'data-y': y.toFixed(0) }, W.L('heaven-extras'));
        const drift = svg('g', { class: 'drift' }, outer);
        const swim = svg('g', { class: 'swim' + (rev ? ' rev' : '') }, drift);
        swim.style.setProperty('--dur', `${dur.toFixed(1)}s`);
        swim.style.animationDelay = `${(-dur * (0.38 + i * 0.03)).toFixed(2)}s`;
        const und = svg('g', { class: 'undulate' }, swim);
        und.style.animationDelay = `${(-Math.random() * 3).toFixed(2)}s`;
        drawKoi(svg('g', { transform: `scale(${rev ? -s : s} ${s})` }, und));
      }
      U.trim(W.L('heaven-extras'), 45, '.fish');
      count('koi');
      return U.wait(3200);
    }
  });

  register({
    id: 'moon', realm: 'heaven', short: 'another moon over Heaven',
    prepare() {
      const [x, y] = W.pickIn(W.places.heavenSky);
      const n = peek('moon');
      return { realm: 'heaven', x, y: Math.min(y, 260), focus: { x: U.clamp(x, 500, 1100), y: 480, z: 0.95 },
        caption: n ? 'Another huge moon rose over Heaven.' : 'A huge second moon rose over Heaven.' };
    },
    run(p) {
      const r = U.rand(120, 175);
      HG.camera.shake(6, 1600);
      const { body } = place('heaven-extras', p.x, p.y + 60, 1, 'a moon', { anim: 'rise', focusUp: 0 });
      svg('circle', { r: r * 2, fill: 'url(#g-soft-gold)', opacity: 0.5 }, body);
      svg('circle', { r, fill: '#FBF6E8', stroke: '#8E8470', 'stroke-width': 1.4 }, body);
      svg('circle', { cx: r * 0.3, cy: -r * 0.25, r: r * 0.2, fill: '#DCD2BC' }, body);
      svg('circle', { cx: -r * 0.35, cy: r * 0.3, r: r * 0.13, fill: '#DCD2BC' }, body);
      trimNamed('heaven-extras', 'a moon', 5);
      count('moon');
      return U.wait(2800);
    }
  });

  function drawDuck(g) {
    svg('ellipse', { cx: 0, cy: -11, rx: 15, ry: 10, fill: '#F6E08E', stroke: '#3B2A24', 'stroke-width': 1.2 }, g);
    svg('path', { d: 'M-13,-14 L-20,-21 L-12,-9 Z', fill: '#F0D98C' }, g);
    const head = svg('g', { class: 'nod' }, g);
    head.style.animationDelay = `${(-Math.random() * 3).toFixed(2)}s`;
    svg('circle', { cx: 10, cy: -24, r: 7.5, fill: '#F6E08E', stroke: '#3B2A24', 'stroke-width': 1.2 }, head);
    svg('path', { d: 'M16,-25 L25,-22 L16,-20 Z', fill: '#D58A2E' }, head);
    svg('circle', { cx: 12, cy: -26, r: 1.3, fill: '#2B2321' }, head);
  }

  register({
    id: 'duck', realm: 'heaven', short: 'a duck',
    prepare() {
      const n = peek('duck');
      const x = W.places.pond[0] + U.rand(-60, 60), y = W.places.pond[1] + 6;
      return { realm: 'heaven', layer: 'heaven-extras', x, y, focus: { x: U.clamp(x, 500, 1100), y: 640, z: 0.95 }, caption: n ? 'Another giant duck landed in Heaven.' : 'A giant duck landed in Heaven.' };
    },
    run(p) {
      const { body } = place(p.layer, p.x, p.y, 8, 'a duck', { anim: 'drop', focusUp: 200 });
      setTimeout(() => { HG.camera.shake(26, 900); U.burst(W.L('fx'), p.x, p.y, { n: 60, colors: ['#D8EEF6', '#FFFFFF', '#9CC6DE'], spread: 260, upMin: 60, upMax: 220, fall: 20, rMin: 3, rMax: 8 }); }, 650);
      drawDuck(svg('g', { transform: U.chance(0.5) ? 'scale(-1 1)' : '' }, body));
      U.trim(W.L(p.layer), 14, '.persist[data-name="a duck"]');
      count('duck');
      return U.wait(2200);
    }
  });

  register({
    id: 'heavenRainbow', realm: 'heaven', short: 'a rainbow in Heaven',
    prepare() { const x = U.rand(650, 950); return { realm: 'heaven', x, focus: { x: 800, y: 560, z: 0.9 }, caption: 'A colossal rainbow arched over all of Heaven.' }; },
    run(p) {
      const r = U.rand(640, 760);
      const g = svg('g', { class: 'persist rainbow-heaven', 'data-name': 'a rainbow', 'data-x': p.x.toFixed(0), 'data-y': '600' }, W.L('heaven-extras'));
      const drift = svg('g', { class: 'drift' }, g);
      ['#F49A8A', '#F8C878', '#F6EA8E', '#A8D89A', '#9CC4EE', '#B8A4E8'].forEach((c, i) => {
        const rr = r - i * 11;
        const path = svg('path', { d: `M${(p.x - rr).toFixed(0)},960 A${rr.toFixed(0)},${rr.toFixed(0)} 0 0 1 ${(p.x + rr).toFixed(0)},960`, stroke: c, 'stroke-width': 22, fill: 'none', opacity: 0.7, class: 'draw' }, drift);
        path.style.setProperty('--len', `${(Math.PI * rr).toFixed(0)}`);
        path.style.animationDelay = `${i * 110}ms`;
      });
      U.trim(W.L('heaven-extras'), 3, '.rainbow-heaven');
      count('heavenRainbow');
      return U.wait(2600);
    }
  });

  register({
    id: 'walkingCloud', realm: 'heaven', short: 'a cloud that walks',
    prepare() {
      const x = U.rand(400, 1200), y = U.rand(560, 640);
      return { realm: 'heaven', x, y, focus: { x: U.clamp(x, 500, 1100), y: 520, z: 0.95 }, caption: 'A cloud the size of a mountain grew legs and walked across Heaven.' };
    },
    run(p) {
      const { body } = place('heaven-extras', p.x, p.y, U.rand(3.2, 4), 'a walking cloud', { anim: 'rise', focusUp: 0 });
      const w = svg('g', { class: 'wander' }, body);
      w.style.setProperty('--range', `${U.randInt(120, 220)}px`);
      w.style.setProperty('--dur', `${U.randInt(40, 70)}s`);
      [[-16], [-5], [8], [18]].forEach(([lx], i) => {
        const l = svg('line', { x1: lx, y1: 12, x2: lx, y2: 44, stroke: '#2B2321', 'stroke-width': 3, 'stroke-linecap': 'round', class: 'leg-cloud' }, w);
        l.style.animationDelay = `${i % 2 ? 0.45 : 0}s`;
      });
      [[-26, 0, 30], [0, -14, 36], [26, 0, 30], [6, 8, 34], [-14, 8, 28]].forEach(([cx, cy, r]) => svg('circle', { cx, cy, r, fill: 'url(#g-mist)' }, w));
      [[-24, 0, 22], [0, -12, 26], [24, 0, 22], [4, 6, 24]].forEach(([cx, cy, r]) => svg('circle', { cx, cy, r, fill: '#FFFFFF', stroke: '#B8C4DC', 'stroke-width': 1.4 }, w));
      svg('ellipse', { cx: 50, cy: -2, rx: 9, ry: 7, fill: '#3A3432' }, w);
      trimNamed('heaven-extras', 'a walking cloud', 5);
      count('walkingCloud');
      return U.wait(2600);
    }
  });

  register({
    id: 'skyWhales', realm: 'heaven', short: 'whales in Heaven’s sky',
    prepare() { return { realm: 'heaven', focus: { x: 800, y: 460, z: 0.9 }, caption: peek('skyWhales') ? 'More whales came swimming through Heaven’s sky.' : 'Whales came swimming through Heaven’s sky.' }; },
    run() {
      const n = U.randInt(2, 3);
      const rev = U.chance(0.5);
      for (let i = 0; i < n; i++) {
        const y = U.rand(170, 520), s = U.rand(1.1, 1.7);
        const outer = svg('g', { transform: `translate(0 ${y.toFixed(0)})`, class: 'persist whale', 'data-name': 'a whale', 'data-x': '800', 'data-y': y.toFixed(0) }, W.L('heaven-extras'));
        const drift = svg('g', { class: 'drift' }, outer);
        const swim = svg('g', { class: 'swim' + (rev ? ' rev' : '') }, drift);
        const dur = U.rand(70, 95);
        swim.style.setProperty('--dur', `${dur.toFixed(0)}s`);
        swim.style.animationDelay = `${(-dur * (0.4 + i * 0.12)).toFixed(1)}s`;
        const und = svg('g', { class: 'undulate slow' }, swim);
        const g = svg('g', { transform: `scale(${rev ? -s : s} ${s})` }, und);
        svg('path', { d: 'M-260,0 C-200,-70 40,-96 170,-40 C220,-18 240,10 214,28 C140,70 -120,72 -230,26 Z', fill: '#9EB8DC', stroke: '#3B4A6E', 'stroke-width': 2 }, g);
        svg('path', { d: 'M-230,26 C-120,60 140,62 210,26 C150,44 -100,52 -230,26 Z', fill: '#EEF2F8', stroke: 'none' }, g);
        for (let k = 0; k < 6; k++) svg('path', { d: `M${-150 + k * 50},${38 + (k % 2) * 4} l40,-2`, stroke: '#B8C4DC', 'stroke-width': 2 }, g);
        svg('path', { d: 'M-250,4 C-300,-30 -340,-60 -360,-40 C-330,-20 -320,0 -330,20 C-310,30 -280,20 -250,10 Z', fill: '#8CA6CE', stroke: '#3B4A6E', 'stroke-width': 2 }, g);
        svg('path', { d: 'M-20,30 C10,70 40,90 70,84 C50,66 30,48 20,30 Z', fill: '#8CA6CE', stroke: '#3B4A6E', 'stroke-width': 1.6 }, g);
        svg('circle', { cx: 150, cy: -6, r: 5, fill: '#1E2A44' }, g);
        svg('circle', { cx: 148, cy: -8, r: 1.6, fill: '#FFFFFF' }, g);
      }
      U.trim(W.L('heaven-extras'), 8, '.whale');
      HG.camera.shake(6, 2600);
      count('skyWhales');
      return U.wait(3400);
    }
  });

  register({
    id: 'aurora', realm: 'heaven', short: 'an aurora over Heaven',
    prepare() { return { realm: 'heaven', focus: { x: 800, y: 420, z: 0.9 }, caption: 'The whole sky of Heaven began to shimmer and change colour.' }; },
    run() {
      let g = document.getElementById('heaven-aurora');
      if (!g) g = svg('g', { id: 'heaven-aurora', class: 'aurora' }, W.L('heaven-extras'));
      ['#9CFFD8', '#C8A8FF', '#FFB8E8', '#A8E8FF'].forEach((c, i) => {
        const y = 120 + i * 70 + U.rand(-20, 20);
        let d = `M-100,${y}`;
        for (let x = -100; x <= 1700; x += 200) d += ` Q${x + 100},${(y + U.rand(-90, 90)).toFixed(0)} ${x + 200},${(y + U.rand(-40, 40)).toFixed(0)}`;
        const ribbon = svg('path', { d, stroke: c, 'stroke-width': U.rand(50, 90).toFixed(0), fill: 'none', opacity: 0.45, filter: 'url(#f-blur6)', class: 'aurora-ribbon' }, g);
        ribbon.style.animationDelay = `${(-i * 1.7).toFixed(1)}s`;
      });
      U.trim(g, 16, '.aurora-ribbon');
      count('aurora');
      return U.wait(3200);
    }
  });

  /* ═══════════════════════════════ THE STAIRS ═══════════════════════════════ */

  const GEO = HG.geo;
  const pickStep = () => {
    const f = GEO.flights[U.randInt(0, GEO.flights.length - 2)];
    const k = U.randInt(2, GEO.N - 3);
    return { f, k, x: f.xl + f.dir * (k + 0.5) * GEO.RUN, y: f.yl - (k + 1) * GEO.RISE };
  };

  register({
    id: 'gravity', realm: 'any', short: 'gravity giving up',
    prepare(ctx) {
      const realm = ctx && ctx.verdict === 'heaven' ? 'heaven' : 'hell';
      const inRealm = el => realm === 'heaven' ? +el.dataset.y < 1150 : +el.dataset.y > 3600;
      const all = [...document.querySelectorAll('#stage .persist')].filter(el => el.dataset.name && inRealm(el) && el.querySelector(':scope > .drift') && !el.querySelector(':scope > .drift.adrift'));
      const chosen = U.shuffle(all).slice(0, 6);
      const where = realm === 'heaven' ? 'Heaven' : 'Hell';
      return { realm, chosen, focus: realm === 'heaven' ? { x: 800, y: 620, z: 0.95 } : { x: 800, y: 4150, z: 0.95 }, caption: `Gravity stopped working in ${where}.` };
    },
    run(p) {
      HG.camera.shake(10, 2500);
      p.chosen.forEach(el => {
        const d = el.querySelector(':scope > .drift');
        d.style.setProperty('--rise', `${U.randInt(180, 420)}px`);
        d.style.setProperty('--spin', `${U.randInt(-50, 50)}deg`);
        d.classList.add('adrift');
      });
      // the ground itself comes apart and floats
      for (let i = 0; i < 12; i++) {
        const x = U.rand(80, 1520);
        const gy = p.realm === 'heaven' ? W.heavenY(x) + 30 : W.hellY(x) + 40;
        const ty = p.realm === 'heaven' ? U.rand(250, 650) : U.rand(3800, 4200);
        const outer = svg('g', { class: 'persist', 'data-name': p.realm === 'heaven' ? 'a piece of the meadow' : 'a boulder', 'data-x': x.toFixed(0), 'data-y': ty.toFixed(0) }, W.L('anomalies'));
        const final = `translate(${x.toFixed(0)}px, ${ty.toFixed(0)}px) rotate(${U.randInt(-40, 40)}deg)`;
        outer.style.transform = final;
        outer.animate([{ transform: `translate(${x.toFixed(0)}px, ${gy.toFixed(0)}px) rotate(0deg)` }, { transform: final }], { duration: 3600, delay: i * 120, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'backwards' });
        const bob = svg('g', { class: 'hover-bob' }, svg('g', { class: 'drift' }, outer));
        const s = U.rand(1.5, 3.2);
        if (p.realm === 'heaven') {
          svg('path', { d: `M${-30 * s},0 Q0,${-10 * s} ${30 * s},0 L${16 * s},${22 * s} L0,${34 * s} L${-16 * s},${20 * s} Z`, fill: '#A08470', stroke: '#3B2A24', 'stroke-width': 1.4 }, bob);
          svg('path', { d: `M${-31 * s},1 Q0,${-12 * s} ${31 * s},1 L${28 * s},${6 * s} Q0,${-3 * s} ${-28 * s},${6 * s} Z`, fill: '#8DBE62', stroke: '#3B2A24', 'stroke-width': 1.2 }, bob);
        } else {
          svg('polygon', { points: [[-22, 8], [-16, -14], [4, -20], [22, -6], [18, 12], [-4, 16]].map(([a, b]) => `${a * s},${b * s}`).join(' '), fill: '#3A1E18', stroke: '#E0602A', 'stroke-width': 1.6 }, bob);
        }
      }
      U.trim(W.L('anomalies'), 90, '.persist');
      return U.wait(3800);
    }
  });

  /* ═══════════════════════════════ HELL ═══════════════════════════════ */
  const hellX = () => U.rand(140, 1460);
  const hellY = x => W.hellY(x);

  register({
    id: 'earthquake', realm: 'hell', short: 'an earthquake in Hell',
    prepare() {
      const x = hellX();
      return { realm: 'hell', x, focus: { x: 800, y: 4180, z: 0.95 }, caption: 'A colossal earthquake tore Hell in half.' };
    },
    run(p) {
      HG.camera.shake(42, 3400);
      for (let i = 0; i < 16; i++) setTimeout(() => U.burst(W.L('fx'), U.rand(100, 1500), U.rand(4100, 4300), { n: 10, colors: ['#2A1614', '#4A2A24'], spread: 30, upMin: 5, upMax: 20, fall: 220, rMin: 2, rMax: 7, dur: 2200 }), i * 160);
      let x = -20, y = hellY(200) + U.rand(30, 70);
      let d = `M${x.toFixed(0)},${y.toFixed(0)}`;
      while (x < 1620) { x += U.rand(20, 44); y += U.rand(-18, 18); d += ` L${x.toFixed(0)},${y.toFixed(0)}`; }
      const g = svg('g', { class: 'crack' }, W.L('hell-extras'));
      svg('path', { d, stroke: '#070303', 'stroke-width': 26, fill: 'none', 'stroke-linejoin': 'round' }, g);
      const glow = svg('path', { d, stroke: '#FF8A3A', 'stroke-width': 9, fill: 'none', filter: 'url(#f-glow)', class: 'draw pulse-glow', 'stroke-linejoin': 'round' }, g);
      glow.style.setProperty('--len', '2600');
      U.trim(W.L('hell-extras'), 12, '.crack');
      count('earthquake');
      return U.wait(2600);
    }
  });

  register({
    id: 'volcano', realm: 'hell', short: 'a volcano in Hell',
    prepare() {
      const x = hellX();
      return { realm: 'hell', x, focus: { x: U.clamp(x, 600, 1000), y: 4050, z: 0.9 }, caption: 'A gigantic volcano erupted in the middle of Hell.' };
    },
    run(p) {
      const baseY = hellY(p.x) + U.rand(40, 80), w = U.rand(380, 480), h = U.rand(460, 580);
      const { body } = place('hell-extras', p.x, baseY, 1, 'a volcano', { focusUp: h * 0.6 });
      svg('polygon', { points: `${-w},0 ${-w * 0.2},${-h} ${w * 0.2},${-h} ${w},0`, fill: '#3A1E1A', stroke: '#1E0E0C', 'stroke-width': 2 }, body);
      svg('polygon', { points: `${-w * 0.2},${-h} ${-w * 0.6},${-h * 0.25} ${-w * 0.35},${-h * 0.2}`, fill: '#3A1610', opacity: 0.8 }, body);
      const flow = svg('path', { d: `M${w * 0.05},${-h} C${w * 0.15},${-h * 0.7} ${w * 0.02},${-h * 0.45} ${w * 0.32},${-h * 0.12}`, stroke: '#FF7A30', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round', filter: 'url(#f-glow)', class: 'draw' }, body);
      flow.style.setProperty('--len', `${(h * 1.2).toFixed(0)}`);
      flow.style.animationDelay = '1.8s';
      svg('ellipse', { cy: -h, rx: w * 0.2, ry: 6, fill: '#FFB060', filter: 'url(#f-glow)', class: 'pulse' }, body);
      for (let i = 0; i < 4; i++) {
        const puff = svg('circle', { cy: -h - 10, r: 60, fill: '#3A2A28', class: 'smoke' }, body);
        puff.style.animationDelay = `${i * 1.6}s`;
        puff.style.setProperty('--dx', `${U.randInt(-40, 60)}px`);
      }
      setTimeout(() => {
        HG.camera.shake(14, 900);
        HG.camera.shake(30, 1800);
        for (let k = 0; k < 4; k++) setTimeout(() => U.burst(W.L('fx'), p.x, baseY - h, { n: 90, spread: 700, upMin: 300, upMax: 900, fall: 600, dur: 3200, rMin: 3, rMax: 9, colors: ['#FF7A30', '#FFC060', '#E04A1A'] }), k * 350);
      }, 1700);
      trimNamed('hell-extras', 'a volcano', 6);
      count('volcano');
      return U.wait(3800);
    }
  });

  register({
    id: 'burningTower', realm: 'hell', short: 'a burning tower in Hell',
    prepare() {
      const x = hellX();
      return { realm: 'hell', x, focus: { x: U.clamp(x, 600, 1000), y: 4000, z: 0.9 }, caption: 'A burning tower as tall as the sky rose out of Hell.' };
    },
    run(p) {
      const h = U.rand(760, 980), w = U.rand(160, 230);
      const { body } = place('hell-extras', p.x, hellY(p.x) + 20, 1, 'a burning tower', { anim: 'rise-up', focusUp: h * 0.6 });
      const pts = [[-w / 2, 0], [-w / 2, -h + 30], [-w / 4, -h], [0, -h + 40], [w / 5, -h + 10], [w / 2, -h + 60], [w / 2, 0]];
      svg('polygon', { points: pts.map(q => q.join(',')).join(' '), fill: '#0E0707', stroke: '#5A1A10', 'stroke-width': 1.5 }, body);
      for (let y = -h + 70; y < -16; y += 22) for (let x = -w / 2 + 10; x < w / 2 - 10; x += 16) {
        if (Math.random() < 0.18) svg('rect', { x, y, width: 6, height: 10, fill: U.pick(['#FF9A4A', '#FFC070', '#C2452A']) }, body);
      }
      const fl = svg('g', { transform: `translate(0 ${-h + 30}) scale(3)` }, body);
      HG.camera.shake(24, 2200);
      for (let i = 0; i < 3; i++) {
        const f = svg('path', { d: `M${-20 + i * 18},0 C${-30 + i * 18},-30 ${-6 + i * 18},-50 ${-4 + i * 18},-80 C${8 + i * 18},-50 ${24 + i * 18},-30 ${14 + i * 18},0 Z`, fill: i === 1 ? '#FFC060' : '#FF6A20', class: 'flame', filter: 'url(#f-glow)' }, fl);
        f.style.animationDelay = `${(-i * 0.3).toFixed(1)}s`;
      }
      trimNamed('hell-extras', 'a burning tower', 6);
      count('burningTower');
      return U.wait(3200);
    }
  });

  register({
    id: 'lavaRise', realm: 'hell', short: 'rising lava in Hell',
    prepare() {
      const full = HG.state.lavaLevel >= 150;
      return { realm: 'hell', focus: { x: 800, y: 4260, z: 1 }, caption: 'A flood of lava swept across Hell.' };
    },
    run() {
      const L = W.L('lava');
      let pool = document.getElementById('lava-pool');
      if (!pool) {
        pool = svg('g', { id: 'lava-pool' }, L);
        svg('rect', { x: 0, y: 4600, width: 1600, height: 400, fill: 'url(#g-lava)' }, pool);
        svg('rect', { x: 0, y: 4590, width: 1600, height: 20, fill: '#FFB060', filter: 'url(#f-blur6)', opacity: 0.8 }, pool);
      }
      HG.state.lavaLevel = Math.min(HG.state.lavaLevel + 70, 280);
      HG.camera.shake(16, 3000);
      pool.style.transform = `translateY(${-HG.state.lavaLevel}px)`;
      for (let i = 0; i < 24; i++) setTimeout(() => U.burst(W.L('fx'), U.rand(50, 1550), 4600 - HG.state.lavaLevel, { n: 14, spread: 60, upMin: 60, upMax: 200, fall: 10, rMin: 2, rMax: 6 }), i * 120);
      count('lavaRise');
      return U.wait(3200);
    }
  });

  register({
    id: 'fireTornado', realm: 'hell', short: 'a fire tornado in Hell',
    prepare() {
      const x = hellX();
      return { realm: 'hell', x, focus: { x: U.clamp(x, 600, 1000), y: 4100, z: 0.92 }, caption: 'A tornado of fire as tall as the sky began to wander through Hell.' };
    },
    run(p) {
      const { body } = place('hell-extras', p.x, hellY(p.x) + 60, 2.8, 'a fire tornado', { anim: 'rise', focusUp: 200 });
      const wn = svg('g', { class: 'wander' }, body);
      wn.style.setProperty('--range', `${U.randInt(120, 260)}px`);
      wn.style.setProperty('--dur', `${U.randInt(20, 34)}s`);
      for (let i = 0; i < 12; i++) {
        const r = 14 + i * 7;
        const e = svg('ellipse', { cx: 0, cy: -i * 30, rx: r, ry: 8 + i * 1.2, fill: 'none', stroke: i < 4 ? '#FFC060' : '#FF6A20', 'stroke-width': 6 - i * 0.3, opacity: 0.85, class: 'whirl', filter: 'url(#f-glow)' }, wn);
        e.style.animationDelay = `${(-i * 0.13).toFixed(2)}s`;
      }
      trimNamed('hell-extras', 'a fire tornado', 4);
      count('fireTornado');
      return U.wait(3000);
    }
  });

  register({
    id: 'hellSnow', realm: 'hell', short: 'snow in Hell',
    prepare() {
      return { realm: 'hell', x: hellX(), focus: { x: 800, y: 4150, z: 1 }, caption: 'A blizzard swallowed Hell.' };
    },
    run(p) {
      const fx = W.L('fx');
      for (let i = 0; i < 520; i++) {
        const x = U.rand(0, 1600);
        const f = svg('circle', { r: U.rand(2, 6).toFixed(1), fill: '#F4EFE6', opacity: 0.95 }, fx);
        const a = f.animate([
          { transform: `translate(${x.toFixed(0)}px, 3700px)`, opacity: 0 },
          { transform: `translate(${(x + U.rand(-30, 30)).toFixed(0)}px, 4000px)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${(x + U.rand(-60, 60)).toFixed(0)}px, ${U.rand(4400, 4580).toFixed(0)}px)`, opacity: 0 }
        ], { duration: U.rand(2600, 4200), delay: U.rand(0, 1800), fill: 'both' });
        a.onfinish = () => f.remove();
      }
      HG.state.frost = Math.min(HG.state.frost + 0.35, 0.9);
      let frost = document.getElementById('hell-frost');
      if (!frost) frost = svg('rect', { id: 'hell-frost', x: 0, y: 4000, width: 1600, height: 600, fill: 'url(#g-frost)' }, W.L('hell-extras'));
      frost.style.opacity = HG.state.frost * 0.5;
      const { body } = place('hell-extras', p.x, hellY(p.x) + U.rand(40, 80), 5, 'a snowman', { delay: 1800, focusUp: 40 });
      svg('circle', { cy: -16, r: 16, fill: '#F6F2EA', stroke: '#3B2A24', 'stroke-width': 1.2 }, body);
      svg('circle', { cy: -42, r: 11, fill: '#F6F2EA', stroke: '#3B2A24', 'stroke-width': 1.2 }, body);
      svg('circle', { cx: -4, cy: -44, r: 1.5, fill: '#1B0F11' }, body);
      svg('circle', { cx: 4, cy: -44, r: 1.5, fill: '#1B0F11' }, body);
      svg('path', { d: 'M0,-41 L10,-40 L0,-38 Z', fill: '#D58A2E' }, body);
      svg('path', { d: 'M-12,-20 L-26,-30 M12,-20 L25,-32', stroke: '#3A2418', 'stroke-width': 2 }, body);
      trimNamed('hell-extras', 'a snowman', 8);
      count('hellSnow');
      return U.wait(3800);
    }
  });

  register({
    id: 'hellBlossom', realm: 'hell', short: 'flowers in Hell',
    prepare() {
      const x = hellX();
      return { realm: 'hell', x, focus: { x: 800, y: 4250, z: 0.95 }, caption: 'All of Hell burst into pale flowers.' };
    },
    run(p) {
      for (let i = 0; i < 90; i++) {
        const fx = U.rand(30, 1570);
        const { body } = place('hell-extras', fx, hellY(fx) + U.rand(0, 130), U.rand(1.8, 3.6), 'a pale flower', { delay: i * 30, sway: true, focusUp: 30 });
        svg('path', { d: 'M0,0 C4,-12 -4,-22 0,-32', stroke: '#4A5236', 'stroke-width': 2, fill: 'none' }, body);
        for (let k = 0; k < 5; k++) svg('ellipse', { cx: 0, cy: -39, rx: 4, ry: 8, fill: '#F1EADB', transform: `rotate(${k * 72} 0 -32)` }, body);
        svg('circle', { cy: -32, r: 3, fill: '#E2B85A' }, body);
      }
      trimNamed('hell-extras', 'a pale flower', 220);
      count('hellBlossom');
      return U.wait(3000);
    }
  });

  register({
    id: 'smokeEyes', realm: 'hell', short: 'eyes in Hell’s smoke',
    prepare() {
      const x = U.rand(300, 1300);
      return { realm: 'hell', x, focus: { x: 800, y: 3980, z: 0.92 }, caption: 'Enormous eyes opened in the smoke over Hell.' };
    },
    run(p) {
      const n = U.randInt(7, 11);
      for (let i = 0; i < n; i++) {
        const x = U.rand(80, 1520), y = U.rand(3760, 4120);
        const { body } = place('hell-extras', x, y, U.rand(2, 4.2), 'an eye in the smoke', { anim: 'none', focusUp: 0 });
        const open = svg('g', { class: 'eye-open' }, body);
        open.style.animationDelay = `${i * 250}ms`;
        const blink = svg('g', { class: 'blink' }, open);
        blink.style.animationDuration = `${U.rand(4, 9).toFixed(1)}s`;
        blink.style.animationDelay = `${U.rand(1, 4).toFixed(1)}s`;
        svg('ellipse', { rx: 44, ry: 22, fill: 'url(#g-ember-glow)' }, blink);
        svg('path', { d: 'M-26,0 Q0,-16 26,0 Q0,16 -26,0 Z', fill: '#E9DCC4' }, blink);
        svg('circle', { cy: -4, r: 8.5, fill: 'url(#g-iris-red)' }, blink);
        svg('ellipse', { cy: -4, rx: 2, ry: 7, fill: '#0A0302' }, blink);
      }
      trimNamed('hell-extras', 'an eye in the smoke', 30);
      count('smokeEyes');
      return U.wait(2800);
    }
  });

  register({
    id: 'hellRainbow', realm: 'hell', short: 'a rainbow over Hell',
    prepare() {
      const x = U.rand(400, 1200);
      return { realm: 'hell', x: 800, focus: { x: 800, y: 4100, z: 0.92 }, caption: 'A giant rainbow appeared over Hell, apologetically.' };
    },
    run(p) {
      const r = U.rand(600, 720);
      const g = svg('g', { class: 'persist rainbow', 'data-name': 'a rainbow', 'data-x': p.x.toFixed(0), 'data-y': '4150' }, W.L('hell-extras'));
      const drift = svg('g', { class: 'drift' }, g);
      ['#B35A4A', '#C99A5B', '#C8C08A', '#8FA192', '#8B8FAA'].forEach((c, i) => {
        const rr = r - i * 9;
        const path = svg('path', { d: `M${(p.x - rr).toFixed(0)},4440 A${rr.toFixed(0)},${rr.toFixed(0)} 0 0 1 ${(p.x + rr).toFixed(0)},4440`, stroke: c, 'stroke-width': 20, fill: 'none', opacity: 0.6, class: 'draw' }, drift);
        path.style.setProperty('--len', `${(Math.PI * rr).toFixed(0)}`);
        path.style.animationDelay = `${i * 120}ms`;
      });
      U.trim(W.L('hell-extras'), 3, '.rainbow');
      count('hellRainbow');
      return U.wait(2600);
    }
  });

  register({
    id: 'fishRain', realm: 'hell', short: 'raining fish in Hell',
    prepare() {
      const x = U.rand(400, 1200);
      return { realm: 'hell', x, focus: { x: 800, y: 4150, z: 0.92 }, caption: 'It started to rain fish all over Hell.' };
    },
    run(p) {
      for (let i = 0; i < 120; i++) {
        const x = U.rand(30, 1570), y = hellY(x) + U.rand(0, 140);
        const outer = svg('g', { class: 'persist', 'data-name': 'a fish', 'data-x': x.toFixed(0), 'data-y': (y - 30).toFixed(0) }, W.L('hell-extras'));
        const fs = U.rand(1.1, 2.4);
        const final = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px) rotate(${U.rand(-20, 20).toFixed(0)}deg) scale(${fs.toFixed(2)})`;
        outer.style.transform = final;
        outer.animate([{ transform: `translate(${(x + U.rand(-60, 60)).toFixed(0)}px, 3700px) rotate(${U.rand(-200, 200).toFixed(0)}deg) scale(${fs.toFixed(2)})` }, { transform: final }],
          { duration: U.rand(1400, 2200), delay: U.rand(0, 1400), easing: 'cubic-bezier(.5,0,1,.6)', fill: 'backwards' });
        const flop = svg('g', { class: 'flop' }, svg('g', { class: 'drift' }, outer));
        flop.style.animationDelay = `${(-U.rand(0, 2)).toFixed(1)}s`;
        drawKoi(flop);
      }
      U.trim(W.L('hell-extras'), 240, '.persist[data-name="a fish"]');
      count('fishRain');
      return U.wait(3600);
    }
  });

  register({
    id: 'blackSun', realm: 'hell', short: 'a black sun over Hell',
    prepare() {
      const x = U.rand(300, 1300);
      return { realm: 'hell', x, focus: { x: U.clamp(x, 600, 1000), y: 4000, z: 0.9 }, caption: 'A black sun, larger than the city, rose over Hell.' };
    },
    run(p) {
      const y = U.rand(3880, 4020);
      const { body } = place('hell-extras', p.x, y, U.rand(2.2, 2.7), 'a black sun', { anim: 'rise', focusUp: 0 });
      HG.camera.shake(10, 2400);
      svg('circle', { r: 150, fill: 'url(#g-ember-glow)' }, body);
      const c = svg('circle', { r: 74, fill: 'none', stroke: '#FF7A30', 'stroke-width': 6, filter: 'url(#f-glow)', class: 'pulse' }, body);
      c.style.animationDuration = '3s';
      svg('circle', { r: 70, fill: '#050202' }, body);
      trimNamed('hell-extras', 'a black sun', 3);
      count('blackSun');
      return U.wait(3000);
    }
  });

  register({
    id: 'hellStorm', realm: 'hell', short: 'a storm in Hell',
    prepare() { return { realm: 'hell', focus: { x: 800, y: 4100, z: 0.92 }, caption: peek('hellStorm') ? 'Another storm broke over Hell, even bigger.' : 'A huge storm broke out in Hell.' }; },
    run() {
      const L = W.L('hell-extras');
      // dark storm clouds roll in and stay, flickering with lightning
      let storm = document.getElementById('hell-storm');
      if (!storm) {
        storm = svg('g', { id: 'hell-storm', class: 'storm-in' }, L);
        for (let i = 0; i < 16; i++) {
          const x = -60 + i * 110 + U.rand(-30, 30), y = U.rand(3740, 3880), rr = U.rand(80, 140);
          svg('ellipse', { cx: x.toFixed(0), cy: y.toFixed(0), rx: (rr * 1.3).toFixed(0), ry: rr.toFixed(0), fill: '#2A1A22', opacity: 0.92 }, storm);
          svg('ellipse', { cx: x.toFixed(0), cy: (y - rr * 0.35).toFixed(0), rx: (rr * 1.05).toFixed(0), ry: (rr * 0.6).toFixed(0), fill: '#3E2A34', opacity: 0.9 }, storm);
        }
        const fl = svg('rect', { x: 0, y: 3650, width: 1600, height: 950, fill: '#FFF4FF', class: 'storm-flicker' }, L);
      }
      // a burst of lightning and rain right now
      const fx = W.L('fx');
      for (let k = 0; k < 10; k++) setTimeout(() => {
        let x = U.rand(80, 1520), y = 3760, d = `M${x.toFixed(0)},${y}`;
        while (y < W.hellY(x) - 10) { x += U.rand(-40, 40); y += U.rand(40, 90); d += ` L${x.toFixed(0)},${Math.min(y, W.hellY(x)).toFixed(0)}`; }
        const bolt = svg('path', { d, stroke: '#FFFFFF', 'stroke-width': 9, fill: 'none', filter: 'url(#f-glow)' }, fx);
        bolt.animate([{ opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }, { opacity: 0 }], { duration: 600 }).onfinish = () => bolt.remove();
        const flash = svg('rect', { x: 0, y: 3650, width: 1600, height: 950, fill: '#FFFFFF' }, fx);
        flash.animate([{ opacity: 0.45 }, { opacity: 0 }], { duration: 400 }).onfinish = () => flash.remove();
        HG.camera.shake(22, 600);
      }, 300 + k * 380);
      for (let i = 0; i < 600; i++) {
        const x = U.rand(-100, 1700);
        const drop = svg('line', { x1: 0, y1: 0, x2: -8, y2: 26, stroke: '#C8B8D8', 'stroke-width': 1.4, opacity: 0.7 }, fx);
        const a = drop.animate([{ transform: `translate(${x.toFixed(0)}px, 3850px)` }, { transform: `translate(${(x - 90).toFixed(0)}px, ${U.rand(4400, 4600).toFixed(0)}px)` }],
          { duration: U.rand(500, 800), delay: U.rand(0, 2600), fill: 'both' });
        a.onfinish = () => drop.remove();
      }
      count('hellStorm');
      return U.wait(3400);
    }
  });

  /* ═══════════════════════════════ choosing ═══════════════════════════════ */

  /** Pick an event at random, avoiding the last few. */
  E.pick = function (realm) {
    const here = E.list.filter(e => e.realm === realm || e.realm === 'any');
    let pool = here.filter(e => !E.recent.includes(e.id));
    if (!pool.length) pool = here;
    const ev = U.pick(pool);
    E.recent.push(ev.id);
    if (E.recent.length > 7) E.recent.shift();
    return ev;
  };

  E.reset = () => { E.recent = []; };

  HG.events = E;
})(window.HG);
