// Numbers for the home and stats screens, computed from a profile's cards.
import { cardKey, DIRECTIONS, parseCardKey } from "./profile.js";
import { INTERVAL_DAYS, MAX_LEVEL } from "./srs.js";

export function getStats(profile, words) {
  const cards = Object.entries(profile.cards).map(([key, card]) => ({ ...parseCardKey(key), ...card }));
  const levelOf = (wordId, direction) => profile.cards[cardKey(wordId, direction)]?.level;

  // A word counts as known once Spanish -> English is past level 0, and mastered once
  // both directions reach the top level.
  const known = words.filter((w) => levelOf(w.es, DIRECTIONS.ES_EN) >= 1).length;
  const mastered = words.filter(
    (w) => levelOf(w.es, DIRECTIONS.ES_EN) === MAX_LEVEL && levelOf(w.es, DIRECTIONS.EN_ES) === MAX_LEVEL,
  ).length;

  const right = cards.reduce((sum, c) => sum + c.right, 0);
  const wrong = cards.reduce((sum, c) => sum + c.wrong, 0);

  const levels = INTERVAL_DAYS.map((days, level) => ({
    level,
    days,
    esEn: cards.filter((c) => c.direction === DIRECTIONS.ES_EN && c.level === level).length,
    enEs: cards.filter((c) => c.direction === DIRECTIONS.EN_ES && c.level === level).length,
  }));

  const trouble = cards
    .filter((c) => c.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong || a.right - b.right)
    .slice(0, 5);

  return {
    total: words.length,
    known,
    mastered,
    answers: right + wrong,
    accuracy: right + wrong > 0 ? right / (right + wrong) : null,
    levels,
    trouble,
  };
}
