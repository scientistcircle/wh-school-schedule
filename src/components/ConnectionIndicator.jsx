import { useRealtime } from '../contexts/RealtimeContext.jsx';
import { CONNECTION_LABEL } from '../utils/constants.js';
import { formatTime } from '../utils/jakartaTime.js';

export default function ConnectionIndicator() {
  const { status, lastEventAt } = useRealtime();

  const dotClass =
    status === 'live'
      ? 'conn-dot conn-dot--live'
      : status === 'offline'
      ? 'conn-dot conn-dot--offline'
      : 'conn-dot conn-dot--wait';

  return (
    <span className="conn-indicator" title="Status koneksi realtime">
      <span className={dotClass} aria-hidden="true" />
      <span className="conn-indicator__label">{CONNECTION_LABEL[status] ?? status}</span>
      {lastEventAt && status === 'live' && (
        <span className="conn-indicator__time">
          · Diperbarui {formatTime(lastEventAt)} WIB
        </span>
      )}
    </span>
  );
}