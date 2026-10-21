/* ui.js — the words on screen: subtitles for the gate, the visitor card, the ledger. */
(function (HG) {
  const U = HG.util;
  const $ = id => document.getElementById(id);
  const UI = {};

  UI.visitor = function (v) {
    $('visitor').hidden = !v;
    if (!v) return;
    $('visitor-name').textContent = v.name;
    $('visitor-meta').textContent = U.cap(v.kindLabel) + '.';
  };

  /**
   * Show a line in the subtitle band, and speak it if a voice is given ('gate' or 'god').
   * Resolves when both the typing and the speech have finished.
   */
  UI.say = async function (where, text, { type = true, cls = '', voice = null } = {}) {
    const box = $('subtitles');
    box.className = 'subtitles show ' + cls;
    $('sub-where').textContent = where;
    const p = $('sub-text');
    const spoken = voice ? HG.voice.say(text.replace(/[“”]/g, ''), voice) : Promise.resolve();
    if (!type || U.reducedMotion) { p.textContent = text; await spoken; return; }
    p.textContent = '';
    for (let i = 1; i <= text.length; i++) {
      p.textContent = text.slice(0, i);
      await new Promise(r => setTimeout(r, (voice === 'god' ? 34 : 26) * U.speed));
    }
    await spoken;
  };
  /** A brief psychedelic wash across the whole screen when an event hits. */
  UI.wash = realm => {
    const el = $('wash');
    el.className = 'wash ' + realm;
    void el.offsetWidth;
    el.classList.add('on');
  };
  UI.hush = () => { $('subtitles').className = 'subtitles'; };

  UI.stamp = function (verdict) {
    const el = $('verdict-stamp');
    el.textContent = verdict === 'heaven' ? 'Heaven' : 'Hell';
    el.className = 'verdict-stamp ' + verdict;
    void el.offsetWidth;
    el.classList.add('show');
  };

  UI.tally = function (s) {
    $('tally').textContent = s.total
      ? `${s.total} judged. ${s.heaven} let in, ${s.hell} thrown down.`
      : 'Nobody has climbed yet.';
  };

  UI.ledger = function (e) {
    $('ledger-empty').hidden = true;
    const li = document.createElement('li');
    const line = document.createElement('p');
    line.className = 'ledger-line';
    const name = document.createElement('span');
    name.className = 'ledger-name';
    name.textContent = e.visitor.title;
    const v = document.createElement('span');
    v.className = 'ledger-verdict ' + e.verdict;
    v.textContent = e.verdict === 'heaven' ? 'Heaven' : 'Hell';
    line.append(name, document.createTextNode(' went to '), v, document.createTextNode('.'));
    const ev = document.createElement('p');
    ev.className = 'ledger-event';
    ev.textContent = `Then: ${e.event}.`;
    li.append(line, ev);
    const list = $('ledger-list');
    list.prepend(li);
    while (list.children.length > 4) list.lastElementChild.remove();
  };

  UI.resetLedger = function () {
    $('ledger-list').innerHTML = '';
    $('ledger-empty').hidden = false;
  };

  UI.where = realm => ({ heaven: 'In Heaven', hell: 'In Hell', stairs: 'On the staircase', gate: 'At the gate' }[realm]);

  HG.ui = UI;
})(window.HG);
