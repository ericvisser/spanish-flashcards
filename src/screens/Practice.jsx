import { useState } from "react";
import { DIRECTIONS } from "../lib/profile.js";
import ScreenHeader from "../components/ScreenHeader.jsx";

const DIRECTION_OPTIONS = [
  { id: DIRECTIONS.ES_EN, label: "Spanish → English" },
  { id: DIRECTIONS.EN_ES, label: "English → Spanish" },
  { id: "mixed", label: "Mixed" },
];

const MODE_OPTIONS = [
  { id: "choice", label: "Multiple choice" },
  { id: "typing", label: "Typing" },
];

// Drill any range of words. Practice doesn't change the review schedule.
export default function Practice({ words, onStart, onBack }) {
  const last = words.length;
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(Math.min(50, last));
  const [direction, setDirection] = useState(DIRECTIONS.ES_EN);
  const [mode, setMode] = useState("choice");

  const clamp = (n) => Math.min(last, Math.max(1, Math.round(Number(n)) || 1));
  const low = Math.min(clamp(from), clamp(to));
  const high = Math.max(clamp(from), clamp(to));

  function handleSubmit(e) {
    e.preventDefault();
    onStart({ from: low, to: high, direction, mode });
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <ScreenHeader title="Practice" onBack={onBack} />
      <p className="muted">Drill any words you like. This doesn't affect your review schedule.</p>

      <fieldset className="field">
        <legend>Words</legend>
        <div className="range-row">
          <label>
            <small className="muted">From #</small>
            <input type="number" min={1} max={last} value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            <small className="muted">To #</small>
            <input type="number" min={1} max={last} value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
        <p className="muted small">
          {high - low + 1} words. #1 is the most common; the list goes up to #{last}.
        </p>
      </fieldset>

      <fieldset className="field">
        <legend>Direction</legend>
        <div className="segmented">
          {DIRECTION_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              className={direction === o.id ? "selected" : ""}
              onClick={() => setDirection(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>Answer style</legend>
        <div className="segmented">
          {MODE_OPTIONS.map((o) => (
            <button key={o.id} type="button" className={mode === o.id ? "selected" : ""} onClick={() => setMode(o.id)}>
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>

      <button type="submit" className="primary">
        Start practice
      </button>
    </form>
  );
}
