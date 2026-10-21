/* util.js — small helpers shared by every other file.
 * Everything hangs off one global namespace, HG, so the files can be plain <script>s.
 */
window.HG = window.HG || {};

(function (HG) {
  const NS = 'http://www.w3.org/2000/svg';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const U = {
    reducedMotion,

    /** Global pacing multiplier. 1 = solemn, 0.5 = brisk. Applied to waits and soul movement. */
    speed: 1,

    /** Create an SVG element with attributes and (optionally) append it to a parent. */
    svg(tag, attrs = {}, parent) {
      const el = document.createElementNS(NS, tag);
      for (const k in attrs) {
        if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== '') el.setAttribute(k, attrs[k]);
      }
      if (parent) parent.appendChild(el);
      return el;
    },

    rand(a, b) { return a + Math.random() * (b - a); },
    randInt(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    chance(p) { return Math.random() < p; },
    clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },

    /** Deterministic random generator, used so the static scenery looks the same each load. */
    seeded(seed) {
      let a = seed >>> 0;
      return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },

    /** Easing curves for tweens. */
    ease: {
      linear: t => t,
      inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
      out: t => 1 - Math.pow(1 - t, 3),
      in: t => t * t * t
    },

    /** Run fn(easedT, rawT) every frame for ms milliseconds (scaled by speed). Resolves at the end. */
    tween(ms, fn, ease = 'inOut', scaled = true) {
      const dur = Math.max(1, ms * (scaled ? U.speed : 1));
      const e = typeof ease === 'function' ? ease : U.ease[ease];
      return new Promise(resolve => {
        const t0 = performance.now();
        const step = now => {
          const t = Math.min(1, (now - t0) / dur);
          fn(e(t), t);
          if (t < 1) requestAnimationFrame(step); else resolve();
        };
        requestAnimationFrame(step);
      });
    },

    /** Promise-based pause, scaled by U.speed. */
    wait(ms) { return new Promise(r => setTimeout(r, ms * U.speed)); },

    /** Replace {placeholders} in a template with fields from an object (usually the soul). */
    fill(template, obj) {
      return template.replace(/\{(\w+)\}/g, (m, k) => (obj[k] !== undefined ? obj[k] : m));
    },

    /** Capitalise the first letter of a string. */
    cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); },

    /** Remove the oldest children of a group so a persistent layer never grows without bound. */
    trim(group, max, selector) {
      const items = selector ? group.querySelectorAll(selector) : group.children;
      const extra = items.length - max;
      for (let i = 0; i < extra; i++) items[i].remove();
    },

    /**
     * Throw a burst of particles that animate and then remove themselves.
     * o: { n, colors, spread, upMin, upMax, fall, rMin, rMax, delay, dur }
     */
    burst(parent, x, y, o = {}) {
      const n = o.n ?? 20;
      const colors = o.colors ?? ['#E0602F', '#F0A050', '#B4432A'];
      const spread = o.spread ?? 80;
      for (let i = 0; i < n; i++) {
        const c = U.svg('circle', { r: U.rand(o.rMin ?? 1.5, o.rMax ?? 4).toFixed(1), fill: U.pick(colors) }, parent);
        const dx = U.rand(-spread, spread);
        const up = U.rand(o.upMin ?? 60, o.upMax ?? 160);
        const kf = [
          { transform: `translate(${x}px, ${y}px)`, opacity: 1 },
          { transform: `translate(${x + dx * 0.6}px, ${y - up}px)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${x + dx}px, ${y + (o.fall ?? 40)}px)`, opacity: 0 }
        ];
        const a = c.animate(kf, {
          duration: U.rand(900, o.dur ?? 1700),
          delay: U.rand(0, o.delay ?? 300),
          easing: 'cubic-bezier(.2,.6,.4,1)',
          fill: 'both'
        });
        a.onfinish = () => c.remove();
      }
    }
  };

  HG.util = U;
})(window.HG);
