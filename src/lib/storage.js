// The only place that reads or writes saved progress. Today that's the browser's
// localStorage; moving to a hosted database later means changing just this file.
//
// localStorage can be missing or throw (private windows, blocked site data), so every
// call is wrapped and failures are reported instead of crashing the app.

const PROFILE_KEY = "spanish-flashcards:profile";

export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Returns false if the profile couldn't be saved.
export function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

export function clearProfile() {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    // Nothing saved to clear.
  }
}
