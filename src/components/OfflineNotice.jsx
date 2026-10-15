import { useRealtime } from '../contexts/RealtimeContext.jsx';

// Tampilkan peringatan saat browser offline — data yang tampil berasal dari cache.
export default function OfflineNotice() {
  const { online } = useRealtime();
  if (online) return null;

  return (
    <div className="offline-notice" role="status">
      <strong>Offline.</strong>{' '}
      Jadwal yang ditampilkan berasal dari cache dan mungkin belum mencakup perubahan terbaru.
    </div>
  );
}