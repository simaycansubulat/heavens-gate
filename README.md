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

My daemon is the spirit of a gate at the top of a staircase in the clouds, between Heaven and Hell. Every soul who dies has to climb up to her, and she decides where they go. She reads the theme in the worst possible way. She is a bored mean girl, so her reasons change with every soul: your face, your hair, the hour, or a feeling that you were once a pigeon. The constraint is why she judges so quickly. Every thought costs her something visible: with each one, something has to happen in Heaven or in Hell, like candy rain over the floating islands. So she spends as few thoughts as possible: one look, one guess, one verdict. Sometimes she can't even be bothered and lets the soul choose for itself.

### Perceive, think, act

- **It perceives:** Through the camera she sees colours, brightness, your face, everyday objects and the time of day; with a chosen character she only hears your answers. She cannot tell who you are or whether you obeyed her.
- **It thinks:** She wants to be entertained. She picks one thing to judge you on, and her mood and chance decide the rest.
- **It acts:** She mocks you, gives you orders and sends your soul to Heaven or Hell. Each verdict sets off one event that stays in that world.
- **Real or faked:** The camera, object detection, voices, laugh and her memory are real. Her "understanding" is faked: hand-written lines chosen by rules, no language model.

### One visitor

It is a slow night at the top of the endless staircase, and the gate is bored. Then a chicken hops up and stops in front of her. A card appears: Sir Reginald, a chicken. "Hi, Sir Reginald. Cute name. Shame about the rest. This is Heaven's Gate." Sir Reginald tilts his head. The gate squints: "Wait. Were you a pigeon? 1987? You stole a sandwich." He has stolen many sandwiches, but never as a pigeon. The gate thinks about asking him questions, but every thought costs her, and she is tired. She sighs: "Ugh, I can't be bothered. Heaven or Hell, you pick." He hops towards Heaven, offended that it was that easy. It starts to rain candy over the floating islands. The gate has already forgotten him.

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
    <li>"You can ask them to shake their head, smile or come closer, but don't comment on it, because you can't really tell."</li>
  </ol>
- **Reflection:** Progress came when I stopped asking for features and started describing her: a bored mean girl, not a robot. Concrete examples also helped. When the gate noticed my red nails and that it was the middle of the night, I told the agent this was exactly right, and it wrote more lines in that spirit. The agent went sideways when it pretended to see more than a camera can: it commented on smiles, whether people obeyed, and it repeated the same lines. Her voice also sounded robotic for a long time. The fix was to accept the limits of her eyes and make them part of her character: she gives orders but never checks. Next time I would decide on day one what the daemon can perceive and how the constraint shows on screen, and test on the live link from the start.

## Credits, assets, licenses

- **Fonts:** Cormorant Garamond, UnifrakturMaguntia, Anton, Press Start 2P (Google Fonts, SIL Open Font License 1.1)
- **Data:** COCO-SSD is trained on the COCO dataset (cocodataset.org, CC BY 4.0)
- **Images and sounds:**
  - Scenery painted procedurally by `tools/bake_scenery.py`, own work
  - [Giggle.ogg](https://commons.wikimedia.org/wiki/File:Giggle.ogg) by Lomond, Wikimedia Commons, CC BY 3.0
  - [Lachen Mix MM.ogg](https://commons.wikimedia.org/wiki/File:Lachen_Mix_MM.ogg) by Thirunavukkarasye-Raveendran, Wikimedia Commons, CC BY 4.0
- **Third-party code:** TensorFlow.js (Apache 2.0), COCO-SSD (Apache 2.0)
- **This repo:** MIT
