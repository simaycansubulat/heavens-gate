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

- **It perceives:** Through the visitor's camera it sees colours, brightness, roughly where a face is, everyday objects like a cup, phone or plant, and the time of day. It cannot recognise who you are, and it cannot tell whether you smiled or obeyed her.
- **It thinks:** She wants to be entertained. She picks one thing she noticed, sometimes adds one of her "moments" (déjà vu, mistaken identity, a crush on your plant), and decides, remembering what she has already said so she doesn't repeat herself.
- **It acts:** She talks to you, laughs at you, gives you orders, and sends your soul to Heaven or Hell. Each verdict sets off one event that permanently changes that place.
- **Real or faked:** Real: the camera, object detection running in the browser, colour sampling, her speech and laugh, and her memory across reloads. Faked: her "understanding". Her lines are hand-written and chosen by rules, not by a language model, and the afterlife is painted, not simulated.

### One visitor

One visitor (100 to 200 words). A short story about one person or creature who meets your daemon.

[Your story]

## How to use it

1. Open the live demo in Chrome or Edge, with sound on. You see the painted afterlife: Heaven above, the gate in the middle, an endless staircase, and Hell below.
2. Click **A Soul Arrives**. A caution sign tells you that you are dead, and you choose how to meet the gate.

**Option 1: Face the gate**

3. Allow the camera (or click **Skip the camera**). You are already standing in front of her, so there is no climb.
4. She looks at you. Sometimes she bursts out laughing at your face first. Then she comments on one thing she sees, maybe has one of her moments (déjà vu, mistaken identity, a crush on your plant), and gives you an order like "Smile. Big smile." She never checks whether you did it.
5. She gives her verdict.

**Option 2: Choose your character**

3. Pick who you were from the row of characters: a gardener, a woman in a green dress, an old man, an old woman, a woman in a yellow raincoat, a bearded man, a gentleman in a top hat, or one of the animals.
4. Watch your character climb the endless staircase up to the gate.
5. She wakes up in a mood and asks you two or three questions. Click your answers. She judges you anyway. About one time in five she can't be bothered and lets you choose Heaven or Hell yourself.
6. She gives her verdict.

**After the verdict (both options)**

- The soul goes to Heaven or Hell, and a narrator announces the event the verdict caused there ("It started to rain candy in Heaven."). The event stays in the world.
- The soul is added to **Previous Sins**. Click **A Soul Arrives** again for the next soul, or **Begin a new eternity** to start over.

**Tips**

- Face the gate: wear something colourful, hold an object up to the camera, and try it late at night.
- Choose your character: try different characters and answers. Her mood changes from soul to soul.
- Play several rounds and reload. She remembers what she has said and keeps finding new things.
- Untick **Voices** to play silently; the subtitles always show what she says. Tick **Brisk** for shorter pauses.

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

- **Coding agent used:** Claude Code, model Claude Opus 5.5
- **Key prompts:**
  1. "After the 'hello, you're dead' text I want 2 options: 1. face the gate and 2. choose your character."
  2. "For option 1, face the gate: after choosing it, the player opens the camera and the gate judges the player."
  3. "In the camera you will mostly see only the person's face, so judge that: hair, eyes, general vibe, nails, a colour on their shirt. If the camera doesn't see a table, don't mention a table."
  4. A list of her "moments" to mix in: déjà vu ("Were you a pigeon? You stole a sandwich."), mistaken identity ("Is that Beyoncé? No. Ugh."), "I'm not ready, don't look."
  5. "You can ask them to shake their head, smile or come closer, but don't comment on it, because you can't really tell."

### Reflection

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
