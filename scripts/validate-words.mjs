// Checks src/data/words.json for mistakes. Run with: node scripts/validate-words.mjs
// Add --shared to list every English prompt that another word also means.
import { readFileSync } from "node:fs";

const POS = ["article", "preposition", "conjunction", "pronoun", "determiner", "adverb", "adjective", "noun", "verb", "number", "interjection"];

const words = JSON.parse(readFileSync(new URL("../src/data/words.json", import.meta.url), "utf8"));
const errors = [];

const seen = new Set();
words.forEach((w, i) => {
  const where = `#${i + 1} (${w.es ?? "?"})`;
  if (w.rank !== i + 1) errors.push(`${where}: rank is ${w.rank}, expected ${i + 1}`);
  if (!w.es) errors.push(`${where}: missing "es"`);
  if (seen.has(w.es)) errors.push(`${where}: duplicate Spanish word`);
  seen.add(w.es);
  if (!Array.isArray(w.en) || w.en.length === 0) errors.push(`${where}: "en" must be a non-empty list`);
  if (!POS.includes(w.pos)) errors.push(`${where}: unknown part of speech "${w.pos}"`);
  if (w.pos === "noun" && !["m", "f"].includes(w.gender)) errors.push(`${where}: nouns need gender "m" or "f"`);
  if (w.pos !== "noun" && w.gender) errors.push(`${where}: only nouns have a gender`);
  if (w.article !== undefined && !(w.article === "el" && w.gender === "f")) {
    errors.push(`${where}: "article" is only for feminine nouns that take "el"`);
  }
  if (!w.example?.es || !w.example?.en) errors.push(`${where}: missing example sentence`);
});

// English -> Spanish prompts that another word also means. The app accepts either answer,
// so these aren't errors, but a hint helps point to the intended word.
const byEnglish = new Map();
for (const w of words) {
  for (const en of w.en) {
    const key = en.toLowerCase();
    if (!byEnglish.has(key)) byEnglish.set(key, []);
    byEnglish.get(key).push(w);
  }
}
const shared = words.filter((w) => byEnglish.get(w.en[0].toLowerCase()).length > 1 && !w.hint);
if (process.argv.includes("--shared")) {
  for (const w of shared) {
    const others = byEnglish.get(w.en[0].toLowerCase()).filter((o) => o !== w);
    console.log(`"${w.es}" prompted as "${w.en[0]}" also matches ${others.map((o) => `"${o.es}"`).join(", ")}`);
  }
}

errors.forEach((m) => console.log(`error: ${m}`));
console.log(`${words.length} words, ${errors.length} errors`);
console.log(`${shared.length} prompts without a hint share their English with another word (both answers are accepted)`);
process.exit(errors.length > 0 ? 1 : 0);
