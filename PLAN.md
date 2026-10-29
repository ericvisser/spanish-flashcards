# Spanish Flashcards — Plan

A flashcard web app for learning the ~2,000 most common Spanish words, using spaced repetition. Built for us first, shareable with friends, with a Pokémon game layer planned for later.

## Live site

https://ericvisser.github.io/spanish-flashcards/ (code: https://github.com/ericvisser/spanish-flashcards)

Every push to `main` re-deploys automatically: GitHub checks the word list, runs the tests, builds, and publishes (`.github/workflows/deploy.yml`). If any check fails, the live site stays as it was.

## Running it

From the `spanish-flashcards` folder:

- `npm install`: first time only
- `npm run dev`: start the app at http://localhost:5173
- `npm test`: run the spaced repetition tests
- `npm run validate`: check the word list

## Code layout

- `src/lib/srs.js`: spaced repetition rules for one card (levels, intervals, dates)
- `src/lib/profile.js`: a learner's profile, starting levels, what's due today, recording answers
- `src/lib/storage.js`: the only code that saves or loads progress
- `src/lib/events.js`: learning events for the future game layer
- `src/lib/answers.js`: checking typed answers (accents, typos, articles)
- `src/lib/session.js`: session order, picking multiple choice vs typing, choosing distractors
- `src/lib/words.js`: showing words (nouns with their article)
- `src/lib/stats.js`: numbers for the home and stats screens
- `src/screens/`: Setup, Home, Study (also runs free practice), Practice, Stats, Settings
- `src/components/`: pieces of the study screen (new word card, typed answer, multiple choice, feedback)
- `src/data/words.json`: the word list

## Decisions so far

- **Platform:** web app, React + Vite, hosted free on GitHub Pages.
- **Saving progress:** in each user's browser (no server, no accounts). Each browser/device has its own profile. Export/import backup file available.
- **Future sync:** all saving goes through one storage module, so moving to a hosted database (e.g. Supabase/Firebase) later is a small change.
- **Gamification:** Pokémon via [PokeAPI](https://pokeapi.co), added later. Personal/private use only, since Pokémon is Nintendo's IP.

## First launch / starting level

New users enter a name and pick a level:

| Level | New words start at |
|---|---|
| Beginner, never studied | #1 |
| Know the basics | #250 |
| Some experience | #500 |
| Intermediate | #1000 |

Skipped words are marked "probably known" and trickle back into reviews (~20/day over a few weeks). Correct → they move to longer gaps. Missed → they drop into normal study.

Possible later addition: a short placement quiz that suggests a level.

## Screens

- **Setup:** name, starting level, preferences
- **Home:** reviews due today, new words available, Start button, streak
- **Study session:** due reviews mixed with new words
- **Free practice:** drill any word range without affecting the schedule
- **Stats:** words learned, accuracy, progress toward 2,000
- **Settings:** new words/day, accent strictness, article requirement, preferred mode, export/import

## Spaced repetition

Each word moves through levels with growing review gaps:

| Level | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| Next review | same session | 1 day | 3 days | 1 week | 2 weeks | 1 month | 2 months | 4 months |

- Correct: up one level. Wrong: down two levels (minimum 0) and the card comes back in the same session.
- Only the first answer of the day changes a card's level. Getting a missed card right on the retry just schedules it, so a miss can't be undone the same day.
- Level 7 = mastered. On the stats screen, a word counts as "known" once Spanish → English reaches level 1, and "mastered" once both directions reach level 7.
- Skipped words (from the starting level) start at level 3, both directions, with ~20 coming due per day. The English → Spanish check comes 3 days after the Spanish → English one.

### Two directions per word

- Spanish → English and English → Spanish are tracked separately.
- English → Spanish unlocks when Spanish → English reaches level 2.
- Low levels use multiple choice automatically; higher levels switch to typing. Users can override in settings.

### Study sessions

- One new word, then two reviews, repeating.
- A new word is shown first (meaning, gender, example), then quizzed two cards later.
- A missed card comes back three cards later, until it's answered right.
- When a word unlocks English → Spanish mid-session, that card is added to the end.
- Every answer is saved right away, so exiting early loses nothing.
- Multiple choice answers with keys 1–4; Enter submits and continues.

### Multiple choice distractors

Same part of speech and similar frequency rank, so wrong options can't be ruled out without knowing the word.

## Answer checking

- Default: missing accents and one-letter typos count as correct but are flagged ("watch the accent: *está*"). Strict mode available in settings.
- Optional: require the article for nouns (*el libro*).
- Multiple accepted answers per word (e.g. *tiempo* = time / weather).
- "I was right" override button.
- On-screen buttons for á é í ó ú ü ñ ¿ ¡.

## Word data

Stored in `src/data/words.json`. Each entry:

```json
{ "rank": 17, "es": "estar", "en": ["to be"], "pos": "verb", "hint": "temporary: states, location",
  "example": { "es": "Estoy cansado.", "en": "I am tired." } }
```

- `rank`: frequency rank, 1 = most common
- `es`: Spanish dictionary form (*hablar*, not *hablo*); also used as the word's ID for saved progress
- `en`: accepted English answers. The first one is shown as the English → Spanish prompt
- `pos`: article, preposition, conjunction, pronoun, determiner, adverb, adjective, noun, verb, number, interjection
- `gender`: `m` or `f`, nouns only
- `article` (optional): `"el"` for feminine nouns that take *el* (*el agua*, *el alma*)
- `hint` (optional): shown with the English → Spanish prompt when the English is ambiguous (*ser* vs *estar*, *por* vs *para*, *que* vs *qué*)
- `example`: a short sentence in both languages

Verbs are stored as "to ___"; answer checking also accepts them without "to".

When typing English → Spanish, any word whose meanings include the prompt is accepted (*cariño* for "honey" on the *miel* card), with a note naming the intended word.

`node scripts/validate-words.mjs` checks the file: ranks in order, no duplicates, required fields, genders on nouns. It also counts prompts that share their English with another word; `--shared` lists them, as candidates for hints.

### How the 2,000 were chosen

- Words 1–100 were written first from general knowledge of frequency rankings and kept as-is.
- Words 101–2000 were written in batches by type, then ranked by how often their forms appear in an open subtitle frequency list ([FrequencyWords](https://github.com/hermitdave/FrequencyWords), OpenSubtitles 2018). That list favors conversational Spanish, which suits us.
- The ranking is approximate: verb forms were generated by rule, so irregular verbs can be under- or over-counted. Numbers, months and a few useful phrases were kept regardless of score.
- Translations and examples still need a spot-check by us.

## Game hooks

The learning code emits events and knows nothing about Pokémon:

- word learned
- level up
- word mastered
- answer correct / wrong
- streak continued

The game layer listens for these later.

### Game ideas (later)

| Learning event | Game event |
|---|---|
| Studying new words | Wild encounters |
| Word fully learned | Catching a Pokémon |
| Review level up | Pokémon levels up / evolves |
| Daily streak | Bonus or rare encounters |
| Missed review | Pokémon gets "hurt," needs care |
| Overall progress | Filling the Pokédex |

Bonus: PokeAPI has Spanish names, types, moves and Pokédex descriptions, which make good reading practice later.

## Build order

1. Word list data, starting with the first 100 words
2. Setup screen, storage, spaced repetition engine
3. Study session with all three answer modes
4. Home, stats, settings
5. Fill out the full 2,000 words
6. Deploy to GitHub Pages
7. Later: Pokémon layer
