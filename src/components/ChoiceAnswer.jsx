import { useEffect } from "react";

// Four options. Keys 1-4 pick an option too.
export default function ChoiceAnswer({ choices, result, onChoose }) {
  useEffect(() => {
    if (result) return;
    function handleKey(e) {
      const index = Number(e.key) - 1;
      if (index >= 0 && index < choices.length) onChoose(choices[index]);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [choices, result, onChoose]);

  return (
    <div className="choices">
      {choices.map((choice, i) => {
        let state = "";
        if (result && choice.correct) state = "right";
        else if (result && choice.wordId === result.chosen) state = "wrong";
        return (
          <button key={choice.wordId} className={`choice ${state}`} disabled={!!result} onClick={() => onChoose(choice)}>
            <span className="choice-key">{i + 1}</span>
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}
