/* main.js — builds the living parts of the scene and wires up the controls. */
(function (HG) {
  HG.world.buildGate();
  HG.world.buildAmbient();
  HG.camera.jump({ x: 800, y: 1640, z: 1 });
  HG.ui.say('Heaven’s Gate', 'Somewhere far below, someone has started climbing.', { type: false, cls: 'quiet' });

  const btn = document.getElementById('arrive-btn');
  const reset = document.getElementById('reset-btn');
  const brisk = document.getElementById('brisk');
  const voices = document.getElementById('voices');
  let busy = false;

  btn.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    btn.disabled = reset.disabled = true;
    try {
      await HG.judge();
    } catch (err) {
      console.error(err);
      HG.ui.say('', 'Something went wrong mid-judgement. The world is intact; send someone else up.', { type: false });
    } finally {
      busy = false;
      btn.disabled = reset.disabled = false;
      btn.focus();
    }
  });

  reset.addEventListener('click', () => {
    if (busy) return;
    if (window.confirm('Clear every change to Heaven and Hell and start over?')) HG.resetEternity();
  });

  brisk.addEventListener('change', () => { HG.util.speed = brisk.checked ? 0.5 : 1; });
  voices.addEventListener('change', () => HG.voice.toggle(voices.checked));
})(window.HG);
