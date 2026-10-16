import { AlertTriangle } from 'lucide-react';

export default function ErrorState({
  title = 'Terjadi kesalahan',
  description,
  onRetry,
}) {
  return (
    <div className="state-block state-block--error" role="alert">
      <div className="state-block__icon" aria-hidden="true">
        <AlertTriangle size={22} strokeWidth={1.75} />
      </div>
      <h3 className="state-block__title">{title}</h3>
      {description && <p className="state-block__message">{description}</p>}
      {onRetry && (
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          Coba lagi
        </button>
      )}
    </div>
  );
}