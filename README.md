# Heaven’s Gate

A DTAD Nonsense Daemon prototype, painted in a soft storybook-animation style.

A person or an animal climbs an endless switchback staircase through the clouds to a golden gate. The gate itself is the daemon. It has no face and no keeper: when it speaks, in a child’s voice, its doors part with every word, light pours out, and rings of shifting colour pulse from the arch. Its reasons are absurd, certain and a little sinister, and it contradicts itself. Admitted souls see the doors burst open in gold and walk into the light, and the camera follows them up into Heaven, a meadow on floating islands, where they stay. Refused souls see the gate flush red and slam, and the shockwave throws them off the platform and down into Hell, a burning ruined city, where they stay too.

Every decision triggers exactly one large environmental event, chosen at random, in the place the soul went: Heaven for the admitted, Hell for the refused. A deep narrator voice announces it (“It started to rain candy in Heaven.”, “A huge storm broke out in Hell.”), the screen washes with colour, and whatever it creates stays in the world.

Plain HTML, CSS and JavaScript. No build step, no dependencies, no external APIs or paid services.

## Run it

Either double-click `index.html`, or serve the folder:

```
cd heavens-gate
python3 -m http.server 8000
```

then open http://localhost:8000.

**Voices** use the browser’s built-in speech (Web Speech API), so they need no internet, but they depend on the voices your operating system has installed. Chrome, Edge and Safari all work. The gate uses a high, childlike voice and the narrator a low, slow one. Untick **Voices** to mute them; the subtitles always show what is said.

## Files

| File | What it does |
| --- | --- |
| `index.html` | The world, the gate’s doors, the interface |
| `css/style.css` | Interface, the gate’s aura and moods, all animation |
| `js/geometry.js` | Where the stairs, platform, gate and grounds are (generated, see below) |
| `js/util.js` | Helpers: SVG creation, randomness, tweens, particle bursts |
| `js/camera.js` | Moves the view: glide, follow, shake |
| `js/voice.js` | The two voices: the gate (child) and the narrator (deep) |
| `js/rig.js` | People and animals, with two-part legs that plant on each stair |
| `js/data.js` | Everything the gate says |
| `js/world.js` | The gate (doors, aura, shockwaves), climbing, entering Heaven, falling to Hell, residents |
| `js/events.js` | The 23 environmental events (11 in Heaven, 12 in Hell, plus gravity in either) |
| `js/judgement.js` | One visitor from climb to event |
| `js/main.js` | Start-up and controls |
| `assets/world.jpg`, `assets/door-left.png` | The painted world and the golden door |
| `tools/bake_scenery.py` | Paints the world and writes `js/geometry.js` |

## Adding things

- **A line for the gate:** add `{ text, lean }` to `D.thoughts` in `js/data.js`. Greetings are in `D.greetings`.
- **A creature:** add an entry to `KINDS` in `js/rig.js` (instructions at the top). Choose `gait: 'walk'` for legs that step, `'hop'` for small animals, or `'glide'`.
- **An event:** call `register()` in `js/events.js` with a `realm` ('heaven' or 'hell'), `prepare()` (where it happens and the narrator’s caption) and `run()` (what happens). There is a template at the top of the file.

## Repainting the scenery

The backgrounds are painted by code. To change them, edit `tools/bake_scenery.py` and run:

```
pip install numpy scipy pillow
python3 tools/bake_scenery.py
```

This rewrites `assets/world.jpg`, `assets/door-left.png` and `js/geometry.js`, so the stairs the characters walk on always match the painting.
