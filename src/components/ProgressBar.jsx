// Progress through the word list: mastered inside known inside the total.
export default function ProgressBar({ known, mastered, total }) {
  const percent = (n) => `${total > 0 ? (n / total) * 100 : 0}%`;
  return (
    <div className="progress">
      <div className="progress-label">
        <span>
          <strong>{known}</strong> of {total.toLocaleString()} words
        </span>
        <span className="muted small">{mastered} mastered</span>
      </div>
      <div className="progress-track" title={`${known} known, ${mastered} mastered, of ${total}`}>
        <span className="progress-known" style={{ width: percent(known) }} />
        <span className="progress-mastered" style={{ width: percent(mastered) }} />
      </div>
    </div>
  );
}
