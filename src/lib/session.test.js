import { describe, expect, it } from "vitest";
import words from "../data/words.json";
import { buildSessionQueue, makeChoices, pickMode, requeue } from "./session.js";

const word = (es) => words.find((w) => w.es === es);
const item = (wordId) => ({ wordId, direction: "es-en" });

describe("pickMode", () => {
  it("uses multiple choice for low levels and typing after, in auto mode", () => {
    expect(pickMode(0, "auto")).toBe("choice");
    expect(pickMode(1, "auto")).toBe("choice");
    expect(pickMode(2, "auto")).toBe("typing");
  });

  it("respects a fixed mode setting", () => {
    expect(pickMode(0, "typing")).toBe("typing");
    expect(pickMode(5, "choice")).toBe("choice");
  });
});

describe("buildSessionQueue", () => {
  it("spreads new words between reviews", () => {
    const queue = buildSessionQueue([item("r1"), item("r2"), item("r3")], [item("n1"), item("n2")]);
    expect(queue.map((q) => q.wordId)).toEqual(["n1", "r1", "r2", "n2", "r3"]);
    expect(queue.map((q) => q.isNew)).toEqual([true, false, false, true, false]);
  });
});

describe("requeue", () => {
  it("puts an item a few places back, or at the end of a short queue", () => {
    expect(requeue(["a", "b", "c", "d"], "x", 3)).toEqual(["a", "b", "c", "x", "d"]);
    expect(requeue(["a"], "x", 3)).toEqual(["a", "x"]);
  });
});

describe("makeChoices", () => {
  it("gives four different options with exactly one correct", () => {
    const choices = makeChoices(word("hablar"), "es-en", words);
    expect(choices).toHaveLength(4);
    expect(new Set(choices.map((c) => c.wordId)).size).toBe(4);
    expect(choices.filter((c) => c.correct)).toHaveLength(1);
  });

  it("uses the same part of speech for distractors when it can", () => {
    const choices = makeChoices(word("hablar"), "es-en", words);
    for (const c of choices) expect(word(c.wordId).pos).toBe("verb");
  });

  it("never offers a distractor that shares a meaning with the answer", () => {
    // ser and estar both mean "to be"; de and desde both mean "from".
    for (let i = 0; i < 20; i++) {
      expect(makeChoices(word("ser"), "en-es", words).map((c) => c.wordId)).not.toContain("estar");
      expect(makeChoices(word("de"), "es-en", words).map((c) => c.wordId)).not.toContain("desde");
    }
  });

  it("labels options in the answer's language", () => {
    const toEnglish = makeChoices(word("día"), "es-en", words).find((c) => c.correct);
    const toSpanish = makeChoices(word("día"), "en-es", words).find((c) => c.correct);
    expect(toEnglish.label).toBe("day");
    expect(toSpanish.label).toBe("el día");
  });
});
