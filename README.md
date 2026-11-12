# Heaven's Gate

A bored gate judges the dead, you on webcam or a character you pick, sending each to Heaven or Hell.

## Author and course

- **Author:** Simay Cansu Bulat
- **Studio:** Pandaemonium: Daemons for Weimar
- **Course:** M.Sc. Digital Technologies in Architecture and Design (DTAD), WiSe 2026/27
- **Chair:** Informatics in Architecture and Urbanism (InfAU), Faculty of Architecture and Urbanism, Bauhaus-Universität Weimar
- **Teaching staff:** Reinhard König, Martin Bielik, Egor Gaydukov, Egor Gavrilov, Jan Willmann, Michael Braun, Thomas Pearce
- **Exercise:** Nonsense Project, 15.10. to 29.10.2026
- **Submission date:** 12.11.2026

## Links

- **Live demo:** https://simaycansubulat.github.io/heavens-gate/
- **Source repo:** https://github.com/simaycansubulat/heavens-gate
- **Miro frame:** https://miro.com/app/board/uXjVHn1RS88=/?moveToWidget=3458764689890764643
- **60-second showreel:** on the Miro frame, and as `showreel_HeavensGate_26-11-11.mp4` in this repo

## The task

The Nonsense Project is the two-week, individual start of the studio. I drew one theme, a strange situation in a city where things have spirits, and one constraint, a limit on the daemon I imagined for it. With a coding agent I built a prototype that shows what my daemon would do. Sensors and AI services could be faked, as long as the result was specific and believable. A daemon is not a script, so even a fake one had to decide for itself.

## Theme and constraint

**Theme:**
A door lets some people through and turns others away. Its reasons change all the time.

**Constraint:**
Every thought costs your daemon something visible. A candle burns out, water drains away, a pile of sand shrinks.

## The daemon

### Concept

Concept (100 to 150 words, no technical terms). What your daemon is, how it reads the theme, where the constraint really bites.

[Your concept]

### Perceive, think, act

- **It perceives:** Through the camera she sees colours, brightness, your face, everyday objects and the time of day; with a chosen character she only hears your answers. She cannot tell who you are or whether you obeyed her.
- **It thinks:** She wants to be entertained. She picks one thing to judge you on, and her mood and chance decide the rest.
- **It acts:** She mocks you, gives you orders and sends your soul to Heaven or Hell. Each verdict sets off one event that stays in that world.
- **Real or faked:** The camera, object detection, voices, laugh and her memory are real. Her "understanding" is faked: hand-written lines chosen by rules, no language model.

### One visitor

One visitor (100 to 200 words). A short story about one person or creature who meets your daemon.

[Your story]

## How to use it

The steps a stranger needs to get the experience your story describes.

1. Open the live demo in Chrome or Edge with sound on. You see the painted afterlife: Heaven above, a gate on the clouds, an endless staircase, and Hell below.
2. Click **A Soul Arrives**. A caution sign tells you that you are dead, and you choose **Face the gate** or **Choose your character**.
3. Face the gate: allow the camera, and she comments on what she sees, gives you an order and judges you. Choose your character: pick a person or an animal, watch them climb, and answer her questions. Either way, the verdict sets off an event in Heaven or Hell that stays in the world.
4. Tips: play several rounds. She remembers what she has said and keeps finding new things.

## Technical implementation

- **Frontend:** vanilla HTML, CSS and JavaScript in one self-contained file (`index.html`), with the painted scenery embedded as images
- **Hosting:** GitHub Pages: free, static, and gives one link that works on any computer with a camera
- **Data sources and APIs:** browser camera (getUserMedia), Web Speech API for the voices, Web Audio for the laugh, localStorage for her memory; TensorFlow.js and COCO-SSD loaded from jsDelivr; fonts from Google Fonts. Camera frames stay in the browser and are never uploaded.
- **Models while it runs:** COCO-SSD object detection, running in the browser. No language model.
- **Notable libraries:** TensorFlow.js 4.22.0, COCO-SSD 2.2.3. The scenery was generated beforehand with `tools/bake_scenery.py` (Python, numpy, scipy, Pillow).

**Run locally:**

```
git clone https://github.com/simaycansubulat/heavens-gate.git
cd heavens-gate
python -m http.server 8000
# open http://localhost:8000 in Chrome or Edge
```

You can also just double-click `index.html`, but serving it from localhost makes the camera permission work reliably.

## Working with AI

- **Coding agents used:** Claude Code, model Claude Opus 5.5
- **Key prompts** (two to five that really moved the project):
  <ol type="a">
    <li>"After the 'hello, you're dead' text I want 2 options: 1. face the gate and 2. choose your character."</li>
    <li>"For option 1, face the gate: after choosing it, the player opens the camera and the gate judges the player."</li>
    <li>"In the camera you will mostly see only the person's face, so judge that: hair, eyes, general vibe, nails, a colour on their shirt. If the camera doesn't see a table, don't mention a table."</li>
    <li>A list of her "moments" to mix in: déjà vu ("Were you a pigeon? You stole a sandwich."), mistaken identity ("Is that Beyoncé? No. Ugh."), "I'm not ready, don't look."</li>
    <li>"You can ask them to shake their head, smile or come closer, but don't comment on it, because you can't really tell."</li>
  </ol>
- **Reflection** (150 words at most): What unlocked progress? Where did the agent get stuck or go sideways? What would you do differently next time?

  What unlocked progress was telling the agent exactly which moments I loved. When the gate noticed my red nails and that it was the middle of the night, I said so, and it learned to write more lines like that. The agent went sideways when it pretended to see more than the camera can: it commented on smiles and tables that weren't there, and on whether people obeyed. The fix was to accept the limits of her eyes and make them part of her character: she gives orders but never checks. It also repeated lines a lot and her voice sounded robotic until I described her as a real mean girl. Next time I would decide what the daemon can and cannot perceive on day one, and set up the live link from the start, since I tested everything there.

## Credits, assets, licenses

- **Fonts:** Cormorant Garamond, UnifrakturMaguntia, Anton, Press Start 2P (Google Fonts, SIL Open Font License 1.1)
- **Data:** COCO-SSD is trained on the COCO dataset (cocodataset.org, CC BY 4.0)
- **Images and sounds:**
  - Scenery painted procedurally by `tools/bake_scenery.py`, own work
  - [Giggle.ogg](https://commons.wikimedia.org/wiki/File:Giggle.ogg) by Lomond, Wikimedia Commons, CC BY 3.0
  - [Lachen Mix MM.ogg](https://commons.wikimedia.org/wiki/File:Lachen_Mix_MM.ogg) by Thirunavukkarasye-Raveendran, Wikimedia Commons, CC BY 4.0
- **Third-party code:** TensorFlow.js (Apache 2.0), COCO-SSD (Apache 2.0)
- **This repo:** MIT
