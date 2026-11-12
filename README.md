# Heaven's Gate

A bored golden gate that judges dead souls through your webcam and sends them to Heaven or Hell.

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

Heaven's Gate is the spirit of a golden gate at the top of an endless staircase in the clouds. Every dead soul climbs up to her, and she decides where they go: a meadow of floating islands, or a burning ruined city. She is not wise and not fair. She is a bored popular girl who has seen too many faces today, so her reasons change with every soul. Sometimes she is sure she knows you from a past life, or mistakes you for her ex. Every verdict sets off one event, like candy rain in Heaven, that stays for the next soul. The constraint is why she is so shallow: thinking costs her, so she allows herself one look, one guess and one verdict. She orders you to smile or come closer but never checks whether you did, because checking would cost another thought.

### Perceive, think, act

- **It perceives:** Through the visitor's camera it sees colours, brightness, roughly where a face is, everyday objects like a cup, phone or plant, and the time of day. It cannot recognise who you are, and it cannot tell whether you smiled or obeyed her.
- **It thinks:** She wants to be entertained. She picks one thing she noticed, sometimes adds one of her "moments" (déjà vu, mistaken identity, a crush on your plant), and decides, remembering what she has already said so she doesn't repeat herself.
- **It acts:** She talks to you, laughs at you, gives you orders, and sends your soul to Heaven or Hell. Each verdict sets off one event that permanently changes that place.
- **Real or faked:** Real: the camera, object detection running in the browser, colour sampling, her speech and laugh, and her memory across reloads. Faked: her "understanding". Her lines are hand-written and chosen by rules, not by a language model, and the afterlife is painted, not simulated.

### One visitor

It is 3 a.m. in Weimar. Lena, an architecture student, has a jury at ten and a model that is still missing its roof. She opens a link a friend sent her: "You are dead." Fair enough. She chooses Face the gate and allows the camera. A golden gate waits at the top of the stairs and bursts out laughing before Lena says anything. "Red nails at three in the morning? Devil much?" Lena looks at her hands. The gate squints: "Hold on. I know you. Were you a pigeon? You stole a sandwich in 1987." Then an order: "Come closer." Lena leans in. The gate doesn't say whether that helped. A pause, a sigh: "Hell. Honestly, you'll like it." A deep voice announces that it has started raining ash on the burning city, and the ash stays there. Lena is offended, then laughs, then reloads to try again. The gate remembers her lines and says something new. Lena takes away a strange feeling of having been looked at closely by something that did not care at all, and a screenshot for the group chat.

## How to use it

1. Open the live demo in Chrome or Edge, with sound on. You see a warning: you are dead, and two options.
2. Choose **Face the gate** and allow the camera. The gate looks at you, comments on one thing she sees, maybe has one of her moments, and gives you an order.
3. She gives her verdict. Your soul goes to Heaven or Hell, and a narrator announces the event your verdict caused there. The event stays in the world.
4. Or choose **Choose your character**: pick a person or an animal, watch them climb the stairs, and answer her questions.
5. Tips: wear something colourful, hold an object up to the camera, play late at night, and reload a few times. She remembers what she has said and keeps finding new things. Untick **Voices** to play silently; the subtitles always show what she says.

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
