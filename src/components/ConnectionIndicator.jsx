import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useRealtime } from '../contexts/RealtimeContext.jsx';
import { CONNECTION_LABEL } from '../utils/constants.js';
import { formatTime } from '../utils/jakartaTime.js';

export default function ConnectionIndicator() {
  const { status, lastEventAt } = useRealtime();

  const Icon = status === 'live' ? Wifi : status === 'offline' ? WifiOff : Loader2;

  return (
    <span className={`conn-indicator conn-indicator--${status}`} title="Status koneksi realtime">
      <Icon
        size={13}
        strokeWidth={2.25}
        className={status === 'live' || status === 'offline' ? '' : 'spin'}
      />
      <span className="conn-indicator__label">{CONNECTION_LABEL[status] ?? status}</span>
      {lastEventAt && status === 'live' && (
        <span className="conn-indicator__time">
          · {formatTime(lastEventAt)} WIB
        </span>
      )}
    </span>
  );
}