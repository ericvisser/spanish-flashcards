import { describe, expect, it } from "vitest";
import words from "../data/words.json";
import {
  cardKey,
  createProfile,
  currentStreak,
  getStudyQueue,
  PLACEMENT_LEVEL,
  recordAnswer,
  spreadPlacement,
} from "./profile.js";
import { addDays, MAX_LEVEL } from "./srs.js";

const DAY = "2026-10-28";
const beginner = () => createProfile({ name: "Test", startRank: 1, newPerDay: 10 }, words, DAY);
const types = (events) => events.map((e) => e.type);

describe("createProfile", () => {
  it("starts a beginner with no cards", () => {
    expect(beginner().cards).toEqual({});
  });

  it("spreads skipped words over several days, both directions", () => {
    const profile = createProfile({ name: "Test", startRank: 51, newPerDay: 10 }, words, DAY);
    const esEn = (rank) => profile.cards[cardKey(words[rank - 1].es, "es-en")];
    const enEs = (rank) => profile.cards[cardKey(words[rank - 1].es, "en-es")];

    // 50 skipped words at 20 a day is 3 days, dealt out in turn.
    expect(Object.keys(profile.cards)).toHaveLength(100);
    expect(esEn(1).level).toBe(PLACEMENT_LEVEL);
    expect(esEn(1).due).toBe(DAY);
    expect(esEn(2).due).toBe(addDays(DAY, 1));
    expect(esEn(3).due).toBe(addDays(DAY, 2));
    expect(esEn(4).due).toBe(DAY);
    expect(enEs(1).due).toBe(addDays(DAY, 3));
    expect(esEn(51)).toBeUndefined();
    expect(profile.placementSpread).toBe(true);
  });

  it("mixes easy and harder skipped words on the first day", () => {
    const profile = createProfile({ name: "Test", startRank: 501, newPerDay: 10 }, words, DAY);
    const { reviews } = getStudyQueue(profile, words, DAY);
    const ranks = reviews.map((r) => words.findIndex((w) => w.es === r.wordId) + 1);
    expect(reviews).toHaveLength(20);
    expect(Math.max(...ranks)).toBeGreaterThan(450);
  });
});

describe("spreadPlacement", () => {
  // An old-style profile: skipped words checked in order, 20 a day, easiest first.
  function oldProfile() {
    const profile = createProfile({ name: "Test", startRank: 101, newPerDay: 10 }, words, DAY);
    words.slice(0, 100).forEach((w, i) => {
      const due = addDays(DAY, Math.floor(i / 20));
      profile.cards[cardKey(w.es, "es-en")].due = due;
      profile.cards[cardKey(w.es, "en-es")].due = addDays(due, 3);
    });
    delete profile.placementSpread;
    return profile;
  }

  it("re-deals unanswered checks across the range, starting today", () => {
    const later = addDays(DAY, 1);
    const profile = spreadPlacement(oldProfile(), words, later);
    const due = (rank, dir = "es-en") => profile.cards[cardKey(words[rank - 1].es, dir)].due;
    expect(due(1)).toBe(later);
    expect(due(2)).toBe(addDays(later, 1));
    expect(due(6)).toBe(later);
    expect(due(1, "en-es")).toBe(addDays(later, 3));
    expect(profile.placementSpread).toBe(true);
  });

  it("leaves answered cards alone", () => {
    const answered = recordAnswer(oldProfile(), "el", "es-en", true, DAY).profile;
    const before = answered.cards["el|es-en"];
    expect(spreadPlacement(answered, words, DAY).cards["el|es-en"]).toBe(before);
  });

  it("only runs once", () => {
    const profile = spreadPlacement(oldProfile(), words, DAY);
    expect(spreadPlacement(profile, words, addDays(DAY, 5))).toBe(profile);
  });
});

describe("getStudyQueue", () => {
  it("offers the most common new words up to the daily limit", () => {
    const { reviews, newWords } = getStudyQueue(beginner(), words, DAY);
    expect(reviews).toEqual([]);
    expect(newWords.map((w) => w.wordId)).toEqual(words.slice(0, 10).map((w) => w.es));
  });

  it("counts words already introduced today against the limit", () => {
    let profile = beginner();
    for (const w of words.slice(0, 4)) profile = recordAnswer(profile, w.es, "es-en", true, DAY).profile;
    const { newWords } = getStudyQueue(profile, words, DAY);
    expect(newWords).toHaveLength(6);
    expect(newWords[0].wordId).toBe(words[4].es);
  });

  it("doesn't count skipped words against the new word limit", () => {
    const profile = createProfile({ name: "Test", startRank: 51, newPerDay: 10 }, words, DAY);
    const { reviews, newWords } = getStudyQueue(profile, words, DAY);
    // 50 skipped words dealt over 3 days: 17, 17, 16.
    expect(reviews).toHaveLength(17);
    expect(newWords).toHaveLength(10);
    expect(newWords[0].wordId).toBe(words[50].es);
  });

  it("puts missed cards back in today's reviews", () => {
    const profile = recordAnswer(beginner(), "ser", "es-en", false, DAY).profile;
    expect(getStudyQueue(profile, words, DAY).reviews).toEqual([{ wordId: "ser", direction: "es-en" }]);
  });

  it("shows a card again once its review day arrives", () => {
    const profile = recordAnswer(beginner(), "ser", "es-en", true, DAY).profile;
    expect(getStudyQueue(profile, words, DAY).reviews).toEqual([]);
    expect(getStudyQueue(profile, words, addDays(DAY, 1)).reviews).toEqual([{ wordId: "ser", direction: "es-en" }]);
  });
});

describe("recordAnswer", () => {
  it("reports a learned word and a level up on the first correct answer", () => {
    const { events } = recordAnswer(beginner(), "ser", "es-en", true, DAY);
    expect(types(events)).toEqual(["answerCorrect", "wordLearned", "levelUp", "streakContinued"]);
  });

  it("unlocks English -> Spanish at level 2", () => {
    let profile = recordAnswer(beginner(), "ser", "es-en", true, DAY).profile;
    expect(profile.cards["ser|en-es"]).toBeUndefined();

    const next = addDays(DAY, 1);
    const result = recordAnswer(profile, "ser", "es-en", true, next);
    expect(types(result.events)).toContain("directionUnlocked");
    expect(result.profile.cards["ser|en-es"].due).toBe(next);
  });

  it("reports mastery at the top level", () => {
    const profile = beginner();
    profile.cards["ser|es-en"] = { level: MAX_LEVEL - 1, due: DAY, introduced: DAY, lastAnswered: null, right: 6, wrong: 0 };
    expect(types(recordAnswer(profile, "ser", "es-en", true, DAY).events)).toContain("wordMastered");
  });

  it("only reports the streak on the first answer of the day", () => {
    const first = recordAnswer(beginner(), "ser", "es-en", true, DAY);
    const second = recordAnswer(first.profile, "de", "es-en", true, DAY);
    expect(types(second.events)).not.toContain("streakContinued");
  });

  it("grows the streak on consecutive days and resets after a gap", () => {
    let profile = recordAnswer(beginner(), "ser", "es-en", true, DAY).profile;
    profile = recordAnswer(profile, "de", "es-en", true, addDays(DAY, 1)).profile;
    expect(profile.streak.count).toBe(2);
    expect(currentStreak(profile, addDays(DAY, 2))).toBe(2);
    expect(currentStreak(profile, addDays(DAY, 3))).toBe(0);

    profile = recordAnswer(profile, "y", "es-en", true, addDays(DAY, 5)).profile;
    expect(profile.streak.count).toBe(1);
  });
});
