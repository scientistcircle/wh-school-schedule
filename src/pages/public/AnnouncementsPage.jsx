import { useAnnouncements } from '../../hooks/useAnnouncements.js';
import { formatDateLong } from '../../utils/jakartaTime.js';
import { CalendarDays } from 'lucide-react';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import { ImportanceBadge } from '../../components/StatusBadge.jsx';

export default function AnnouncementsPage() {
  const { data, loading, error, refetch } = useAnnouncements(50);

  return (
    <div className="stack" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div className="page-header" style={{ marginBottom: '8px' }}>
        <div>
          <h1>Pengumuman</h1>
          <p className="muted">Informasi kegiatan, perubahan jadwal, dan hal penting lainnya.</p>
        </div>
      </div>

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
        <div className="announce-feed">
          {data.map((a) => (
            <article key={a.id} className="card announce-card">
              <div className="announce-card__header">
                <h2 className="announce-card__title">{a.title}</h2>
                <ImportanceBadge level={a.importance} />
              </div>
              
              <div className="announce-card__body">
                {a.content}
              </div>
              
              <div className="announce-card__footer">
                <CalendarDays size={14} strokeWidth={2.25} />
                <span>
                  Berlaku: {formatDateLong(a.start_date)} – {formatDateLong(a.end_date)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}