/* data.js — everything the gate says. Edit freely; no other file needs to change.
 *
 * ─── HOW TO ADD A THOUGHT ────────────────────────────────────────────────────────────
 * Add an object to D.thoughts:
 *
 *   { text: 'Your ears are humming. I dislike humming.', lean: -1 }
 *
 *   text   What the gate says. Placeholders are filled from the visitor:
 *          {name} {kind} {number} {letter} {shadow}
 *   lean   Positive pushes toward Heaven, negative toward Hell, 0 neutral.
 *   flip   Set flip: true to make the gate reverse everything it decided so far (lean ignored).
 *          Flip thoughts are never the first thought.
 *
 * The gate speaks in a child’s voice, but it is not a child. It says hello once (D.greetings),
 * has 1–2 thoughts, then decides.
 * The decision triggers exactly one environmental event (see events.js), chosen at random.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
(function (HG) {
  const U = HG.util;
  const D = {};

  D.names = ['Prudence', 'Desmond', 'Agnieszka', 'Tomás', 'Hiroko', 'Bartholomew', 'Femi', 'Ingrid', 'Raúl', 'Mei',
    'Oswald', 'Priya', 'Gunnar', 'Lucinda', 'Ezekiel', 'Noor', 'Dmitri', 'Winifred', 'Yusuf', 'Colm', 'Ines',
    'Beatrix', 'Biscuit', 'Sir Reginald', 'Pebbles', 'Gerald', 'Ozan', 'Marisol', 'Kofi', 'Elif'];

  D.shadows = ['a rabbit', 'a question mark', 'a slightly larger version of itself', 'a teapot', 'a lighthouse',
    'somebody else entirely', 'a folding chair', 'a nervous horse'];

  /** Build a visitor: a person or an animal, plus the details the gate obsesses over. */
  D.makeVisitor = function () {
    const kind = HG.rig.pick();
    const name = U.pick(D.names);
    return { kind, name, kindLabel: kind.label, title: `${name}, ${kind.label}`, shadow: U.pick(D.shadows), number: U.randInt(3, 97), letter: name.charAt(0) };
  };

  /** What the gate says first. One hello, nothing more. */
  D.greetings = ['Hello. Welcome to Heaven’s Gate.', 'Hello, traveller. Welcome to Heaven’s Gate.', 'Hello. You have reached Heaven’s Gate.'];

  /* Absurd, certain, a little sinister. The gate never says it is thinking or that it cannot decide. */
  D.thoughts = [
    { text: 'Your shadow arrived before you did. It has already confessed.', lean: -2 },
    { text: 'A duck vouched for you on the way up. Ducks cannot lie. They have no lips.', lean: 3 },
    { text: 'You climbed {number} steps. Every one of them was slightly ashamed of you.', lean: -2 },
    { text: 'You climbed {number} steps. {number} is the number of things I love.', lean: 2 },
    { text: 'Your footsteps sounded like an apology for something you have not done yet.', lean: -1 },
    { text: 'Your shadow looks like {shadow}. I have never forgiven {shadow}.', lean: -2 },
    { text: 'You smell faintly of Tuesday, which is the holiest day.', lean: 2 },
    { text: 'The clouds spelled your name on the way up. They only do that for saints, or for the very rude.', lean: 1 },
    { text: 'My hinges remember everyone. They prefer you.', lean: 2 },
    { text: 'My left door is in love with you. My right door is suspicious of love.', lean: 1 },
    { text: 'You blinked on the eleventh step. Nobody blinks on the eleventh step.', lean: -2 },
    { text: 'Somebody in Hell has been saving you a seat for years. It would be rude to refuse.', lean: -2 },
    { text: 'You are exactly the size of a medium sin.', lean: -1 },
    { text: 'Your page in the great book is blank, except for a drawing of a horse. The horse is crying.', lean: -1 },
    { text: 'The light behind me hums when you are near. It has never hummed before.', lean: 2 },
    { text: 'The moon told me something about you, {name}. It was beautiful and illegal.', lean: 0 },
    { text: 'Your name begins with {letter}. The universe has strong feelings about {letter}.', lean: 1 },
    { text: 'You arrived exactly on time. Nobody arrives on time.', lean: -1 },
    { text: 'You have the face of someone who returns the shopping trolley.', lean: 2 },
    { text: 'You have the face of someone who claps when the plane lands.', lean: -2 },
    { text: 'I can hear your heartbeat, and you do not have one.', lean: -1 },
    { text: 'The stairs say you were gentle with them.', lean: 2 },
    { text: 'You are {kind}. I was {kind} once, for an afternoon. It went badly.', lean: -1 },
    { text: 'There is a door inside you, and it is locked from your side.', lean: -2 },
    { text: 'No. The opposite. Everything I just said, turned inside out.', flip: true },
    { text: 'I take it back. I take back the sky as well.', flip: true },
    { text: 'Reverse that. Reverse me.', flip: true }
  ];

  /** Pick distinct thoughts; at most one flip, never first. */
  D.pickThoughts = function (count) {
    const normal = U.shuffle(D.thoughts.filter(t => !t.flip));
    const flips = U.shuffle(D.thoughts.filter(t => t.flip));
    const chosen = normal.slice(0, count);
    if (count > 1 && U.chance(0.45)) chosen[U.randInt(1, count - 1)] = flips[0];
    return chosen;
  };

  /* Said with the verdict. */
  /* Said after “Heaven.” or “Hell.” */
  D.explanations = {
    heaven: ['The duck was very convincing.', 'Your shadow can wait outside forever.', 'The light insisted.',
      'Do not touch the harps.', 'The number {number} has been informed.'],
    hell: ['Nothing personal, only structural.', 'A cloud testified against you.', 'Hell needed a fourth for cards.',
      'Your shadow is already there, waiting.', 'The lava asked for you by name.'],
    heavenDespite: ['Every reason was against you. Come in anyway.'],
    hellDespite: ['Every reason was for you. That is exactly the problem.'],
    coinHeaven: ['A feather fell to the left.'],
    coinHell: ['A feather fell to the right.']
  };

  D.contrarianChance = 0.18;
  D.thoughtCountWeights = [0.5, 0.5];

  HG.data = D;
})(window.HG);
