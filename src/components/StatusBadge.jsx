import { SCHOOL_DAY_STATUS_LABEL, IMPORTANCE_LABEL } from '../utils/constants.js';

export function StatusBadge({ status }) {
  const label = SCHOOL_DAY_STATUS_LABEL[status] ?? status;
  return (
    <span className={`badge badge--status-${status}`}>{label}</span>
  );
}

export function ImportanceBadge({ level }) {
  return (
    <span className={`badge badge--imp-${level}`}>
      {IMPORTANCE_LABEL[level] ?? level}
    </span>
  );
}

export default StatusBadge;