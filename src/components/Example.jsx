export default function Example({ example }) {
  return (
    <div className="example">
      <p lang="es">{example.es}</p>
      <p className="muted">{example.en}</p>
    </div>
  );
}
