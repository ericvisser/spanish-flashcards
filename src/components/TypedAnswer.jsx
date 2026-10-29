import { useRef, useState } from "react";

const ACCENT_KEYS = ["á", "é", "í", "ó", "ú", "ü", "ñ", "¿", "¡"];

export default function TypedAnswer({ spanish, locked, onSubmit }) {
  const [text, setText] = useState("");
  const input = useRef(null);

  // Inserts at the cursor and keeps focus in the box, so typing can carry on.
  function insert(char) {
    const el = input.current;
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    setText(text.slice(0, start) + char + text.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + 1, start + 1);
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!locked) onSubmit(text);
  }

  return (
    <form className="typed" onSubmit={handleSubmit}>
      <input
        ref={input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        readOnly={locked}
        autoFocus
        lang={spanish ? "es" : "en"}
        placeholder={spanish ? "Type it in Spanish" : "Type it in English"}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {!locked && (
        <>
          {spanish && (
            <div className="accent-keys">
              {ACCENT_KEYS.map((char) => (
                <button key={char} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insert(char)}>
                  {char}
                </button>
              ))}
            </div>
          )}
          <button type="submit" className="primary">
            {text.trim() ? "Check" : "I don't know"}
          </button>
        </>
      )}
    </form>
  );
}
