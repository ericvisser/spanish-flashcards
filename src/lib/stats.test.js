import { describe, expect, it } from "vitest";
import words from "../data/words.json";
import { createProfile, isValidProfile, recordAnswer } from "./profile.js";
import { buildPracticeQueue } from "./session.js";
import { MAX_LEVEL } from "./srs.js";
import { getStats } from "./stats.js";

const DAY = "2026-10-28";
const beginner = () => createProfile({ name: "Test", startRank: 1, newPerDay: 10 }, words, DAY);

describe("getStats", () => {
  it("starts empty", () => {
    const stats = getStats(beginner(), words);
    expect(stats).toMatchObject({ total: words.length, known: 0, mastered: 0, answers: 0, accuracy: null });
  });

  it("counts known words, accuracy and trouble words", () => {
    let profile = beginner();
    profile = recordAnswer(profile, "ser", "es-en", true, DAY).profile;
    profile = recordAnswer(profile, "de", "es-en", false, DAY).profile;
    profile = recordAnswer(profile, "de", "es-en", false, DAY).profile;

    const stats = getStats(profile, words);
    expect(stats.known).toBe(1);
    expect(stats.accuracy).toBeCloseTo(1 / 3);
    expect(stats.trouble.map((c) => c.wordId)).toEqual(["de"]);
    expect(stats.levels[1].esEn).toBe(1);
    expect(stats.levels[0].esEn).toBe(1);
  });

  it("counts skipped words as known", () => {
    const profile = createProfile({ name: "Test", startRank: 51, newPerDay: 10 }, words, DAY);
    expect(getStats(profile, words).known).toBe(50);
  });

  it("only counts a word as mastered when both directions are", () => {
    const profile = beginner();
    const top = { level: MAX_LEVEL, due: DAY, introduced: DAY, lastAnswered: DAY, right: 7, wrong: 0 };
    profile.cards = { "ser|es-en": top, "de|es-en": top, "de|en-es": top };
    expect(getStats(profile, words).mastered).toBe(1);
  });
});

describe("isValidProfile", () => {
  it("accepts a real profile and rejects anything else", () => {
    const profile = recordAnswer(beginner(), "ser", "es-en", true, DAY).profile;
    expect(isValidProfile(JSON.parse(JSON.stringify(profile)))).toBe(true);
    expect(isValidProfile(null)).toBe(false);
    expect(isValidProfile({ name: "x" })).toBe(false);
    expect(isValidProfile({ ...profile, cards: { "ser|es-en": { level: "high" } } })).toBe(false);
  });
});

describe("buildPracticeQueue", () => {
  it("includes every word in the range once", () => {
    const queue = buildPracticeQueue(words, 11, 20, "en-es");
    expect(queue.map((q) => q.wordId).sort()).toEqual(words.slice(10, 20).map((w) => w.es).sort());
    expect(queue.every((q) => q.direction === "en-es" && !q.isNew)).toBe(true);
  });

  it("mixes directions in mixed mode", () => {
    const directions = new Set(buildPracticeQueue(words, 1, 100, "mixed").map((q) => q.direction));
    expect(directions).toEqual(new Set(["es-en", "en-es"]));
  });
});
