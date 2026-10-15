import { useAnnouncements } from '../../hooks/useAnnouncements.js';
import { formatDateLong } from '../../utils/jakartaTime.js';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import { ImportanceBadge } from '../../components/StatusBadge.jsx';
import { useAutoRefresh } from '../../hooks/useAutoRefresh.js';

export default function AnnouncementsPage() {
  const { data, loading, error, refetch } = useAnnouncements(50);
useAutoRefresh(refetch);

  return (
    <div className="stack">
      <h1>Pengumuman</h1>
      <p className="muted">
        Informasi kegiatan, perubahan jadwal, dan hal penting lainnya.
      </p>

      {loading && <LoadingState message="Memuat pengumuman…" />}
      {error && (
        <ErrorState
          title="Gagal memuat pengumuman"
          description={error.message}
          onRetry={refetch}
        />
      )}
      {!loading && !error && (!data || data.length === 0) && (
        <EmptyState
          title="Belum ada pengumuman"
          description="Pengumuman dari admin akan muncul di sini."
        />
      )}
      {!loading && !error && data?.length > 0 && (
        <ul className="announce-list announce-list--full">
          {data.map((a) => (
            <li key={a.id} className="announce-list__item">
              <div className="announce-list__head">
                <strong>{a.title}</strong>
                <ImportanceBadge level={a.importance} />
              </div>
              <p className="announce-list__body">{a.content}</p>
              <small className="muted">
                Berlaku {formatDateLong(a.start_date)} – {formatDateLong(a.end_date)}
              </small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}