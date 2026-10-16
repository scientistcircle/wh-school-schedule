import { WifiOff } from 'lucide-react';
import { useRealtime } from '../contexts/RealtimeContext.jsx';

export default function OfflineNotice() {
  const { online } = useRealtime();
  if (online) return null;

  return (
    <div className="offline-notice" role="status">
      <WifiOff size={15} strokeWidth={2.25} />
      <span>
        <strong>Offline.</strong> Jadwal yang ditampilkan berasal dari cache dan
        mungkin belum mencakup perubahan terbaru.
      </span>
    </div>
  );
}