// A learner's profile: settings, streak, and one card per word per direction.
// Every function returns a new profile instead of changing the old one.
import { addDays, answerCard, isDue, newCard, MAX_LEVEL } from "./srs.js";

export const DIRECTIONS = { ES_EN: "es-en", EN_ES: "en-es" };

// English -> Spanish unlocks once Spanish -> English reaches this level.
export const UNLOCK_EN_ES_LEVEL = 2;

export const START_LEVELS = [
  { id: "beginner", label: "Beginner", description: "Never studied Spanish", startRank: 1 },
  { id: "basics", label: "Know the basics", description: "Skip the 250 most common words", startRank: 251 },
  { id: "some", label: "Some experience", description: "Skip the 500 most common words", startRank: 501 },
  { id: "intermediate", label: "Intermediate", description: "Skip the 1,000 most common words", startRank: 1001 },
];

// Skipped words are "probably known": they start at this level and come back for a
// check a few per day, so gaps get caught without flooding the first day.
export const PLACEMENT_LEVEL = 3;
export const PLACEMENT_PER_DAY = 20;
const PLACEMENT_EN_ES_DELAY_DAYS = 3;

export const DEFAULT_SETTINGS = {
  newPerDay: 10,
  strictAccents: false,
  requireArticles: false,
  mode: "auto",
};

export const cardKey = (wordId, direction) => `${wordId}|${direction}`;

export function parseCardKey(key) {
  const [wordId, direction] = key.split("|");
  return { wordId, direction };
}

export function createProfile({ name, startRank, newPerDay }, words, today) {
  const cards = {};
  words
    .filter((w) => w.rank < startRank)
    .forEach((w, i) => {
      const due = addDays(today, Math.floor(i / PLACEMENT_PER_DAY));
      const placed = { ...newCard(today), level: PLACEMENT_LEVEL, placed: true };
      cards[cardKey(w.es, DIRECTIONS.ES_EN)] = { ...placed, due };
      cards[cardKey(w.es, DIRECTIONS.EN_ES)] = { ...placed, due: addDays(due, PLACEMENT_EN_ES_DELAY_DAYS) };
    });

  return {
    version: 1,
    name,
    startRank,
    created: today,
    settings: { ...DEFAULT_SETTINGS, newPerDay },
    streak: { count: 0, lastDay: null },
    cards,
  };
}

// Checks that a backup file really holds a profile before it replaces the current one.
export function isValidProfile(data) {
  return (
    data !== null &&
    typeof data === "object" &&
    data.version === 1 &&
    typeof data.name === "string" &&
    typeof data.settings === "object" &&
    typeof data.streak === "object" &&
    typeof data.cards === "object" &&
    Object.values(data.cards).every((c) => typeof c.level === "number" && typeof c.due === "string")
  );
}

// What to study today: cards that are due, plus new words up to the daily limit.
export function getStudyQueue(profile, words, today) {
  const rankOf = new Map(words.map((w) => [w.es, w.rank]));

  const reviews = Object.entries(profile.cards)
    .filter(([, card]) => isDue(card, today))
    .map(([key, card]) => ({ ...parseCardKey(key), due: card.due }))
    .filter((c) => rankOf.has(c.wordId))
    .sort((a, b) => a.due.localeCompare(b.due) || rankOf.get(a.wordId) - rankOf.get(b.wordId))
    .map(({ wordId, direction }) => ({ wordId, direction }));

  const introducedToday = Object.entries(profile.cards).filter(
    ([key, card]) => key.endsWith(DIRECTIONS.ES_EN) && card.introduced === today && !card.placed,
  ).length;
  const room = Math.max(0, profile.settings.newPerDay - introducedToday);

  const newWords = words
    .filter((w) => !profile.cards[cardKey(w.es, DIRECTIONS.ES_EN)])
    .slice(0, room)
    .map((w) => ({ wordId: w.es, direction: DIRECTIONS.ES_EN }));

  return { reviews, newWords };
}

// Records one answer. A word with no card yet is a new word, and gets one now.
// Returns the updated profile and the learning events it caused (see events.js).
export function recordAnswer(profile, wordId, direction, correct, today) {
  const key = cardKey(wordId, direction);
  const before = profile.cards[key] ?? newCard(today);
  const after = answerCard(before, correct, today);
  const cards = { ...profile.cards, [key]: after };
  const events = [{ type: correct ? "answerCorrect" : "answerWrong", wordId, direction }];

  if (correct && direction === DIRECTIONS.ES_EN && before.right === 0) {
    events.push({ type: "wordLearned", wordId });
  }
  if (after.level > before.level) {
    events.push({ type: "levelUp", wordId, direction, level: after.level });
  }
  if (after.level === MAX_LEVEL && before.level < MAX_LEVEL) {
    events.push({ type: "wordMastered", wordId, direction });
  }

  const reverseKey = cardKey(wordId, DIRECTIONS.EN_ES);
  if (direction === DIRECTIONS.ES_EN && after.level >= UNLOCK_EN_ES_LEVEL && !cards[reverseKey]) {
    cards[reverseKey] = newCard(today);
    events.push({ type: "directionUnlocked", wordId, direction: DIRECTIONS.EN_ES });
  }

  let streak = profile.streak;
  if (streak.lastDay !== today) {
    const count = streak.lastDay === addDays(today, -1) ? streak.count + 1 : 1;
    streak = { count, lastDay: today };
    events.push({ type: "streakContinued", count });
  }

  return { profile: { ...profile, cards, streak }, events };
}

// The current streak, counting it as broken if the last study day was before yesterday.
export function currentStreak(profile, today) {
  const { count, lastDay } = profile.streak;
  return lastDay === today || lastDay === addDays(today, -1) ? count : 0;
}
