/* world.js — the daemon in the gate, and how visitors move: climbing the endless stairs,
 * walking into Heaven, or being thrown down into Hell. Places come from geometry.js.
 */
(function (HG) {
  const U = HG.util, svg = U.svg, Cam = HG.camera, G = HG.geo, S = HG.rig.surfaces;
  const W = {};
  W.L = id => document.getElementById('layer-' + id);
  W.heavenY = x => S.heaven.y(x);
  W.hellY = x => S.hell.y(x);

  /* Named places used by events (x0, x1, y0, y1). */
  W.places = {
    heavenSky: [120, 1500, 70, 400],
    heavenMeadow: [160, 1440],
    pond: [470, 958],
    cornice: [[640, 960, 1296]],
    domes: [[612, 1210], [988, 1210]],
    pillars: [[625, 675, 1410, 1830], [925, 975, 1410, 1830]],
    hellSky: [200, 1400, 3720, 4040],
    hellGround: [120, 1480]
  };
  W.meadowSpot = (x0 = 160, x1 = 1440) => { let x = U.rand(x0, x1); if (x > 300 && x < 640) x += 360; return [x, W.heavenY(x) + U.rand(8, 50)]; };
  W.hellSpot = () => { const x = U.rand(120, 1480); return [x, W.hellY(x) + U.rand(0, 60)]; };

  /* ───────────────────── the gate: the daemon itself ─────────────────────
   * It has no face. When it speaks, its doors part with each word and light pours out, and
   * rings of shifting colour pulse out of the arch. It flushes red when it refuses someone.
   */
  const B = () => document.body.classList;
  let talkTimer = null;
  const doorL = () => document.getElementById('door-left');
  const doorR = () => document.getElementById('door-right');
  const bloom = () => document.getElementById('gate-bloom');

  W.buildGate = function () {
    const aura = document.getElementById('gate-aura');
    ['#FFE7A0', '#FFB8E0', '#A8E0FF', '#C8FFB0', '#FFD080', '#E0B0FF', '#FFFFFF'].forEach((c, i) => {
      const ring = svg('ellipse', { cx: 800, cy: 1610, rx: 170, ry: 230, fill: 'none', stroke: c, 'stroke-width': 7, class: 'aura-ring' }, aura);
      ring.style.animationDelay = `${(-i * 0.55).toFixed(2)}s`;
    });
  };

  /** A ring of light (or of fury) bursting out of the doorway. */
  W.shockwave = function (color, size = 1400, ms = 1100, width = 26) {
    const ring = svg('ellipse', { cx: 800, cy: 1660, rx: 60, ry: 80, fill: 'none', stroke: color, 'stroke-width': width, filter: 'url(#f-glow)' }, W.L('fx'));
    ring.animate([{ rx: 60, ry: 80, opacity: 1, strokeWidth: width }, { rx: size, ry: size * 1.2, opacity: 0, strokeWidth: 2 }], { duration: ms, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => ring.remove();
  };

  W.gate = {
    wake() { B().add('gate-awake'); },
    sleep() { W.gate.talking(false); B().remove('gate-awake', 'gate-speaking', 'gate-angry', 'gate-pleased', 'doors-open'); },
    angry(on) { B().toggle('gate-angry', on); },
    pleased(on) { B().toggle('gate-pleased', on); },
    doors(open) { doorL().style.transform = doorR().style.transform = ''; doorL().style.transition = doorR().style.transition = ''; B().toggle('doors-open', open); },
    /** The doors are its mouth: they part a little with every syllable. */
    talking(on) {
      B().toggle('gate-speaking', on);
      clearInterval(talkTimer);
      const L = doorL(), R = doorR();
      if (on) {
        L.style.transition = R.style.transition = 'transform 0.09s ease-out';
        talkTimer = setInterval(() => {
          const k = Math.random() < 0.25 ? 1 : U.rand(0.8, 0.95);
          L.style.transform = R.style.transform = `scaleX(${k.toFixed(3)})`;
          bloom().style.opacity = (0.45 + (1 - k) * 3).toFixed(2);
        }, 100);
      } else {
        L.style.transform = R.style.transform = '';
        bloom().style.opacity = '';
        setTimeout(() => { if (!B().contains('gate-speaking')) L.style.transition = R.style.transition = ''; }, 200);
      }
    },
    /** Slam: the doors jolt shut, and the fury blows outward. */
    async slam() {
      const L = doorL(), R = doorR();
      L.style.transition = R.style.transition = 'transform 0.12s ease-in';
      L.style.transform = R.style.transform = 'scaleX(0.7)';
      await U.wait(160);
      L.style.transform = R.style.transform = 'scaleX(1.03)';
      W.shockwave('#FF3A22', 1500, 1000, 34);
      Cam.shake(22, 700);
      await U.wait(140);
      L.style.transform = R.style.transform = '';
    }
  };

  /* ───────────────────── ambient life ───────────────────── */
  W.buildAmbient = function () {
    const L = W.L('ambient');
    // butterflies over the meadow
    for (let i = 0; i < 10; i++) {
      const [x, y] = [U.rand(150, 1450), U.rand(780, 900)];
      const g = svg('g', { transform: `translate(${x.toFixed(0)} ${y.toFixed(0)})` }, L);
      const fly = svg('g', { class: 'flutter-path' }, g);
      fly.style.animationDuration = `${U.rand(9, 16).toFixed(1)}s`;
      fly.style.animationDelay = `${(-U.rand(0, 10)).toFixed(1)}s`;
      const col = U.pick(['#FFF2A8', '#FFFFFF', '#F6B8D0', '#C9B8F0']);
      const w1 = svg('ellipse', { cx: -3, cy: 0, rx: 4.5, ry: 3, fill: col, class: 'wing' }, fly);
      const w2 = svg('ellipse', { cx: 3, cy: 0, rx: 4.5, ry: 3, fill: col, class: 'wing alt' }, fly);
    }
    // motes of light around the gate
    for (let i = 0; i < 26; i++) {
      const m = svg('circle', { cx: U.rand(560, 1040).toFixed(0), cy: U.rand(1400, 1900).toFixed(0), r: U.rand(1.2, 2.6).toFixed(1), fill: '#FFF6D0', class: 'mote' }, L);
      m.style.animationDuration = `${U.rand(6, 12).toFixed(1)}s`;
      m.style.animationDelay = `${(-U.rand(0, 12)).toFixed(1)}s`;
    }
    // mist drifting past the stairs
    for (let i = 0; i < 8; i++) {
      const m = svg('ellipse', { cx: U.rand(300, 1400).toFixed(0), cy: U.rand(2150, 3250).toFixed(0), rx: U.rand(200, 380).toFixed(0), ry: U.rand(24, 46).toFixed(0), fill: 'url(#g-mist)', class: 'mist-drift' }, L);
      m.style.animationDuration = `${U.rand(30, 60).toFixed(0)}s`;
      m.style.animationDelay = `${(-U.rand(0, 40)).toFixed(0)}s`;
    }
    // Hell flickers and sheds embers
    for (let i = 0; i < 12; i++) {
      const f = svg('ellipse', { cx: U.rand(0, 1600).toFixed(0), cy: U.rand(4200, 4380).toFixed(0), rx: U.rand(90, 220).toFixed(0), ry: U.rand(50, 110).toFixed(0), fill: 'url(#g-ember-glow)', class: 'flicker' }, L);
      f.style.animationDuration = `${U.rand(1.2, 3).toFixed(2)}s`;
      f.style.animationDelay = `${(-U.rand(0, 3)).toFixed(2)}s`;
    }
    for (let i = 0; i < 60; i++) {
      const e = svg('circle', { cx: U.rand(0, 1600).toFixed(0), cy: U.rand(4380, 4580).toFixed(0), r: U.rand(1, 2.6).toFixed(1), fill: U.pick(['#FF9A4A', '#FFC070', '#FF6A2A']), class: 'ember' }, L);
      e.style.animationDuration = `${U.rand(5, 11).toFixed(1)}s`;
      e.style.animationDelay = `${(-U.rand(0, 11)).toFixed(1)}s`;
      e.style.setProperty('--drift', `${U.rand(-80, 80).toFixed(0)}px`);
    }
  };

  /* ───────────────────── visitors ───────────────────── */
  const tint = (r, which) => r.root.setAttribute('filter', `url(#f-tint-${which})`);
  W.zoomFor = kind => U.clamp(2.05 - kind.height / 130, 1.15, 1.65);

  /** Spawn the visitor at the bottom of the visible stairs, already climbing out of the clouds. */
  W.spawnVisitor = function (kind) {
    const F = G.flights[2];
    const r = HG.rig.make(kind, W.L('creature'), F.xl + 70, S.flight(F));
    tint(r, 'dusk');
    return r;
  };

  /** Up three flights of the endless staircase, then across the platform to the doors. */
  W.climb = async function (r) {
    const F = G.flights;
    const z = W.zoomFor(r.kind);
    Cam.jump({ x: r.x - 80, y: r.y - 220, z: z * 0.85 });
    Cam.follow(() => ({ x: r.x, y: r.y - r.kind.height * 0.5 }), z, { stiff: 2.6, lead: -40 });
    r.pace = 1.75;
    const turn = () => U.wait(140);
    await r.walkTo(F[2].xt - 45, S.flight(F[2]));
    tint(r, 'dusk'); await turn();
    await r.walkTo(F[1].xt + 45, S.flight(F[1]));
    tint(r, 'gold'); await turn();
    await r.walkTo(G.gate.x - 20, S.flight(F[0]));
    r.pace = 1;
  };

  /** Accepted: the doors swing open, the visitor walks into the light, and we follow them up to Heaven. */
  W.admit = async function (r, visitor) {
    W.gate.pleased(true);
    W.gate.doors(true);
    W.shockwave('#FFF1C0', 1500, 1400, 30);
    setTimeout(() => W.shockwave('#FFB8E0', 1200, 1400, 18), 250);
    Cam.shake(8, 500);
    await U.wait(1100);
    await r.walkTo(G.gate.x, S.flat(1880));
    r.mode = 'carried';
    const y0 = r.y, s0 = r.s;
    await U.tween(1700, e => {
      r.y = y0 - 34 * e; r.s = s0 * (1 - 0.5 * e);
      r.root.style.opacity = String(1 - e);
    }, 'in');
    r.remove();
    await U.wait(400);
    // up through the clouds to Heaven
    await Cam.to({ x: 800, y: 700, z: 1.05 }, 2600);
    const [x] = W.meadowSpot(260, 1340);
    const res = HG.rig.make(visitor.kind, W.L('heaven-residents'), x, S.heaven);
    tint(res, 'gold');
    res.root.style.opacity = '0';
    U.burst(W.L('fx'), x, W.heavenY(x) - 40, { n: 30, colors: ['#FFF6D0', '#FFE7A0', '#FFFFFF'], spread: 60, upMin: 20, upMax: 90, fall: -20 });
    await U.tween(900, e => { res.root.style.opacity = String(e); });
    W.makeResident(res, visitor.title, S.heaven, 'heaven');
    W.gate.doors(false);
    W.gate.pleased(false);
    await Cam.to({ x: U.clamp(x, 500, 1100), y: W.heavenY(x) - 140, z: W.zoomFor(visitor.kind) * 0.9 }, 1400);
    await U.wait(800);
  };

  /** Refused: the gate flings them off the platform and they fall all the way to Hell. */
  W.reject = async function (r, visitor) {
    W.gate.angry(true);
    await U.wait(600);
    await W.gate.slam();
    const xEnd = U.rand(260, 640);
    r.fall(true);
    Cam.follow(() => ({ x: r.x, y: r.y - 30 }), 1.0, { stiff: 5.5, lead: 60 });
    const x0 = r.x, y0 = r.y;
    await U.tween(650, e => { r.x = x0 - 190 * e; r.y = y0 - 120 * Math.sin(e * Math.PI / 2); r.rot = -70 * e; }, 'out');
    W.gate.angry(false);
    tint(r, 'ember');
    const x1 = r.x, y1 = r.y, yEnd = W.hellY(xEnd);
    await U.tween(2800, (e, t) => { r.x = x1 + (xEnd - x1) * t; r.y = y1 + (yEnd - y1) * t * t; r.rot = -70 - 900 * t; }, 'linear');
    r.rot = 0; r.x = xEnd; r.y = yEnd;
    r.surface = S.hell; r.fall(false); r.replant();
    Cam.to({ x: U.clamp(xEnd, 500, 1100), y: yEnd - 160, z: 1.15 }, 700);
    Cam.shake(18, 700);
    U.burst(W.L('fx'), r.x, r.y, { n: 40, spread: 120, upMin: 40, upMax: 160, fall: 30 });
    U.burst(W.L('fx'), r.x, r.y, { n: 18, colors: ['#3A2422', '#5A3A34'], spread: 90, upMin: 10, upMax: 60, fall: 20, rMin: 2, rMax: 6 });
    W.makeResident(r, visitor.title, S.hell, 'hell');
    await U.wait(1300);
  };

  /** Residents live on: they wander back and forth, forever. Gravity can still lift them. */
  W.makeResident = function (r, name, surface, realm) {
    const layer = W.L(realm === 'heaven' ? 'heaven-residents' : 'hell-residents');
    const outer = svg('g', { class: 'persist resident', 'data-name': name, 'data-x': r.x.toFixed(0), 'data-y': (r.y - 60).toFixed(0) }, layer);
    const drift = svg('g', { class: 'drift' }, outer);
    drift.appendChild(r.root);
    r.surface = surface;
    const home = r.x;
    (async () => {
      while (r.alive) {
        await U.wait(U.rand(1200, 4200));
        if (!r.alive) break;
        await r.walkTo(U.clamp(home + U.rand(-200, 200), 140, 1460), surface);
      }
    })();
    const all = layer.querySelectorAll('.resident');
    if (all.length > 22) { const old = all[0]; HG.rig.live.forEach(x => { if (old.contains(x.root)) x.remove(); }); old.remove(); }
  };

  /* Persistent world state and the layers that hold changes. */
  W.persistentLayers = ['heaven-extras', 'heaven-residents', 'gate-extras', 'climb-extras', 'hell-extras', 'lava', 'hell-residents', 'anomalies', 'fx'];
  W.fresh = () => ({ lavaLevel: 0, frost: 0, counts: {} });
  HG.state = W.fresh();
  W.reset = function () {
    HG.rig.live.forEach(r => r.remove());
    W.persistentLayers.forEach(id => { W.L(id).innerHTML = ''; });
    W.L('creature').innerHTML = '';
    HG.state = W.fresh();
    W.gate.sleep();
  };

  HG.world = W;
})(window.HG);
