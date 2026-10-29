// Spaced repetition rules for a single card. Pure functions: no storage, no React.
//
// Days are local calendar dates as "YYYY-MM-DD" strings, so they compare correctly
// as plain strings and reviews come due at midnight rather than at the exact hour.

// Days until the next review at each level. Level 0 means "again this session".
export const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30, 60, 120];
export const MAX_LEVEL = INTERVAL_DAYS.length - 1;

export function toDay(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(day, n) {
  const [y, m, d] = day.split("-").map(Number);
  return toDay(new Date(y, m - 1, d + n));
}

export function newCard(today) {
  return { level: 0, due: today, introduced: today, lastAnswered: null, right: 0, wrong: 0 };
}

export function isDue(card, today) {
  return card.due <= today;
}

// Only the first answer of the day moves a card's level. Later answers the same day
// (retrying a missed card) just reschedule it, so a miss followed by a quick retry
// doesn't earn a long interval.
export function answerCard(card, correct, today) {
  const firstToday = card.lastAnswered !== today;
  const next = {
    ...card,
    lastAnswered: today,
    right: card.right + (correct ? 1 : 0),
    wrong: card.wrong + (correct ? 0 : 1),
  };

  if (!correct) {
    if (firstToday) next.level = Math.max(0, card.level - 2);
    next.due = today;
    return next;
  }

  if (firstToday) next.level = Math.min(MAX_LEVEL, card.level + 1);
  next.due = addDays(today, Math.max(1, INTERVAL_DAYS[next.level]));
  return next;
}
