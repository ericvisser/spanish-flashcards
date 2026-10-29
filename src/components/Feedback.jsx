import { DIRECTIONS } from "../lib/profile.js";
import { spanishDisplay } from "../lib/words.js";
import Example from "./Example.jsx";

export default function Feedback({ word, direction, result, canOverride, onContinue, onOverride }) {
  const answer = direction === DIRECTIONS.ES_EN ? word.en.join(", ") : spanishDisplay(word);
  const showAllMeanings = result.correct && direction === DIRECTIONS.ES_EN && word.en.length > 1;

  return (
    <div className={`feedback ${result.correct ? "right" : "wrong"}`}>
      <p className="feedback-title">{result.correct ? "¡Correcto!" : "Not quite"}</p>
      {!result.correct && (
        <p>
          Answer: <strong>{answer}</strong>
        </p>
      )}
      {showAllMeanings && <p className="small">All meanings: {answer}</p>}
      {result.notes.map((note) => (
        <p key={note} className="small note">
          {note}
        </p>
      ))}
      <Example example={word.example} />
      <button className="primary" autoFocus onClick={onContinue}>
        Continue
      </button>
      {canOverride && (
        <button className="link" onClick={onOverride}>
          I was right
        </button>
      )}
    </div>
  );
}
