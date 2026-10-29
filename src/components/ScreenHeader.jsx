export default function ScreenHeader({ title, onBack }) {
  return (
    <div className="screen-header">
      <button className="link" onClick={onBack}>
        ← Back
      </button>
      <h1>{title}</h1>
    </div>
  );
}
