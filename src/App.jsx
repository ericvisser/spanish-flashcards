import { useState } from "react";
import words from "./data/words.json";
import { emitLearningEvents } from "./lib/events.js";
import { createProfile, getStudyQueue, recordAnswer, spreadPlacement } from "./lib/profile.js";
import { buildPracticeQueue, buildSessionQueue } from "./lib/session.js";
import { toDay } from "./lib/srs.js";
import { clearProfile, loadProfile, saveProfile } from "./lib/storage.js";
import Setup from "./screens/Setup.jsx";
import Home from "./screens/Home.jsx";
import Study from "./screens/Study.jsx";
import Practice from "./screens/Practice.jsx";
import Stats from "./screens/Stats.jsx";
import Settings from "./screens/Settings.jsx";

// Brings an older saved profile (or backup) up to date.
function upgrade(profile) {
  return profile && spreadPlacement(profile, words, toDay());
}

export default function App() {
  const [profile, setProfile] = useState(() => {
    const saved = loadProfile();
    const upgraded = upgrade(saved);
    if (upgraded !== saved) saveProfile(upgraded);
    return upgraded;
  });
  // Which screen is showing: "home", "study", "practice", "stats" or "settings".
  // A study session also carries its queue, and its answer style when it's practice.
  const [view, setView] = useState({ screen: "home" });
  const [saveFailed, setSaveFailed] = useState(false);

  function updateProfile(next) {
    const upgraded = upgrade(next);
    setProfile(upgraded);
    setSaveFailed(!saveProfile(upgraded));
  }

  function handleCreate(choices) {
    updateProfile(createProfile(choices, words, toDay()));
  }

  // Saves the answer and announces what it caused. Returns the events for the session to use.
  function handleAnswer(wordId, direction, correct) {
    const { profile: next, events } = recordAnswer(profile, wordId, direction, correct, toDay());
    updateProfile(next);
    emitLearningEvents(events);
    return events;
  }

  function startStudy() {
    const { reviews, newWords } = getStudyQueue(profile, words, toDay());
    setView({ screen: "study", queue: buildSessionQueue(reviews, newWords) });
  }

  function startPractice({ from, to, direction, mode }) {
    setView({ screen: "study", queue: buildPracticeQueue(words, from, to, direction), practiceMode: mode });
  }

  function handleReset() {
    clearProfile();
    setProfile(null);
    setSaveFailed(false);
    setView({ screen: "home" });
  }

  const goHome = () => setView({ screen: "home" });

  let screen;
  if (!profile) {
    screen = <Setup onCreate={handleCreate} />;
  } else if (view.screen === "study") {
    screen = (
      <Study
        profile={profile}
        words={words}
        initialQueue={view.queue}
        practiceMode={view.practiceMode}
        onAnswer={view.practiceMode ? () => [] : handleAnswer}
        onExit={goHome}
      />
    );
  } else if (view.screen === "practice") {
    screen = <Practice words={words} onStart={startPractice} onBack={goHome} />;
  } else if (view.screen === "stats") {
    screen = <Stats profile={profile} words={words} onBack={goHome} />;
  } else if (view.screen === "settings") {
    screen = <Settings profile={profile} onChange={updateProfile} onReset={handleReset} onBack={goHome} />;
  } else {
    screen = (
      <Home profile={profile} words={words} onStart={startStudy} onNavigate={(s) => setView({ screen: s })} />
    );
  }

  return (
    <main className="app">
      {saveFailed && (
        <p className="banner">
          This browser isn't letting the app save, so progress will be lost when you close the page.
        </p>
      )}
      {screen}
    </main>
  );
}
