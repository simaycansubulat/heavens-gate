/* rig.js — the visitors: people and animals drawn in a soft storybook style, with real legs.
 *
 * Every leg has a thigh and a shin. Each frame the feet are planted on the ground (or on a
 * stair tread) and the knees are solved with two-bone inverse kinematics, so climbing looks
 * like climbing. Small animals hop from step to step instead; snails glide.
 *
 * ─── HOW TO ADD A CREATURE ───────────────────────────────────────────────────────────
 * Add an entry to KINDS with an id, a label ('a llama'), a height, a gait
 * ('walk' | 'hop' | 'glide'), a stride (34 or 68 world units), a speed, and build(r, h):
 *   h.part(d, fill)                       a filled, outlined shape on the body
 *   h.ellipse(cx, cy, rx, ry, fill)       likewise
 *   h.leg({ hip: [x, y], a, b, w, color, knee: +1 | -1, near: true|false, phase, foot })
 *   h.arm({ shoulder: [x, y], a, b, w, color, hand, near, phase })
 * Coordinates: facing right, feet on y = 0, up is negative y.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
(function (HG) {
  const U = HG.util, svg = U.svg, G = HG.geo;
  const INK = '#3B2A24';
  const TAU = Math.PI * 2;

  /* ───────────── drawing helpers given to build() ───────────── */
  function helpers(r) {
    const part = (d, fill, extra = {}, layer = r.body) => svg('path', { d, fill, stroke: INK, 'stroke-width': 1.3, 'stroke-linejoin': 'round', ...extra }, layer);
    const ellipse = (cx, cy, rx, ry, fill, extra = {}, layer = r.body) => svg('ellipse', { cx, cy, rx, ry, fill, stroke: INK, 'stroke-width': 1.3, ...extra }, layer);
    const dot = (cx, cy, rr, fill, layer = r.body) => svg('circle', { cx, cy, r: rr, fill }, layer);
    const leg = o => {
      const layer = o.near ? r.front : r.back;
      const g = svg('g', {}, layer);
      const outline = svg('path', { fill: 'none', stroke: INK, 'stroke-width': o.w + 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      const fill = svg('path', { fill: 'none', stroke: o.near ? o.color : shade(o.color, 0.82), 'stroke-width': o.w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      let foot = null;
      if (o.foot) foot = svg('ellipse', { rx: o.foot.rx, ry: o.foot.ry, fill: o.near ? o.foot.color : shade(o.foot.color, 0.82), stroke: INK, 'stroke-width': 1.2 }, g);
      r.legs.push({ ...o, outline, fill, footEl: foot, plant: null, from: null, to: null, swinging: false, wx: 0, wy: 0 });
    };
    const arm = o => {
      const layer = o.near ? r.front : r.back;
      const g = svg('g', {}, layer);
      const outline = svg('path', { fill: 'none', stroke: INK, 'stroke-width': o.w + 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      const fill = svg('path', { fill: 'none', stroke: o.near ? o.color : shade(o.color, 0.82), 'stroke-width': o.w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      const hand = svg('circle', { r: o.w * 0.55, fill: o.hand, stroke: INK, 'stroke-width': 1.1 }, g);
      r.arms.push({ ...o, outline, fill, hand });
    };
    return { part, ellipse, dot, leg, arm, layerFront: r.front, layerBack: r.back };
  }

  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.round(v * k));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  }

  /* ───────────── people ───────────── */
  function person(o) {
    return (r, h) => {
      const hip = -72, sh = -116, hy = -134;
      const legCol = o.dress ? o.skin : o.pants;
      h.leg({ hip: [-2, hip], a: 37, b: 37, w: o.dress ? 6 : 10, color: legCol, knee: 1, near: false, phase: 0.5, foot: { rx: 7.5, ry: 3.6, dx: 4, color: o.shoes } });
      h.leg({ hip: [2, hip], a: 37, b: 37, w: o.dress ? 6 : 10, color: legCol, knee: 1, near: true, phase: 0, foot: { rx: 7.5, ry: 3.6, dx: 4, color: o.shoes } });
      h.arm({ shoulder: [-2, sh], a: 24, b: 22, w: 7, color: o.sleeve || o.top, hand: o.skin, near: false, phase: 0 });
      h.arm({ shoulder: [2, sh], a: 24, b: 22, w: 7, color: o.sleeve || o.top, hand: o.skin, near: true, phase: 0.5 });
      if (o.coat) h.part(`M-14,${sh + 2} C-17,${hip + 10} -18,${hip + 24} -20,${hip + 34} L18,${hip + 34} C16,${hip + 24} 15,${hip + 10} 13,${sh + 2} Z`, o.coat);
      if (o.dress) h.part(`M-11,${hip - 20} L-24,${hip + 34} Q0,${hip + 40} 24,${hip + 34} L11,${hip - 20} Z`, o.dress);
      h.part(`M-12,${hip + 2} C-14,${hip - 24} -13,${sh + 6} -9,${sh - 2} Q0,${sh - 7} 9,${sh - 2} C13,${sh + 6} 14,${hip - 24} 12,${hip + 2} Z`, o.coat || o.top);
      svg('path', { d: `M-12,${hip + 2} C-14,${hip - 24} -13,${sh + 6} -9,${sh - 2} L-2,${sh - 4} L-4,${hip + 2} Z`, fill: '#000', opacity: 0.12 }, r.body);
      h.part(`M-4,${sh - 2} L-4,${hy + 10} L5,${hy + 10} L5,${sh - 2} Z`, o.skin);
      h.ellipse(2, hy, 13, 13.5, o.skin);
      h.part(`M13,${hy - 2} q4,3 1,6 Z`, o.skin);
      if (o.hair) h.part(o.hair(hy), o.hairColor);
      h.dot(8.5, hy - 1, 1.8, '#2A1E1A');
      svg('path', { d: `M6,${hy - 6} q3,-2 5,0`, stroke: '#2A1E1A', 'stroke-width': 1.1, fill: 'none' }, r.body);
      svg('circle', { cx: 6, cy: hy + 5, r: 3.2, fill: '#F08A80', opacity: 0.35 }, r.body);
      h.ellipse(-3, hy + 1, 2.6, 3.6, shade(o.skin, 0.92));
      if (o.beard) h.part(`M-2,${hy + 4} Q8,${hy + 20} 15,${hy + 4} Q8,${hy + 9} -2,${hy + 4} Z`, o.hairColor);
      if (o.hat) { h.part(`M-12,${hy - 9} L-10,${hy - 34} L14,${hy - 34} L16,${hy - 9} Z`, o.hat); h.part(`M-18,${hy - 9} L22,${hy - 9} L22,${hy - 5} L-18,${hy - 5} Z`, o.hat); }
      if (o.stoop) r.body.setAttribute('transform', `rotate(9 0 ${hip})`);
    };
  }
  const HAIR = {
    short: hy => `M-11,${hy - 2} C-12,${hy - 16} 0,${hy - 20} 12,${hy - 10} C10,${hy - 14} 4,${hy - 13} 0,${hy - 9} C-4,${hy - 8} -8,${hy - 4} -11,${hy - 2} Z`,
    bob: hy => `M-12,${hy + 8} C-16,${hy - 14} 2,${hy - 22} 14,${hy - 8} C10,${hy - 10} 6,${hy - 8} 4,${hy - 4} C0,${hy - 6} -4,${hy - 2} -4,${hy + 8} Z`,
    long: hy => `M-12,${hy + 26} C-20,${hy - 6} -8,${hy - 22} 8,${hy - 16} C14,${hy - 14} 15,${hy - 8} 14,${hy - 5} C8,${hy - 10} 2,${hy - 9} -2,${hy - 4} C-6,${hy + 4} -4,${hy + 18} -2,${hy + 26} Z`,
    bun: hy => `M-11,${hy - 1} C-12,${hy - 16} 2,${hy - 19} 12,${hy - 9} C6,${hy - 11} 0,${hy - 9} -3,${hy - 5} Z M-14,${hy - 14} a7,7 0 1,0 0.1,0 Z`,
    bald: hy => `M-11,${hy + 2} C-13,${hy - 4} -12,${hy - 7} -9,${hy - 8} L-7,${hy + 3} Z`
  };

  /* ───────────── animals ───────────── */
  const quad = (h, o) => {
    // far legs first, then near ones; diagonal pairs in phase
    const legs = [[o.back, false, 0.5], [o.front, false, 0.0], [o.back + 4, true, 0.0], [o.front + 4, true, 0.5]];
    legs.forEach(([x, near, ph]) => h.leg({ hip: [x, -o.hipH], a: o.a, b: o.b, w: o.w, color: o.color, knee: -1, near, phase: ph + (x > 0 ? 0.25 : 0), foot: o.hoof ? { rx: o.w * 0.6, ry: o.w * 0.35, dx: 1, color: o.hoof } : null }));
  };

  const KINDS = [
    { id: 'gardener', label: 'a gardener', height: 150, gait: 'walk', stride: 68, speed: 105, build: person({ skin: '#F1CDB0', pants: '#5E7A4A', top: '#E0B04A', shoes: '#5A3A2A', hair: HAIR.short, hairColor: '#6E4A2E' }) },
    { id: 'green-dress', label: 'a woman in a green dress', height: 150, gait: 'walk', stride: 68, speed: 100, build: person({ skin: '#E8B894', dress: '#5E9A6E', top: '#5E9A6E', shoes: '#7A3A2E', hair: HAIR.long, hairColor: '#A6522E' }) },
    { id: 'grandpa', label: 'an old man', height: 145, gait: 'walk', stride: 68, speed: 70, build: person({ skin: '#F0D2BC', pants: '#8C8A92', top: '#9A6E4A', shoes: '#3A2E2A', hair: HAIR.bald, hairColor: '#F2F0EA', stoop: true }) },
    { id: 'grandma', label: 'an old woman', height: 145, gait: 'walk', stride: 68, speed: 72, build: person({ skin: '#F2D6C2', dress: '#8E7AA8', top: '#B9A4D0', coat: '#B9A4D0', shoes: '#4A3A3A', hair: HAIR.bun, hairColor: '#D8D6D2' }) },
    { id: 'raincoat', label: 'a woman in a yellow raincoat', height: 150, gait: 'walk', stride: 68, speed: 108, build: person({ skin: '#C9946E', pants: '#3E5A86', top: '#F2C23E', coat: '#F2C23E', shoes: '#2E2A2A', hair: HAIR.bob, hairColor: '#2A2224' }) },
    { id: 'bearded', label: 'a bearded man', height: 152, gait: 'walk', stride: 68, speed: 100, build: person({ skin: '#B8805A', pants: '#3A3440', top: '#B8423A', shoes: '#2E2420', hair: HAIR.short, hairColor: '#2E2018', beard: true }) },
    { id: 'gentleman', label: 'a gentleman in a top hat', height: 172, gait: 'walk', stride: 68, speed: 96, build: person({ skin: '#F3D6BE', pants: '#2E2E3A', top: '#3A3A4E', coat: '#3A3A4E', shoes: '#1E1A1E', hair: HAIR.short, hairColor: '#8A8A8A', hat: '#2A2630' }) },
    {
      id: 'dog', label: 'a dog', height: 62, gait: 'walk', stride: 34, speed: 95, build(r, h) {
        quad(h, { back: -20, front: 16, hipH: 33, a: 17, b: 17, w: 6.5, color: '#C8955A', hoof: '#6E4A2E' });
        h.part('M-26,-44 C-40,-54 -42,-66 -36,-72', 'none', { stroke: INK, 'stroke-width': 6.5, 'stroke-linecap': 'round' });
        svg('path', { d: 'M-26,-44 C-40,-54 -42,-66 -36,-72', stroke: '#C8955A', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, r.body);
        h.ellipse(0, -40, 28, 12, '#C8955A');
        h.ellipse(10, -36, 10, 7, '#F4E6D0', { stroke: 'none' });
        h.part('M18,-44 C22,-58 30,-60 36,-56 L48,-52 C52,-50 50,-44 46,-44 L36,-42 C30,-38 22,-38 18,-44 Z', '#C8955A');
        h.part('M28,-60 C22,-64 18,-56 22,-46 C26,-50 28,-54 28,-60 Z', '#8A5A32');
        h.dot(37, -53, 1.8, '#2A1E1A'); h.dot(49, -50, 2.4, '#2A1E1A');
      }
    },
    {
      id: 'horse', label: 'a horse', height: 150, gait: 'walk', stride: 68, speed: 110, build(r, h) {
        quad(h, { back: -36, front: 30, hipH: 80, a: 40, b: 42, w: 9, color: '#9A5A32', hoof: '#3A2418' });
        svg('path', { d: 'M-52,-94 C-66,-84 -70,-62 -64,-46', stroke: '#3A2418', 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'round' }, r.body);
        h.ellipse(0, -90, 54, 21, '#9A5A32');
        h.part('M30,-100 L46,-140 L60,-136 L52,-86 Z', '#9A5A32');
        h.part('M46,-142 L76,-120 Q82,-112 74,-108 L56,-118 Z', '#9A5A32');
        h.part('M34,-102 Q38,-128 46,-142 L42,-142 Q32,-124 30,-100 Z', '#3A2418');
        h.part('M48,-144 L50,-154 L55,-142 Z', '#9A5A32');
        h.dot(60, -128, 2, '#2A1E1A');
      }
    },
    {
      id: 'deer', label: 'a stag', height: 165, gait: 'walk', stride: 68, speed: 105, build(r, h) {
        quad(h, { back: -28, front: 24, hipH: 74, a: 38, b: 40, w: 5.5, color: '#A6744A', hoof: '#3A2A20' });
        h.ellipse(0, -82, 42, 15, '#A6744A');
        h.ellipse(0, -74, 30, 6, '#F2E6D2', { stroke: 'none' });
        h.part('M26,-90 L40,-126 L52,-122 L40,-80 Z', '#A6744A');
        h.part('M40,-128 L62,-116 Q66,-110 60,-108 L44,-114 Z', '#A6744A');
        svg('path', { d: 'M44,-128 L36,-156 M40,-144 L28,-150 M38,-152 L44,-168 M50,-126 L58,-154 M56,-144 L68,-150', stroke: '#7A5A3A', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, r.body);
        h.dot(50, -120, 1.8, '#2A1E1A');
        h.ellipse(-42, -88, 5, 4, '#F2E6D2');
      }
    },
    {
      id: 'cow', label: 'a cow', height: 110, gait: 'walk', stride: 34, speed: 70, build(r, h) {
        quad(h, { back: -40, front: 34, hipH: 52, a: 26, b: 28, w: 9, color: '#F2EEE6', hoof: '#4A3A34' });
        h.part('M-56,-90 Q-58,-52 -42,-50 L42,-50 Q58,-52 56,-90 Q54,-98 36,-96 L-36,-96 Q-54,-98 -56,-90 Z', '#F2EEE6');
        h.part('M-30,-94 C-20,-84 -24,-70 -38,-68 C-44,-78 -42,-90 -30,-94 Z', '#3A3232', { stroke: 'none' });
        h.part('M8,-96 C20,-90 22,-74 10,-66 C0,-74 0,-90 8,-96 Z', '#3A3232', { stroke: 'none' });
        h.part('M50,-94 L60,-66 L74,-70 L70,-96 Z', '#F2EEE6');
        h.ellipse(70, -68, 11, 8, '#F2B4A8');
        svg('path', { d: 'M56,-96 Q52,-110 42,-108 M68,-96 Q76,-110 84,-106', stroke: '#E8DCC0', 'stroke-width': 3.5, fill: 'none', 'stroke-linecap': 'round' }, r.body);
        h.dot(64, -86, 2, '#2A1E1A');
        svg('path', { d: 'M-56,-86 Q-66,-70 -62,-48', stroke: INK, 'stroke-width': 2.5, fill: 'none' }, r.body);
      }
    },
    {
      id: 'bear', label: 'a bear', height: 95, gait: 'walk', stride: 34, speed: 70, build(r, h) {
        quad(h, { back: -30, front: 26, hipH: 36, a: 18, b: 19, w: 13, color: '#7A5232', hoof: '#4A3020' });
        h.ellipse(0, -54, 48, 28, '#7A5232');
        h.ellipse(48, -64, 17, 16, '#7A5232');
        h.ellipse(60, -60, 9, 7, '#B88A62');
        h.dot(66, -62, 2.6, '#2A1E1A'); h.dot(52, -68, 2, '#2A1E1A');
        h.ellipse(40, -78, 5.5, 5.5, '#7A5232');
      }
    },
    {
      id: 'sheep', label: 'a sheep', height: 72, gait: 'walk', stride: 34, speed: 68, build(r, h) {
        quad(h, { back: -18, front: 16, hipH: 34, a: 16, b: 18, w: 4.5, color: '#3A3236' });
        [[-22, -50, 13], [-10, -60, 15], [6, -60, 15], [20, -52, 13], [-16, -42, 12], [0, -40, 13], [16, -42, 12]].forEach(([x, y, rr]) => h.ellipse(x, y, rr, rr, '#F4EEE2'));
        h.ellipse(34, -56, 9, 12, '#3A3236', { transform: 'rotate(25 34 -56)' });
        h.ellipse(28, -64, 6, 3, '#3A3236', { transform: 'rotate(-20 28 -64)' });
        h.dot(37, -58, 1.6, '#F4EEE2');
      }
    },
    {
      id: 'fox', label: 'a fox', height: 58, gait: 'walk', stride: 34, speed: 100, build(r, h) {
        quad(h, { back: -16, front: 14, hipH: 28, a: 15, b: 16, w: 4.5, color: '#2E2420' });
        h.ellipse(-40, -40, 22, 9, '#D9702E', { transform: 'rotate(-20 -40 -40)' });
        h.ellipse(-56, -46, 6, 5, '#FFF4E8');
        h.ellipse(0, -34, 26, 10, '#D9702E');
        h.part('M20,-40 L32,-54 L52,-42 L32,-34 Z', '#D9702E');
        h.part('M34,-40 L52,-42 L36,-34 Z', '#FFF4E8', { stroke: 'none' });
        h.part('M26,-50 L27,-64 L34,-53 Z', '#D9702E'); h.part('M32,-54 L38,-64 L38,-50 Z', '#D9702E');
        h.dot(38, -46, 1.6, '#2A1E1A'); h.dot(52, -42, 1.8, '#2A1E1A');
      }
    },
    {
      id: 'elephant', label: 'an elephant', height: 160, gait: 'walk', stride: 34, speed: 60, build(r, h) {
        quad(h, { back: -40, front: 32, hipH: 70, a: 34, b: 36, w: 18, color: '#9C9AA6', hoof: '#7C7A86' });
        h.ellipse(0, -102, 66, 42, '#9C9AA6');
        h.ellipse(62, -114, 28, 28, '#9C9AA6');
        h.ellipse(48, -110, 18, 25, '#8C8A98');
        svg('path', { d: 'M84,-104 C96,-80 92,-52 100,-38', stroke: INK, 'stroke-width': 14, fill: 'none', 'stroke-linecap': 'round' }, r.body);
        svg('path', { d: 'M84,-104 C96,-80 92,-52 100,-38', stroke: '#9C9AA6', 'stroke-width': 11, fill: 'none', 'stroke-linecap': 'round' }, r.body);
        svg('path', { d: 'M78,-96 Q88,-84 96,-90', stroke: '#F4EEE2', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, r.body);
        h.dot(70, -122, 2.4, '#2A1E1A');
      }
    },
    {
      id: 'rabbit', label: 'a rabbit', height: 52, gait: 'hop', stride: 34, speed: 0, build(r, h) {
        h.ellipse(-4, -16, 16, 13, '#D8C8B8');
        h.ellipse(-20, -18, 6, 6, '#FFFFFF');
        h.ellipse(12, -24, 9, 9, '#D8C8B8');
        h.ellipse(8, -44, 4, 13, '#D8C8B8', { transform: 'rotate(-12 8 -44)' });
        h.ellipse(14, -44, 3.5, 12, '#D8C8B8', { transform: 'rotate(8 14 -44)' });
        h.ellipse(-2, -4, 10, 4, '#C8B8A8');
        h.dot(16, -25, 1.8, '#2A1E1A');
        svg('circle', { cx: 13, cy: -20, r: 2.4, fill: '#F08A80', opacity: 0.4 }, r.body);
      }
    },
    {
      id: 'cat', label: 'a cat', height: 50, gait: 'hop', stride: 34, speed: 0, build(r, h) {
        svg('path', { d: 'M-18,-22 C-36,-28 -36,-54 -24,-58', stroke: INK, 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }, r.body);
        svg('path', { d: 'M-18,-22 C-36,-28 -36,-54 -24,-58', stroke: '#8A8A96', 'stroke-width': 3.6, fill: 'none', 'stroke-linecap': 'round' }, r.body);
        h.part('M-16,0 L-14,-14 L-8,0 Z M8,0 L10,-14 L16,0 Z', '#8A8A96');
        h.ellipse(0, -18, 20, 10, '#8A8A96');
        h.ellipse(20, -30, 9, 8.5, '#8A8A96');
        h.part('M14,-36 L15,-46 L20,-38 Z', '#8A8A96'); h.part('M21,-38 L26,-46 L27,-35 Z', '#8A8A96');
        h.dot(24, -31, 1.6, '#3A5A2A');
      }
    },
    {
      id: 'goose', label: 'a goose', height: 88, gait: 'hop', stride: 34, speed: 0, build(r, h) {
        h.part('M-2,0 L-2,-18 M6,0 L6,-18', 'none', { stroke: '#E08A2E', 'stroke-width': 3 });
        h.part('M-8,0 L2,0 M0,0 L10,0', 'none', { stroke: '#E08A2E', 'stroke-width': 3, 'stroke-linecap': 'round' });
        h.ellipse(0, -30, 24, 14, '#F7F4EE', { transform: 'rotate(-8 0 -30)' });
        h.part('M-20,-34 L-34,-42 L-22,-26 Z', '#F7F4EE');
        svg('path', { d: 'M14,-38 C24,-52 18,-72 26,-84', stroke: INK, 'stroke-width': 10.6, fill: 'none', 'stroke-linecap': 'round' }, r.body);
        svg('path', { d: 'M14,-38 C24,-52 18,-72 26,-84', stroke: '#F7F4EE', 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round' }, r.body);
        h.ellipse(30, -86, 8.5, 6.5, '#F7F4EE');
        h.part('M36,-88 L48,-84 L36,-81 Z', '#E08A2E');
        h.dot(31, -88, 1.5, '#2A1E1A');
      }
    },
    {
      id: 'chicken', label: 'a chicken', height: 52, gait: 'hop', stride: 34, speed: 0, build(r, h) {
        h.part('M-2,0 L-2,-12 M4,0 L4,-12', 'none', { stroke: '#E8A83A', 'stroke-width': 2.4 });
        h.ellipse(0, -22, 17, 13, '#C8743A');
        h.part('M-14,-26 L-26,-46 L-10,-32 Z', '#7A3A1E');
        h.ellipse(14, -38, 7.5, 7.5, '#C8743A');
        h.part('M9,-45 q3,-8 6,-2 q3,-6 5,1 Z', '#D8322A');
        h.part('M20,-40 L28,-37 L20,-35 Z', '#E8A83A');
        h.dot(16, -40, 1.5, '#2A1E1A');
      }
    },
    {
      id: 'penguin', label: 'a penguin', height: 82, gait: 'hop', stride: 34, speed: 0, build(r, h) {
        h.ellipse(0, -36, 17, 34, '#2E3440');
        h.ellipse(5, -34, 11, 27, '#F6F4EE', { stroke: 'none' });
        h.ellipse(2, -74, 12, 12, '#2E3440');
        h.part('M12,-76 L24,-72 L12,-69 Z', '#F2A83A');
        h.dot(8, -77, 1.6, '#FFFFFF');
        h.ellipse(-12, -40, 5, 17, '#2E3440', { transform: 'rotate(12 -12 -40)' });
        h.ellipse(-4, -1, 8, 3, '#F2A83A'); h.ellipse(8, -1, 8, 3, '#F2A83A');
      }
    },
    {
      id: 'snail', label: 'a snail', height: 40, gait: 'glide', stride: 34, speed: 26, build(r, h) {
        h.part('M-30,0 Q-30,-8 -18,-8 L22,-8 Q32,-10 34,-22 L38,-28 L36,-16 Q40,-6 44,-2 L44,0 Z', '#D8C8A0');
        h.ellipse(-4, -24, 20, 19, '#C8823E');
        svg('path', { d: 'M-4,-24 m-12,0 a12,12 0 1,1 12,12 a8,8 0 1,1 -6,-10', stroke: '#8A4E22', 'stroke-width': 2, fill: 'none' }, r.body);
        svg('path', { d: 'M34,-22 L30,-36 M38,-24 L40,-38', stroke: INK, 'stroke-width': 1.6 }, r.body);
        h.dot(30, -37, 2, '#2A1E1A'); h.dot(40, -39, 2, '#2A1E1A');
      }
    }
  ];

  /* ───────────── surfaces the walkers stand on ───────────── */
  const S = {};
  S.flat = y => ({ y: () => y, snap: null });
  S.heaven = { y: x => G.heavenGround.base + 14 * Math.sin(x / 210) + 8 * Math.sin(x / 97 + 1.0), snap: null };
  S.hell = { y: x => G.hellGround.base + 6 * Math.sin(x / 180), snap: null };
  /** A stair flight, with the landings beyond each end treated as flat. */
  S.flight = f => ({
    y: x => {
      const k = Math.floor((x - f.xl) * f.dir / G.RUN);
      if (k < 0) return f.yl;
      if (k >= G.N) return f.yt;
      return f.yl - (k + 1) * G.RISE;
    },
    snap: x => {
      const k = Math.floor((x - f.xl) * f.dir / G.RUN);
      if (k < 0 || k >= G.N) return x;
      return f.xl + f.dir * (k + 0.5) * G.RUN;
    }
  });

  /* ───────────── maths ───────────── */
  function ik(hx, hy, fx, fy, a, b, dir) {
    let dx = fx - hx, dy = fy - hy, d = Math.hypot(dx, dy);
    const max = a + b - 0.6;
    if (d > max) { fx = hx + dx / d * max; fy = hy + dy / d * max; dx = fx - hx; dy = fy - hy; d = max; }
    d = Math.max(d, Math.abs(a - b) + 0.6);
    const th = Math.atan2(dy, dx);
    const al = Math.acos(U.clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
    const k = th - dir * al;
    return { kx: hx + a * Math.cos(k), ky: hy + a * Math.sin(k), fx, fy };
  }
  const frac = v => v - Math.floor(v);

  /* ───────────── the rig ───────────── */
  const live = new Set();

  const proto = {
    toWorld(lx, ly) {
      const c = Math.cos(this.rot * Math.PI / 180), s = Math.sin(this.rot * Math.PI / 180);
      const px = lx * this.facing * this.s, py = ly * this.s;
      return { x: this.x + px * c - py * s, y: this.y + px * s + py * c };
    },
    toLocal(wx, wy) {
      const c = Math.cos(this.rot * Math.PI / 180), s = Math.sin(this.rot * Math.PI / 180);
      const dx = wx - this.x, dy = wy - this.y;
      const qx = dx * c + dy * s, qy = -dx * s + dy * c;
      return { x: qx / (this.facing * this.s), y: qy / this.s };
    },
    /** Walk (or hop, or glide) to world x along a surface. Resolves on arrival. */
    walkTo(tx, surface) {
      if (surface) this.surface = surface;
      const dir = Math.sign(tx - this.x) || this.facing;
      if (dir !== this.facing) { this.facing = dir; }
      this.target = tx;
      this.mode = this.kind.gait === 'hop' ? 'hop' : this.kind.gait === 'glide' ? 'glide' : 'walk';
      return new Promise(res => { this.resolve = res; });
    },
    stop() { this.mode = 'idle'; this.target = null; if (this.resolve) { const r = this.resolve; this.resolve = null; r(); } },
    remove() { this.alive = false; live.delete(this); this.root.remove(); },

    step(dt) {
      const k = this.kind;
      this.t += dt;
      if (this.mode === 'walk' || this.mode === 'glide') {
        const sp = (k.speed || 90) * (this.pace || 1) / U.speed;
        const remaining = (this.target - this.x) * this.facing;
        const d = Math.min(Math.max(remaining, 0), sp * dt);
        this.x += this.facing * d;
        this.phase += d / k.stride;
        if (remaining - d <= 0.3) { this.x = this.target; this.stop(); }
      } else if (this.mode === 'hop') {
        if (!this.hop) {
          const remaining = (this.target - this.x) * this.facing;
          if (remaining <= 0.3) { this.stop(); }
          else {
            let nx = this.x + this.facing * Math.min(k.stride, remaining);
            if (this.surface.snap) nx = this.surface.snap(nx);
            if ((nx - this.x) * this.facing <= 0.5) nx = this.x + this.facing * Math.min(k.stride, remaining);
            this.hop = { x0: this.x, y0: this.y, x1: nx, y1: this.surface.y(nx), t: 0, dur: 0.34 / (this.pace || 1) };
          }
        }
        if (this.hop) {
          const h = this.hop;
          h.t += dt / U.speed;
          const p = Math.min(1, h.t / h.dur);
          this.x = h.x0 + (h.x1 - h.x0) * p;
          const lift = 14 + Math.max(0, h.y0 - h.y1);
          this.hopY = h.y0 + (h.y1 - h.y0) * p - Math.sin(p * Math.PI) * lift;
          if (p >= 1) { this.hop = null; this.hopY = null; this.hopRest = 0.08 / (this.pace || 1); }
        } else if (this.hopRest > 0) this.hopRest -= dt;
      }
      // height: follow the surface under the body, smoothed (hoppers use their arc)
      const surf = this.surface;
      if (this.mode === 'hop' && this.hopY != null) this.y = this.hopY;
      else if (this.mode !== 'fall' && this.mode !== 'carried') {
        const span = Math.max(12, k.stride * 0.5);
        const ty = k.gait === 'walk' ? (surf.y(this.x - span * 0.5) + surf.y(this.x + span * 0.5)) / 2 : surf.y(this.x);
        this.y += (ty - this.y) * Math.min(1, dt * (k.gait === 'glide' ? 6 : 10));
        // four-legged walkers tilt with the slope
        if (k.gait === 'walk' && this.legs.length === 4) {
          const sl = (surf.y(this.x + 30 * this.facing) - surf.y(this.x - 30 * this.facing)) / 60;
          const target = Math.atan(sl) * 180 / Math.PI * this.facing * 0.42;
          this.rot += (target - this.rot) * Math.min(1, dt * 6);
        }
      }
      this.updateFeet(dt);
    },

    updateFeet(dt) {
      const k = this.kind, surf = this.surface;
      if (this.mode === 'fall') {
        this.legs.forEach((l, i) => { const p = this.toWorld(l.hip[0] + Math.sin(this.t * 14 + i * 2) * l.a * 0.6, l.hip[1] + (l.a + l.b) * 0.8); l.wx = p.x; l.wy = p.y; });
        return;
      }
      if (k.gait !== 'walk' || this.mode === 'carried') {
        // hoppers, gliders and anyone being carried: feet tuck under the body
        this.legs.forEach(l => { const p = this.toWorld(l.hip[0], -2); l.wx = p.x; l.wy = p.y; });
        return;
      }
      const duty = 0.6;
      const walking = this.mode === 'walk';
      this.legs.forEach(l => {
        const hipW = this.toWorld(l.hip[0], l.hip[1]);
        if (!walking) {
          // settle: a foot left mid-air comes down where it is
          if (l.swinging) { l.swinging = false; l.plant = l.to; }
          l.wx = l.plant.x; l.wy = l.plant.y;
          return;
        }
        const p = frac(this.phase + l.phase);
        if (p >= duty && !l.swinging) {
          l.swinging = true;
          l.from = { ...l.plant };
          let tx = hipW.x + this.facing * k.stride * (1 - duty / 2);
          if (surf.snap) tx = surf.snap(tx);
          l.to = { x: tx, y: surf.y(tx) };
        }
        if (l.swinging && p < duty) { l.swinging = false; l.plant = l.to; }
        if (l.swinging) {
          const t = U.ease.inOut((p - duty) / (1 - duty));
          const lift = 9 + Math.max(0, l.from.y - l.to.y) * 0.9;
          l.wx = l.from.x + (l.to.x - l.from.x) * t;
          l.wy = l.from.y + (l.to.y - l.from.y) * t - Math.sin(t * Math.PI) * lift;
        } else { l.wx = l.plant.x; l.wy = l.plant.y; }
      });
    },

    pose() {
      const k = this.kind;
      const walking = this.mode === 'walk';
      this.bob = k.gait === 'walk' ? (walking ? -Math.abs(Math.sin(this.phase * TAU)) * 2.4 : Math.sin(this.t * 2) * 0.6) : 0;
      this.root.setAttribute('transform', `translate(${this.x.toFixed(1)} ${this.y.toFixed(1)}) rotate(${this.rot.toFixed(2)}) scale(${(this.facing * this.s).toFixed(3)} ${this.s.toFixed(3)})`);
      this.body.style.transform = `translateY(${this.bob.toFixed(2)}px)`;
      this.legs.forEach(l => {
        const hx = l.hip[0], hy = l.hip[1] + this.bob;
        const f = this.toLocal(l.wx, l.wy);
        const s = ik(hx, hy, f.x, f.y, l.a, l.b, l.knee);
        const d = `M${hx.toFixed(1)},${hy.toFixed(1)} L${s.kx.toFixed(1)},${s.ky.toFixed(1)} L${s.fx.toFixed(1)},${s.fy.toFixed(1)}`;
        l.outline.setAttribute('d', d); l.fill.setAttribute('d', d);
        if (l.footEl) { l.footEl.setAttribute('cx', (s.fx + (l.foot.dx || 0)).toFixed(1)); l.footEl.setAttribute('cy', (s.fy - l.foot.ry * 0.4).toFixed(1)); }
      });
      const swing = walking ? Math.sin(this.phase * TAU) : this.mode === 'fall' ? Math.sin(this.t * 16) * 2 : 0;
      this.arms.forEach((a, i) => {
        const ang = Math.PI / 2 + (i % 2 ? -1 : 1) * swing * 0.42;
        const sx = a.shoulder[0], sy = a.shoulder[1] + this.bob;
        const ex = sx + a.a * Math.cos(ang), ey = sy + a.a * Math.sin(ang);
        const fa = ang - 0.35;
        const hx = ex + a.b * Math.cos(fa), hy = ey + a.b * Math.sin(fa);
        const d = `M${sx.toFixed(1)},${sy.toFixed(1)} L${ex.toFixed(1)},${ey.toFixed(1)} L${hx.toFixed(1)},${hy.toFixed(1)}`;
        a.outline.setAttribute('d', d); a.fill.setAttribute('d', d);
        a.hand.setAttribute('cx', hx.toFixed(1)); a.hand.setAttribute('cy', hy.toFixed(1));
      });
      if (this.kind.gait === 'glide') this.inner.setAttribute('transform', `scale(${(1 + Math.sin(this.t * 6) * 0.03).toFixed(3)} 1)`);
    }
  };

  /** Put every foot back on the ground under its hip (after a fall or a teleport). */
  proto.replant = function () {
    this.legs.forEach(l => { const p = this.toWorld(l.hip[0], 0); const px = this.surface.snap ? this.surface.snap(p.x) : p.x; l.plant = { x: px, y: this.surface.y(px) }; l.swinging = false; l.wx = l.plant.x; l.wy = l.plant.y; });
  };

  /** Free movement (thrown, falling): give the rig no surface and drive x, y, rot yourself. */
  proto.fall = function (on) { this.mode = on ? 'fall' : 'idle'; };

  function make(kind, layer, x, surface) {
    const r = Object.create(proto);
    const root = svg('g', { class: 'creature' }, layer);
    const inner = svg('g', {}, root);
    Object.assign(r, { kind, root, inner, back: svg('g', {}, inner), body: svg('g', {}, inner), front: svg('g', {}, inner),
      legs: [], arms: [], x, y: 0, s: 1, rot: 0, facing: 1, bob: 0, phase: 0, mode: 'idle', surface, target: null,
      resolve: null, hop: null, hopY: null, hopRest: 0, alive: true, t: Math.random() * 10 });
    kind.build(r, helpers(r));
    r.y = surface.y(x);
    r.legs.forEach(l => { const p = r.toWorld(l.hip[0], 0); const px = surface.snap ? surface.snap(p.x) : p.x; l.plant = { x: px, y: surface.y(px) }; l.wx = l.plant.x; l.wy = l.plant.y; });
    live.add(r);
    r.pose();
    return r;
  }

  // one loop drives every rig in the world
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    live.forEach(r => { if (r.mode !== 'fall' && r.mode !== 'carried') r.step(dt); else { r.t += dt; r.updateFeet(dt); } r.pose(); });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  HG.rig = { KINDS, make, surfaces: S, live, pick: () => U.pick(KINDS) };
})(window.HG);
