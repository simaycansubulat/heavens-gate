/* voice.js — spoken lines using the browser's built-in speech (no network service, no API key).
 *
 *   HG.voice.say(text, 'gate')     a small child's voice: the gate
 *   HG.voice.say(text, 'god')      a deep, slow man's voice: the narrator of events
 *
 * Voices depend on the computer: each OS ships different ones. Pitch and rate do most of the
 * work, and the code prefers matching voices when they exist. If speech is unavailable or muted,
 * say() still resolves after roughly the time the line would take, so the story keeps its pace.
 */
(function (HG) {
  const U = HG.util;
  const synth = window.speechSynthesis;
  const V = { enabled: true, onWord: null, voices: [] };

  const load = () => { if (synth) V.voices = synth.getVoices().filter(v => /^en/i.test(v.lang)); };
  if (synth) { load(); synth.onvoiceschanged = load; }

  const prefer = {
    gate: [/child|kid|junior|ivy|justin|kevin/i, /samantha|karen|tessa|moira|zira|aria|jenny|libby|sonia|female|google us english/i],
    god: [/daniel|arthur|george|ryan|guy|david|mark|fred|alex|bruce|ralph|male|google uk english male/i]
  };
  const settings = { gate: { pitch: 1.9, rate: 1.06 }, god: { pitch: 0.35, rate: 0.82 } };

  function pick(kind) {
    const local = V.voices.filter(v => v.localService);
    const pools = [local, V.voices];
    for (const pool of pools) for (const re of prefer[kind]) { const v = pool.find(x => re.test(x.name)); if (v) return v; }
    return local[0] || V.voices[0] || null;
  }

  V.say = function (text, kind = 'gate') {
    const est = 900 + text.length * (kind === 'god' ? 78 : 62);
    if (!synth || !V.enabled) return U.wait(est * 0.75);
    return new Promise(resolve => {
      let done = false;
      const finish = () => { if (!done) { done = true; clearTimeout(timer); V.onWord && V.onWord(null); resolve(); } };
      const u = new SpeechSynthesisUtterance(text);
      const voice = pick(kind);
      if (voice) u.voice = voice;
      Object.assign(u, settings[kind]);
      u.volume = 1;
      u.onend = finish; u.onerror = finish;
      u.onboundary = e => { if (V.onWord) V.onWord(kind, e); };
      const timer = setTimeout(finish, est * 2.2 + 2000);   // never wait forever
      synth.cancel();
      synth.speak(u);
    });
  };

  V.stop = () => { if (synth) synth.cancel(); };
  V.toggle = on => { V.enabled = on; if (!on) V.stop(); };

  HG.voice = V;
})(window.HG);
