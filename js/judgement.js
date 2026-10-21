/* judgement.js — one visitor, start to finish:
 *   climb the endless stairs → the gate wakes, says hello, and thinks aloud in a child’s voice →
 *   Heaven (doors open, up into the meadows) or Hell (thrown off the platform, all the way down) →
 *   exactly one environmental event, wherever it happens, announced by a deep narrator voice.
 */
(function (HG) {
  const U = HG.util, W = HG.world, D = HG.data, UI = HG.ui, Cam = HG.camera;
  const stats = { total: 0, heaven: 0, hell: 0 };
  HG.stats = stats;

  function pickCount() {
    let r = Math.random();
    for (let i = 0; i < D.thoughtCountWeights.length; i++) if ((r -= D.thoughtCountWeights[i]) < 0) return i + 1;
    return 1;
  }

  function decide(score, v) {
    let verdict, pool;
    if (score === 0) {
      verdict = U.chance(0.5) ? 'heaven' : 'hell';
      pool = D.explanations[verdict === 'heaven' ? 'coinHeaven' : 'coinHell'];
    } else if (U.chance(D.contrarianChance)) {
      verdict = score > 0 ? 'hell' : 'heaven';
      pool = D.explanations[verdict === 'heaven' ? 'heavenDespite' : 'hellDespite'];
    } else {
      verdict = score > 0 ? 'heaven' : 'hell';
      pool = D.explanations[verdict];
    }
    return { verdict, why: U.cap(U.fill(U.pick(pool), v)) };
  }

  const fields = v => ({ ...v, kind: v.kindLabel });

  /** The gate speaks: subtitles, a child’s voice, and doors that part with every word. */
  async function gateSays(text, cls = '') {
    W.gate.talking(true);
    await UI.say('The gate', text, { cls: 'gate ' + cls, voice: 'gate' });
    W.gate.talking(false);
  }

  HG.judge = async function () {
    const v = D.makeVisitor();
    UI.visitor(v);
    UI.hush();

    // 1. The climb.
    const r = W.spawnVisitor(v.kind);
    UI.say('The endless staircase', `${v.title}, is climbing.`, { type: false, cls: 'quiet' });
    await W.climb(r);

    // 2. The gate wakes and says hello (once).
    Cam.to({ x: 800, y: 1640, z: 1.05 }, 1200);
    W.gate.wake();
    await U.wait(900);
    await gateSays(U.pick(D.greetings));
    await U.wait(350);

    // 3. Thinking aloud.
    let score = 0;
    for (const t of D.pickThoughts(pickCount())) {
      await gateSays(U.cap(U.fill(t.text, fields(v))));
      score = t.flip ? (score === 0 ? U.pick([-2, 2]) : -score) : score + t.lean;
      await U.wait(450);
    }

    // 4. The decision.
    const { verdict, why } = decide(score, v);
    UI.stamp(verdict);
    if (verdict === 'hell') W.gate.angry(true); else W.gate.pleased(true);
    await gateSays(`${verdict === 'heaven' ? 'Heaven.' : 'Hell.'} ${why}`, verdict);
    await U.wait(300);
    if (verdict === 'heaven') await W.admit(r, v);
    else await W.reject(r, v);
    W.gate.sleep();

    // 5. Exactly one environmental event, in the place the soul went.
    const ev = HG.events.pick(verdict);
    const plan = ev.prepare({ visitor: v, verdict });
    const where = UI.where(plan.realm);
    UI.hush();
    await Cam.to(plan.focus, 'auto');
    UI.wash(verdict);
    const done = ev.run(plan);
    await UI.say(where, plan.caption, { cls: 'event ' + plan.realm, voice: 'god' });
    await done;
    await U.wait(700);

    stats.total += 1;
    stats[verdict] += 1;
    UI.tally(stats);
    UI.ledger({ visitor: v, verdict, event: ev.short });
    UI.visitor(null);
  };

  HG.resetEternity = function () {
    stats.total = stats.heaven = stats.hell = 0;
    HG.voice.stop();
    W.reset();
    HG.events.reset();
    UI.tally(stats);
    UI.resetLedger();
    UI.hush();
    Cam.to({ x: 800, y: 1640, z: 1 }, 1600);
  };
})(window.HG);
