// Learning events, for anything that wants to react to studying (the Pokémon layer, later).
// The learning code only announces what happened; it never knows who is listening.
//
// Event types (all include the fields listed):
//   answerCorrect, answerWrong  { wordId, direction }
//   wordLearned                 { wordId }               first correct Spanish -> English answer
//   levelUp                     { wordId, direction, level }
//   wordMastered                { wordId, direction }    reached the top level
//   directionUnlocked           { wordId, direction }    English -> Spanish opened up
//   streakContinued             { count }                first answer of the day

const listeners = new Set();

// Returns a function that stops listening.
export function onLearningEvent(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitLearningEvents(events) {
  for (const event of events) {
    for (const listener of listeners) listener(event);
  }
}
