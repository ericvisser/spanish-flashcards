// Checks typed answers. Lenient by default: missing accents and one-letter typos still
// count, but come back with a note so the learner sees the right spelling.
import { articlesFor, spanishDisplay } from "./words.js";

export function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[¿?¡!.,;:"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Also turns ñ into n, so a missing tilde counts as an accent slip.
export function stripAccents(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function editDistance(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length];
}

// Short words don't get typo tolerance, or "de" would accept "da".
const TYPO_MIN_LENGTH = 5;

// Finds the closest accepted answer: exact, then accents only, then a one-letter typo.
function closestMatch(input, accepted) {
  const exact = accepted.find((a) => a === input);
  if (exact) return { kind: "exact", answer: exact };

  const bare = stripAccents(input);
  const accent = accepted.find((a) => stripAccents(a) === bare);
  if (accent) return { kind: "accent", answer: accent };

  const typo = accepted.find((a) => a.length >= TYPO_MIN_LENGTH && editDistance(bare, stripAccents(a)) <= 1);
  if (typo) return { kind: "typo", answer: typo };

  return null;
}

// Verbs are stored as "to ___"; the bare verb is accepted too.
export function englishAnswers(word) {
  return word.en.flatMap((a) => (a.startsWith("to ") ? [a, a.slice(3)] : [a])).map(normalize);
}

// Returns { correct, notes }.
export function checkEnglish(input, word) {
  let text = normalize(input);
  if (word.pos === "noun") text = text.replace(/^(the|a|an) /, "");

  const match = closestMatch(text, englishAnswers(word));
  if (!match) return { correct: false, notes: [] };
  return { correct: true, notes: match.kind === "typo" ? [`Small typo: "${match.answer}"`] : [] };
}

// Returns { correct, notes }. `alternatives` are other words sharing the English prompt.
export function checkSpanish(input, word, { strictAccents, requireArticles }, alternatives = []) {
  let text = normalize(input);
  let typedArticle = null;
  const withArticle = text.match(/^(el|la|un|una) (.+)$/);
  if (withArticle) {
    typedArticle = withArticle[1];
    text = withArticle[2];
  }

  function against(w) {
    const article = w.pos === "noun" ? typedArticle : null;
    const match = closestMatch(article ? text : normalize(input), [normalize(w.es)]);
    if (!match) return null;

    let correct = true;
    const notes = [];

    if (match.kind === "accent") {
      if (strictAccents) correct = false;
      notes.push(`Watch the accent: ${w.es}`);
    }
    if (match.kind === "typo") notes.push(`Small typo: ${w.es}`);

    if (w.pos === "noun") {
      const right = articlesFor(w);
      const full = spanishDisplay(w);
      if (article && !right.includes(article)) {
        notes.push(`It's ${full} (${w.gender === "m" ? "masculine" : "feminine"})`);
        if (requireArticles) correct = false;
      } else if (!article && requireArticles) {
        notes.push(`Include the article: ${full}`);
        correct = false;
      }
    }

    return { correct, notes };
  }

  const result = against(word);
  if (result) return result;

  // Another word that also means the prompt counts too, with a note naming the one wanted.
  for (const alt of alternatives) {
    const altResult = against(alt);
    if (altResult) {
      return {
        correct: altResult.correct,
        notes: [...altResult.notes, `${spanishDisplay(alt)} also works! This card's word is ${spanishDisplay(word)}.`],
      };
    }
  }

  return { correct: false, notes: [] };
}
