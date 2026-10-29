import { describe, expect, it } from "vitest";
import words from "../data/words.json";
import { checkEnglish, checkSpanish, editDistance, normalize } from "./answers.js";
import { alternativesFor, spanishDisplay } from "./words.js";

const word = (es) => words.find((w) => w.es === es);
const lenient = { strictAccents: false, requireArticles: false };
const strict = { strictAccents: true, requireArticles: true };

describe("normalize", () => {
  it("ignores case, punctuation and extra spaces", () => {
    expect(normalize("  ¿Qué   PASA? ")).toBe("qué pasa");
  });
});

describe("editDistance", () => {
  it("counts single-letter changes", () => {
    expect(editDistance("tiempo", "tiempo")).toBe(0);
    expect(editDistance("tiempo", "tiemp")).toBe(1);
    expect(editDistance("tiempo", "teimpo")).toBe(2);
  });
});

describe("checkEnglish", () => {
  it("accepts any listed meaning", () => {
    expect(checkEnglish("weather", word("tiempo")).correct).toBe(true);
    expect(checkEnglish("Time", word("tiempo")).correct).toBe(true);
  });

  it("accepts verbs with or without 'to'", () => {
    expect(checkEnglish("to speak", word("hablar")).correct).toBe(true);
    expect(checkEnglish("talk", word("hablar")).correct).toBe(true);
  });

  it("accepts nouns with an English article", () => {
    expect(checkEnglish("the day", word("día")).correct).toBe(true);
  });

  it("allows a one-letter typo on longer words, with a note", () => {
    const result = checkEnglish("weathr", word("tiempo"));
    expect(result.correct).toBe(true);
    expect(result.notes[0]).toMatch(/typo/);
  });

  it("doesn't allow typos on short words", () => {
    expect(checkEnglish("om", word("en")).correct).toBe(false);
  });

  it("rejects wrong answers", () => {
    expect(checkEnglish("dog", word("tiempo")).correct).toBe(false);
    expect(checkEnglish("", word("tiempo")).correct).toBe(false);
  });
});

describe("checkSpanish", () => {
  it("accepts the exact word", () => {
    expect(checkSpanish("estar", word("estar"), lenient)).toEqual({ correct: true, notes: [] });
  });

  it("accepts a missing accent with a note, unless strict", () => {
    const result = checkSpanish("tambien", word("también"), lenient);
    expect(result.correct).toBe(true);
    expect(result.notes[0]).toMatch(/accent/);
    expect(checkSpanish("tambien", word("también"), strict).correct).toBe(false);
  });

  it("treats a missing tilde as an accent slip", () => {
    expect(checkSpanish("ano", word("año"), lenient).notes[0]).toMatch(/accent/);
  });

  it("accepts nouns with or without the right article", () => {
    expect(checkSpanish("la vez", word("vez"), lenient)).toEqual({ correct: true, notes: [] });
    expect(checkSpanish("una vez", word("vez"), lenient).correct).toBe(true);
    expect(checkSpanish("vez", word("vez"), lenient).correct).toBe(true);
  });

  it("flags the wrong article, and fails it when articles are required", () => {
    const result = checkSpanish("la día", word("día"), lenient);
    expect(result.correct).toBe(true);
    expect(result.notes).toContain("It's el día (masculine)");
    expect(checkSpanish("la día", word("día"), strict).correct).toBe(false);
  });

  it("requires the article when that setting is on", () => {
    expect(checkSpanish("día", word("día"), strict).correct).toBe(false);
    expect(checkSpanish("el día", word("día"), strict).correct).toBe(true);
  });

  it("doesn't treat articles specially on words that aren't nouns", () => {
    expect(checkSpanish("el", word("el"), strict).correct).toBe(true);
  });

  it("rejects the wrong word", () => {
    expect(checkSpanish("ser", word("estar"), lenient).correct).toBe(false);
  });

  it("accepts another word with the same meaning, naming the intended one", () => {
    const result = checkSpanish("cariño", word("miel"), lenient, alternativesFor(word("miel"), words));
    expect(result.correct).toBe(true);
    expect(result.notes.at(-1)).toBe("el cariño also works! This card's word is la miel.");
  });

  it("uses el for feminine nouns marked with it", () => {
    expect(spanishDisplay(word("agua"))).toBe("el agua");
    expect(checkSpanish("el agua", word("agua"), strict)).toEqual({ correct: true, notes: [] });
    expect(checkSpanish("la agua", word("agua"), lenient).notes).toContain("It's el agua (feminine)");
  });
});
