import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Belum ada data', description, action, icon: Icon = Inbox }) {
  return (
    <div className="state-block state-block--empty" role="status">
      <div className="state-block__icon" aria-hidden="true">
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <h3 className="state-block__title">{title}</h3>
      {description && <p className="state-block__message">{description}</p>}
      {action && <div className="state-block__action">{action}</div>}
    </div>
  );
}