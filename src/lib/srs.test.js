import { describe, expect, it } from "vitest";
import { addDays, answerCard, MAX_LEVEL, newCard, toDay } from "./srs.js";

const DAY = "2026-10-28";

describe("dates", () => {
  it("formats local dates", () => {
    expect(toDay(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("adds days across month and year ends", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("answerCard", () => {
  it("moves a new card up to level 1, due tomorrow", () => {
    const card = answerCard(newCard(DAY), true, DAY);
    expect(card.level).toBe(1);
    expect(card.due).toBe("2026-10-29");
  });

  it("uses the interval for the new level", () => {
    const card = answerCard({ ...newCard(DAY), level: 2 }, true, DAY);
    expect(card.level).toBe(3);
    expect(card.due).toBe(addDays(DAY, 7));
  });

  it("drops two levels on a miss and keeps the card due today", () => {
    const card = answerCard({ ...newCard(DAY), level: 5 }, false, DAY);
    expect(card.level).toBe(3);
    expect(card.due).toBe(DAY);
  });

  it("never drops below level 0", () => {
    expect(answerCard({ ...newCard(DAY), level: 1 }, false, DAY).level).toBe(0);
  });

  it("stays at the top level", () => {
    const card = answerCard({ ...newCard(DAY), level: MAX_LEVEL }, true, DAY);
    expect(card.level).toBe(MAX_LEVEL);
    expect(card.due).toBe(addDays(DAY, 120));
  });

  it("doesn't raise the level when a missed card is retried the same day", () => {
    const missed = answerCard({ ...newCard(DAY), level: 5 }, false, DAY);
    const retried = answerCard(missed, true, DAY);
    expect(retried.level).toBe(3);
    expect(retried.due).toBe(addDays(DAY, 7));
  });

  it("schedules a retried level 0 card for tomorrow, not today", () => {
    const missed = answerCard(newCard(DAY), false, DAY);
    const retried = answerCard(missed, true, DAY);
    expect(retried.level).toBe(0);
    expect(retried.due).toBe("2026-10-29");
  });

  it("counts right and wrong answers", () => {
    const card = answerCard(answerCard(newCard(DAY), false, DAY), true, DAY);
    expect(card.right).toBe(1);
    expect(card.wrong).toBe(1);
  });
});
