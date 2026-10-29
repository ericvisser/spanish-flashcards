import { useMemo, useState } from "react";
import { checkEnglish, checkSpanish } from "../lib/answers.js";
import { cardKey, DIRECTIONS } from "../lib/profile.js";
import { makeChoices, NEW_WORD_GAP, pickMode, requeue, RETRY_GAP } from "../lib/session.js";
import { alternativesFor, indexWords, spanishDisplay } from "../lib/words.js";
import ChoiceAnswer from "../components/ChoiceAnswer.jsx";
import Feedback from "../components/Feedback.jsx";
import TypedAnswer from "../components/TypedAnswer.jsx";
import WordIntro from "../components/WordIntro.jsx";

// A study session, one card at a time: today's reviews and new words, or free practice.
// onAnswer is called as soon as the learner continues, so exiting early loses nothing.
// practiceMode ("choice" or "typing") fixes the answer style instead of going by level.
export default function Study({ profile, words, initialQueue, practiceMode, onAnswer, onExit }) {
  const wordsById = useMemo(() => indexWords(words), [words]);
  const [queue, setQueue] = useState(initialQueue);
  const [turn, setTurn] = useState(0);
  const [result, setResult] = useState(null);
  const [tally, setTally] = useState({ right: 0, wrong: 0, introduced: 0 });

  const item = queue[0];
  const word = item && wordsById.get(item.wordId);
  const level = item ? (profile.cards[cardKey(item.wordId, item.direction)]?.level ?? 0) : 0;
  const mode = practiceMode ?? pickMode(level, profile.settings.mode);
  // New options each turn, but stable while the learner looks at them.
  const choices = useMemo(() => (word ? makeChoices(word, item.direction, words) : []), [turn]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return <Summary tally={tally} practice={!!practiceMode} onDone={onExit} />;

  function nextTurn(rest) {
    setQueue(rest);
    setResult(null);
    setTurn((t) => t + 1);
  }

  function handleIntroDone() {
    setTally((t) => ({ ...t, introduced: t.introduced + 1 }));
    nextTurn(requeue(queue.slice(1), { ...item, isNew: false }, NEW_WORD_GAP));
  }

  function handleTyped(text) {
    const check =
      item.direction === DIRECTIONS.ES_EN
        ? checkEnglish(text, word)
        : checkSpanish(text, word, profile.settings, alternativesFor(word, words));
    setResult({ ...check, given: text });
  }

  function handleChoice(choice) {
    setResult({ correct: choice.correct, notes: [], chosen: choice.wordId });
  }

  function finish(final) {
    const events = onAnswer(item.wordId, item.direction, final.correct);
    let rest = queue.slice(1);
    if (!final.correct) rest = requeue(rest, item, RETRY_GAP);
    for (const e of events) {
      if (e.type === "directionUnlocked") rest.push({ wordId: e.wordId, direction: e.direction, isNew: false });
    }
    setTally((t) => ({ ...t, right: t.right + (final.correct ? 1 : 0), wrong: t.wrong + (final.correct ? 0 : 1) }));
    nextTurn(rest);
  }

  return (
    <section className="card study">
      <div className="study-header">
        <span className="muted small">{queue.length} left</span>
        <button className="link" onClick={onExit}>
          Exit
        </button>
      </div>

      {item.isNew ? (
        <WordIntro word={word} onDone={handleIntroDone} />
      ) : (
        <>
          <Prompt word={word} direction={item.direction} />
          {mode === "choice" ? (
            <ChoiceAnswer key={turn} choices={choices} result={result} onChoose={handleChoice} />
          ) : (
            <TypedAnswer
              key={turn}
              spanish={item.direction === DIRECTIONS.EN_ES}
              locked={!!result}
              onSubmit={handleTyped}
            />
          )}
          {result && (
            <Feedback
              word={word}
              direction={item.direction}
              result={result}
              canOverride={mode === "typing" && !result.correct && !!result.given.trim()}
              onContinue={() => finish(result)}
              onOverride={() => finish({ ...result, correct: true })}
            />
          )}
        </>
      )}
    </section>
  );
}

function Prompt({ word, direction }) {
  const toEnglish = direction === DIRECTIONS.ES_EN;
  const details = [word.pos, !toEnglish && word.hint].filter(Boolean).join(" · ");
  return (
    <div className="prompt">
      <p className="prompt-label">{toEnglish ? "Spanish → English" : "English → Spanish"}</p>
      <p className="prompt-word" lang={toEnglish ? "es" : "en"}>
        {toEnglish ? spanishDisplay(word) : word.en[0]}
      </p>
      <p className="muted small">{details}</p>
    </div>
  );
}

function Summary({ tally, practice, onDone }) {
  const answered = tally.right + tally.wrong;
  return (
    <section className="card">
      <h1>{answered > 0 ? "¡Buen trabajo!" : "All caught up"}</h1>
      {answered > 0 ? (
        <div className="stats">
          <div>
            <strong>{tally.right}</strong>
            <span>right</span>
          </div>
          <div>
            <strong>{tally.wrong}</strong>
            <span>missed</span>
          </div>
          {!practice && (
            <div>
              <strong>{tally.introduced}</strong>
              <span>new words</span>
            </div>
          )}
        </div>
      ) : (
        <p className="muted">Nothing left to study today. Come back tomorrow.</p>
      )}
      <button className="primary" autoFocus onClick={onDone}>
        Back home
      </button>
    </section>
  );
}
