/* camera.js — moves the tall world strip so the viewer sees whatever matters right now.
 *
 *   HG.camera.to({ x, y, z }, ms)       glide to a point (z = zoom, 1 fills the screen with one frame)
 *   HG.camera.follow(() => ({x, y}), z)  keep something in view (the climber, a falling body)
 *   HG.camera.shake(strength, ms)        rattle the view
 */
(function (HG) {
  const U = HG.util;
  const WORLD_W = 1600, WORLD_H = 4600, FRAME_H = 1000;

  const C = { x: 800, y: 1620, z: 1 };
  let tween = null, follow = null, shakeUntil = 0, shakeAmp = 0, last = performance.now();
  const world = () => document.getElementById('world');

  function base() { return Math.max(innerWidth / WORLD_W, innerHeight / FRAME_H); }

  function apply(now) {
    const s = base() * C.z;
    const vw = innerWidth, vh = innerHeight;
    const hw = vw / 2 / s, hh = vh / 2 / s;
    const cx = hw * 2 >= WORLD_W ? WORLD_W / 2 : U.clamp(C.x, hw, WORLD_W - hw);
    const cy = hh * 2 >= WORLD_H ? WORLD_H / 2 : U.clamp(C.y, hh, WORLD_H - hh);
    let sx = 0, sy = 0;
    if (now < shakeUntil) {
      const k = (shakeUntil - now) / 600;
      sx = (Math.random() - 0.5) * shakeAmp * Math.min(1, k) * 2;
      sy = (Math.random() - 0.5) * shakeAmp * Math.min(1, k) * 2;
    }
    world().style.transform = `translate3d(${(vw / 2 - cx * s + sx).toFixed(1)}px, ${(vh / 2 - cy * s + sy).toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
    const dot = document.getElementById('loc-dot');
    if (dot) dot.style.top = `${(cy / WORLD_H * 100).toFixed(2)}%`;
    C.viewY = cy;
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (tween) {
      const t = Math.min(1, (now - tween.t0) / tween.dur);
      const e = U.ease.inOut(t);
      C.x = tween.a.x + (tween.b.x - tween.a.x) * e;
      C.y = tween.a.y + (tween.b.y - tween.a.y) * e;
      C.z = tween.a.z + (tween.b.z - tween.a.z) * e;
      if (t >= 1) { const r = tween.resolve; tween = null; r(); }
    } else if (follow) {
      const p = follow.get();
      const k = 1 - Math.exp(-dt * follow.stiff);
      C.x += (p.x - C.x) * k;
      C.y += (p.y + follow.lead - C.y) * k;
      C.z += (follow.z - C.z) * k;
    }
    apply(now);
    requestAnimationFrame(frame);
  }

  const Cam = {
    state: C,
    to(target, ms = 1500) {
      follow = null;
      if (tween) tween.resolve();
      const b = { x: target.x ?? C.x, y: target.y ?? C.y, z: target.z ?? C.z };
      const dist = Math.hypot(b.x - C.x, b.y - C.y);
      const dur = Math.max(300, (ms === 'auto' ? 700 + dist * 0.75 : ms) * U.speed);
      return new Promise(resolve => { tween = { a: { ...C }, b, t0: performance.now(), dur, resolve }; });
    },
    follow(get, z = 1.3, { stiff = 4, lead = -40 } = {}) {
      if (tween) { tween.resolve(); tween = null; }
      follow = { get, z, stiff, lead };
    },
    stop() { follow = null; },
    shake(amp = 14, ms = 900) { shakeAmp = amp; shakeUntil = performance.now() + ms; },
    jump(target) { follow = null; tween = null; Object.assign(C, target); }
  };

  addEventListener('resize', () => apply(performance.now()));
  requestAnimationFrame(frame);
  HG.camera = Cam;
})(window.HG);
