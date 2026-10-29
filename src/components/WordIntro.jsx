import { spanishDisplay } from "../lib/words.js";
import Example from "./Example.jsx";

// Shown the first time a word comes up, before it's ever quizzed.
export default function WordIntro({ word, onDone }) {
  const details = [word.pos, word.gender && (word.gender === "m" ? "masculine" : "feminine"), word.hint]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="intro">
      <p className="tag">New word</p>
      <p className="prompt-word" lang="es">
        {spanishDisplay(word)}
      </p>
      <p className="intro-meaning">{word.en.join(", ")}</p>
      <p className="muted small">{details}</p>
      <Example example={word.example} />
      <button className="primary" autoFocus onClick={onDone}>
        Got it
      </button>
    </div>
  );
}
