export default function LoadingState({ message = 'Memuat data…', compact = false }) {
  return (
    <div className={`state-block ${compact ? 'state-block--compact' : ''}`} role="status">
      <span className="spinner" aria-hidden="true" />
      <p className="state-block__message">{message}</p>
    </div>
  );
}