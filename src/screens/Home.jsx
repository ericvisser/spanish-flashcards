import { currentStreak, getStudyQueue } from "../lib/profile.js";
import { toDay } from "../lib/srs.js";
import { getStats } from "../lib/stats.js";
import ProgressBar from "../components/ProgressBar.jsx";

export default function Home({ profile, words, onStart, onNavigate }) {
  const today = toDay();
  const { reviews, newWords } = getStudyQueue(profile, words, today);
  const streak = currentStreak(profile, today);
  const stats = getStats(profile, words);
  const hasWork = reviews.length + newWords.length > 0;

  return (
    <section className="card">
      <div className="home-header">
        <h1>¡Hola, {profile.name}!</h1>
        <span className={`streak ${streak > 0 ? "active" : ""}`} title="Days in a row you've studied">
          {streak} day streak
        </span>
      </div>

      <div className="today">
        <p className="today-title">Today</p>
        <div className="today-counts">
          <span>
            <strong>{reviews.length}</strong> {reviews.length === 1 ? "review" : "reviews"}
          </span>
          <span>
            <strong>{newWords.length}</strong> new {newWords.length === 1 ? "word" : "words"}
          </span>
        </div>
        {hasWork ? (
          <button className="primary" autoFocus onClick={onStart}>
            Start studying
          </button>
        ) : (
          <p className="muted">All caught up for today. Come back tomorrow, or practice below.</p>
        )}
      </div>

      <ProgressBar known={stats.known} mastered={stats.mastered} total={stats.total} />

      <nav className="home-nav">
        <button className="secondary" onClick={() => onNavigate("practice")}>
          Practice
        </button>
        <button className="secondary" onClick={() => onNavigate("stats")}>
          Stats
        </button>
        <button className="secondary" onClick={() => onNavigate("settings")}>
          Settings
        </button>
      </nav>
    </section>
  );
}
