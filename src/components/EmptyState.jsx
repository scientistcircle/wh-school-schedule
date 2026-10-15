export default function EmptyState({
  title = 'Belum ada data',
  description,
  action,
}) {
  return (
    <div className="state-block state-block--empty" role="status">
      <div className="state-block__icon" aria-hidden="true">📭</div>
      <h3 className="state-block__title">{title}</h3>
      {description && <p className="state-block__message">{description}</p>}
      {action && <div className="state-block__action">{action}</div>}
    </div>
  );
}