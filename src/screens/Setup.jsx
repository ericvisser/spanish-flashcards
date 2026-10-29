import { useState } from "react";
import { START_LEVELS } from "../lib/profile.js";

const NEW_PER_DAY_OPTIONS = [5, 10, 15, 20];

export default function Setup({ onCreate }) {
  const [name, setName] = useState("");
  const [levelId, setLevelId] = useState(START_LEVELS[0].id);
  const [newPerDay, setNewPerDay] = useState(10);

  function handleSubmit(e) {
    e.preventDefault();
    const level = START_LEVELS.find((l) => l.id === levelId);
    onCreate({ name: name.trim(), startRank: level.startRank, newPerDay });
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h1>¡Bienvenido!</h1>
      <p className="muted">Learn the 2,000 most common Spanish words, a few at a time.</p>

      <label className="field">
        <span>Your name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus maxLength={30} />
      </label>

      <fieldset className="field">
        <legend>How much Spanish do you know?</legend>
        {START_LEVELS.map((level) => (
          <label key={level.id} className={`option ${levelId === level.id ? "selected" : ""}`}>
            <input
              type="radio"
              name="level"
              value={level.id}
              checked={levelId === level.id}
              onChange={() => setLevelId(level.id)}
            />
            <span>
              <strong>{level.label}</strong>
              <small>{level.description}</small>
            </span>
          </label>
        ))}
        {levelId !== START_LEVELS[0].id && (
          <p className="muted small">
            Skipped words still come back for a quick check, about 20 a day, so any gaps get caught.
          </p>
        )}
      </fieldset>

      <label className="field">
        <span>New words per day</span>
        <select value={newPerDay} onChange={(e) => setNewPerDay(Number(e.target.value))}>
          {NEW_PER_DAY_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" className="primary" disabled={!name.trim()}>
        Start learning
      </button>
    </form>
  );
}
