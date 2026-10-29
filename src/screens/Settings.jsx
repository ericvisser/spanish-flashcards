import { useState } from "react";
import { isValidProfile } from "../lib/profile.js";
import { toDay } from "../lib/srs.js";
import ScreenHeader from "../components/ScreenHeader.jsx";

const NEW_PER_DAY_OPTIONS = [5, 10, 15, 20, 30];

const MODES = [
  { id: "auto", label: "Automatic", description: "Multiple choice for new words, typing once you know them" },
  { id: "choice", label: "Always multiple choice", description: "Easier, good on a phone" },
  { id: "typing", label: "Always typing", description: "Harder, best for remembering" },
];

// Changes save as soon as they're made.
export default function Settings({ profile, onChange, onReset, onBack }) {
  const [importError, setImportError] = useState(null);
  const { settings } = profile;

  function setSetting(key, value) {
    onChange({ ...profile, settings: { ...settings, [key]: value } });
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `spanish-flashcards-${profile.name.toLowerCase().replace(/\W+/g, "-")}-${toDay()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setImportError(null);

    let data;
    try {
      data = JSON.parse(await file.text());
    } catch {
      data = null;
    }
    if (!isValidProfile(data)) {
      setImportError("That file isn't a Spanish Flashcards backup.");
      return;
    }
    if (confirm(`Replace ${profile.name}'s progress with the backup for ${data.name}?`)) onChange(data);
  }

  function handleReset() {
    if (confirm(`Delete ${profile.name}'s progress and start over?`)) onReset();
  }

  return (
    <section className="card">
      <ScreenHeader title="Settings" onBack={onBack} />

      <label className="field">
        <span>Your name</span>
        <input
          value={profile.name}
          onChange={(e) => onChange({ ...profile, name: e.target.value })}
          onBlur={(e) => !e.target.value.trim() && onChange({ ...profile, name: "Amigo" })}
          maxLength={30}
        />
      </label>

      <label className="field">
        <span>New words per day</span>
        <select value={settings.newPerDay} onChange={(e) => setSetting("newPerDay", Number(e.target.value))}>
          {NEW_PER_DAY_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="field">
        <legend>Answer style</legend>
        {MODES.map((mode) => (
          <label key={mode.id} className={`option ${settings.mode === mode.id ? "selected" : ""}`}>
            <input
              type="radio"
              name="mode"
              checked={settings.mode === mode.id}
              onChange={() => setSetting("mode", mode.id)}
            />
            <span>
              <strong>{mode.label}</strong>
              <small>{mode.description}</small>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="field">
        <legend>Typed answers</legend>
        <label className={`option ${settings.strictAccents ? "selected" : ""}`}>
          <input
            type="checkbox"
            checked={settings.strictAccents}
            onChange={(e) => setSetting("strictAccents", e.target.checked)}
          />
          <span>
            <strong>Strict accents</strong>
            <small>A missing accent counts as wrong, not just a warning</small>
          </span>
        </label>
        <label className={`option ${settings.requireArticles ? "selected" : ""}`}>
          <input
            type="checkbox"
            checked={settings.requireArticles}
            onChange={(e) => setSetting("requireArticles", e.target.checked)}
          />
          <span>
            <strong>Require articles</strong>
            <small>Nouns need el or la, like "el día"</small>
          </span>
        </label>
      </fieldset>

      <fieldset className="field">
        <legend>Backup</legend>
        <p className="muted small">
          Progress lives in this browser only. Save a backup file now and then, or to move to another device.
        </p>
        <div className="button-row">
          <button className="secondary" onClick={handleExport}>
            Save backup
          </button>
          <label className="secondary file-button">
            Load backup
            <input type="file" accept="application/json,.json" onChange={handleImport} />
          </label>
        </div>
        {importError && <p className="error small">{importError}</p>}
      </fieldset>

      <button className="link danger" onClick={handleReset}>
        Reset progress
      </button>
    </section>
  );
}
