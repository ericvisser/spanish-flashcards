import { describe, expect, it } from "vitest";
import words from "../data/words.json";
import { cardKey, createProfile, currentStreak, getStudyQueue, PLACEMENT_LEVEL, recordAnswer } from "./profile.js";
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

    expect(Object.keys(profile.cards)).toHaveLength(100);
    expect(esEn(1).level).toBe(PLACEMENT_LEVEL);
    expect(esEn(1).due).toBe(DAY);
    expect(esEn(20).due).toBe(DAY);
    expect(esEn(21).due).toBe(addDays(DAY, 1));
    expect(esEn(50).due).toBe(addDays(DAY, 2));
    expect(enEs(1).due).toBe(addDays(DAY, 3));
    expect(esEn(51)).toBeUndefined();
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
    expect(reviews).toHaveLength(20);
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
