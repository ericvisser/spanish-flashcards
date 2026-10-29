// Ordering and question setup for a study session. Pure functions, like srs.js.
import { DIRECTIONS } from "./profile.js";
import { spanishDisplay } from "./words.js";

// Cards below this level get multiple choice when the mode setting is "auto".
export const TYPING_FROM_LEVEL = 2;

// How many cards later a missed card comes back, and how long after its introduction
// a new word gets quizzed (so the answer isn't still on screen in your head).
export const RETRY_GAP = 3;
export const NEW_WORD_GAP = 2;

export function pickMode(level, setting) {
  if (setting === "typing" || setting === "choice") return setting;
  return level < TYPING_FROM_LEVEL ? "choice" : "typing";
}

// One new word, then two reviews, repeating, so new words are spread through the session.
export function buildSessionQueue(reviews, newWords) {
  const queue = [];
  let r = 0;
  let n = 0;
  while (r < reviews.length || n < newWords.length) {
    if (n < newWords.length) queue.push({ ...newWords[n++], isNew: true });
    for (let i = 0; i < 2 && r < reviews.length; i++) queue.push({ ...reviews[r++], isNew: false });
  }
  return queue;
}

// Free practice: every word in a rank range, shuffled. "mixed" picks a direction per word.
export function buildPracticeQueue(words, fromRank, toRank, direction, random = Math.random) {
  const picked = words.filter((w) => w.rank >= fromRank && w.rank <= toRank);
  return shuffle(picked, random).map((w) => ({
    wordId: w.es,
    direction: direction === "mixed" ? (random() < 0.5 ? DIRECTIONS.ES_EN : DIRECTIONS.EN_ES) : direction,
    isNew: false,
  }));
}

// Puts an item back into the queue `gap` places from the front.
export function requeue(queue, item, gap) {
  const next = [...queue];
  next.splice(Math.min(gap, next.length), 0, item);
  return next;
}

function shuffle(items, random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function choiceLabel(word, direction) {
  return direction === DIRECTIONS.ES_EN ? word.en.slice(0, 2).join(", ") : spanishDisplay(word);
}

// Four options: the answer plus three distractors, preferring the same part of speech
// and similar frequency so they can't be ruled out without knowing the word.
// Words sharing an English meaning with the answer are left out, since they'd also be right.
export function makeChoices(word, direction, words, random = Math.random) {
  const meanings = new Set(word.en.map((e) => e.toLowerCase()));
  const candidates = words.filter((w) => w !== word && !w.en.some((e) => meanings.has(e.toLowerCase())));
  const closeness = (a, b) => Math.abs(a.rank - word.rank) - Math.abs(b.rank - word.rank);

  const samePos = candidates.filter((w) => w.pos === word.pos).sort(closeness);
  const otherPos = candidates.filter((w) => w.pos !== word.pos).sort(closeness);
  // Pick from the closest few at random, so the same distractors don't always show up together.
  const distractors = [...shuffle(samePos.slice(0, 6), random), ...otherPos].slice(0, 3);

  return shuffle([word, ...distractors], random).map((w) => ({
    wordId: w.es,
    label: choiceLabel(w, direction),
    correct: w === word,
  }));
}
