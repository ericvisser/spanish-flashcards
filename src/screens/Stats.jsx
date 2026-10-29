import { useMemo } from "react";
import { DIRECTIONS } from "../lib/profile.js";
import { getStats } from "../lib/stats.js";
import { indexWords, spanishDisplay } from "../lib/words.js";
import ProgressBar from "../components/ProgressBar.jsx";
import ScreenHeader from "../components/ScreenHeader.jsx";

const LEVEL_NAMES = ["New", "1 day", "3 days", "1 week", "2 weeks", "1 month", "2 months", "4 months"];

export default function Stats({ profile, words, onBack }) {
  const stats = useMemo(() => getStats(profile, words), [profile, words]);
  const wordsById = useMemo(() => indexWords(words), [words]);
  const levelTotals = stats.levels.map((l) => l.esEn + l.enEs);
  const biggest = Math.max(1, ...levelTotals);

  return (
    <section className="card">
      <ScreenHeader title="Stats" onBack={onBack} />

      <ProgressBar known={stats.known} mastered={stats.mastered} total={stats.total} />

      <div className="stats">
        <div>
          <strong>{stats.known}</strong>
          <span>words known</span>
        </div>
        <div>
          <strong>{stats.mastered}</strong>
          <span>mastered</span>
        </div>
        <div>
          <strong>{stats.accuracy === null ? "–" : `${Math.round(stats.accuracy * 100)}%`}</strong>
          <span>accuracy</span>
        </div>
      </div>

      <div className="section">
        <h2>Cards by level</h2>
        <p className="muted small">Both directions together. Higher levels come back less often.</p>
        <div className="level-chart">
          {stats.levels.map((l, i) => (
            <div
              key={l.level}
              className="level-row"
              title={`Level ${l.level}: ${l.esEn} Spanish → English, ${l.enEs} English → Spanish`}
            >
              <span className="level-name">{LEVEL_NAMES[i]}</span>
              <span className="level-track">
                {levelTotals[i] > 0 && (
                  <span className="level-bar" style={{ width: `${(levelTotals[i] / biggest) * 100}%` }} />
                )}
              </span>
              <span className="level-count">{levelTotals[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>Trickiest words</h2>
        {stats.trouble.length === 0 ? (
          <p className="muted small">No misses yet.</p>
        ) : (
          <ul className="trouble">
            {stats.trouble.map((c) => {
              const word = wordsById.get(c.wordId);
              if (!word) return null;
              return (
                <li key={`${c.wordId}|${c.direction}`}>
                  <span>
                    <strong lang="es">{spanishDisplay(word)}</strong> <span className="muted">{word.en[0]}</span>
                  </span>
                  <span className="muted small">
                    {c.direction === DIRECTIONS.ES_EN ? "ES → EN" : "EN → ES"} · missed {c.wrong}×
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="muted small">{stats.answers} answers so far.</p>
    </section>
  );
}
