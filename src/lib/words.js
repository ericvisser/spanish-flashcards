// Helpers for showing words from the word list.

export const ARTICLES = { m: ["el", "un"], f: ["la", "una"] };

// Feminine nouns starting with a stressed "a" take el/un (el agua), marked with article: "el".
export function articlesFor(word) {
  return word.article === "el" ? ["el", "un"] : ARTICLES[word.gender];
}

// Nouns are shown with their article so the gender gets learned with the word.
export function spanishDisplay(word) {
  return word.pos === "noun" ? `${articlesFor(word)[0]} ${word.es}` : word.es;
}

export function indexWords(words) {
  return new Map(words.map((w) => [w.es, w]));
}

// Other words that also mean a word's English prompt, so typing one of them counts too.
export function alternativesFor(word, words) {
  const prompt = word.en[0].toLowerCase();
  return words.filter((w) => w !== word && w.en.some((e) => e.toLowerCase() === prompt));
}
