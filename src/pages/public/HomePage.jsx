import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  Users, CalendarDays, ArrowRight, UserSearch, Clock, 
  Printer, Camera, MessageCircle 
} from 'lucide-react';
import { useSchoolDay } from '../../hooks/useSchoolDay.js';
import { useAnnouncements } from '../../hooks/useAnnouncements.js';
import { useAutoRefresh } from '../../hooks/useAutoRefresh.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useJakartaClock } from '../../hooks/useJakartaClock.js';
import { getActiveTeachers } from '../../services/masterService.js';
import { todayJakarta, formatDateLong, formatTime } from '../../utils/jakartaTime.js';
import { PERIOD_LABEL } from '../../utils/constants.js';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import StatusBadge, { ImportanceBadge } from '../../components/StatusBadge.jsx';
import DateNavigator from '../../components/DateNavigator.jsx';
import SessionTable from '../../components/SessionTable.jsx';
import SearchableSelect from '../../components/SearchableSelect.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function HomePage() {
  const { date: dateParam } = useParams();
  const today = dateParam || todayJakarta();
  const toast = useToast();
  
  const currentTime = useJakartaClock();
  const actualToday = todayJakarta();
  const isViewingToday = today === actualToday;

  const { data, loading, error, refetch } = useSchoolDay(today);
  const ann = useAnnouncements(3);
  const teachersState = useAsync(() => getActiveTeachers(), []);
  useAutoRefresh(refetch);

  const [selectedTeacher, setSelectedTeacher] = useState('');

  const filteredLessons = (data?.lessons ?? []).filter((l) => {
    if (!selectedTeacher) return true;
    return l.teacher?.id === selectedTeacher || l.substitute_teacher?.id === selectedTeacher;
  });

  const teacherOptions = (teachersState.data ?? []).map((t) => ({
    value: t.id,
    label: t.name,
  }));

  function generateShareText() {
    if (!data) return '';
    let text = `*JADWAL KBM - ${formatDateLong(today).toUpperCase()}*\n\n`;
    
    if (data.duty && data.duty.length > 0) {
      text += `Guru Piket: ${data.duty.map((d) => d.teacher?.name).join(', ')}\n\n`;
    }

    let hasLessons = false;
    data.periods.forEach((period) => {
      const lessons = filteredLessons.filter((l) => l.period?.id === period.id);
      if (lessons.length === 0) return;

      hasLessons = true;
      text += `*${PERIOD_LABEL[period.period_code]}* (${formatTime(period.start_time)} - ${formatTime(period.end_time)})\n`;
      lessons.forEach((l) => {
        text += `• ${l.class?.name}: ${l.subject?.name} (${l.teacher?.name})\n`;
      });
      text += `\n`;
    });

    if (!hasLessons) return '';

    text += `_Dikirim otomatis dari WH School Schedule._`;
    return text;
  }

  function handlePrint() {
    window.print();
  }

  function handleShareWA() {
    const text = generateShareText();
    if (!text) return toast.warning('Tidak ada jadwal pelajaran untuk dibagikan.');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  async function handleShareIG() {
    const text = generateShareText();
    if (!text) return toast.warning('Tidak ada jadwal pelajaran untuk dibagikan.');

    try {
      await navigator.clipboard.writeText(text);
      toast.success('Teks jadwal berhasil disalin! Silakan Paste di Instagram.', 5000);
      window.open('https://instagram.com', '_blank');
    } catch (err) {
      toast.error('Gagal menyalin teks. Browser Anda mungkin memblokir akses clipboard.');
    }
  }

  return (
    <div className="home-simple">
      <div className="home-simple__header">
        <div className="home-simple__title-row">
          <h1 className="home-simple__title">Jadwal Harian</h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {data?.day && <StatusBadge status={data.day.status} />}
            {isViewingToday && currentTime && (
              <span className="badge badge--imp-normal" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> {currentTime} WIB
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="home-toolbar no-print">
        <DateNavigator dateString={today} basePath="/tanggal" />
        
        {data && (
          <div className="home-actions-group">
            <button type="button" className="btn btn--ghost btn-action" onClick={handlePrint} title="Cetak Jadwal">
              <Printer size={16} /> <span className="hide-mobile">Cetak</span>
            </button>
            <button type="button" className="btn btn--wa btn-action" onClick={handleShareWA} title="Bagikan ke WhatsApp">
              <MessageCircle size={16} /> <span className="hide-mobile">WhatsApp</span>
            </button>
            <button type="button" className="btn btn--ig btn-action" onClick={handleShareIG} title="Salin teks & Buka Instagram">
              <Camera size={16} /> <span className="hide-mobile">Instagram</span>
            </button>
          </div>
        )}
      </div>

      {loading && <LoadingState message="Memuat jadwal…" />}

      {error && (
        <ErrorState title="Gagal memuat jadwal" description={error.message} onRetry={refetch} />
      )}

      {!loading && !error && !data && (
        <EmptyState
          title="Belum ada jadwal"
          description={`Jadwal untuk ${formatDateLong(today)} belum dipublikasikan.`}
        />
      )}

      {data && (
        <div className="home-simple__content">
          <div className="home-filters no-print">
            <div className="home-filter-teacher">
              <span className="home-filter-teacher__label">
                <UserSearch size={16} /> Cari Jadwal Guru
              </span>
              <SearchableSelect
                value={selectedTeacher}
                onChange={setSelectedTeacher}
                options={teacherOptions}
                placeholder="— Semua Guru —"
                searchPlaceholder="Ketik nama guru…"
              />
            </div>
            
            <div className="home-info-bar" style={{ flex: 1 }}>
              <div className="home-info-bar__section">
                <span className="home-info-bar__label">
                  <Users size={14} strokeWidth={2.25} /> Guru Piket
                </span>
                <div className="home-info-bar__text">
                  {data.duty && data.duty.length > 0
                    ? data.duty.map((d) => d.teacher?.name).join(' • ')
                    : '—'}
                </div>
              </div>
              <div className="home-info-bar__section home-info-bar__section--grow">
                <span className="home-info-bar__label">
                  <CalendarDays size={14} strokeWidth={2.25} /> Agenda
                </span>
                <div className="home-info-bar__text home-info-bar__text--wrap">
                  {data.activities && data.activities.length > 0
                    ? data.activities.map((a) => `${a.activity_name} (${formatTime(a.start_time)})`).join(' • ')
                    : '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="home-sessions">
            {filteredLessons.length === 0 ? (
              <EmptyState 
                title={selectedTeacher ? "Guru tidak mengajar hari ini" : "Belum ada pelajaran"} 
                description={selectedTeacher ? "Coba pilih nama guru lain atau lihat tanggal berbeda." : ""}
              />
            ) : (
              (data?.periods ?? []).map((period) => {
                const lessonsInPeriod = filteredLessons.filter(
                  (l) => l.period?.id === period.id
                );

                if (lessonsInPeriod.length === 0) return null;

                const start = period.start_time.slice(0, 5);
                const end = period.end_time.slice(0, 5);
                const isOngoing = isViewingToday && currentTime >= start && currentTime < end;

                return (
                  <div 
                    key={period.id} 
                    className={`card card--flush home-session-card ${isOngoing ? 'is-ongoing' : ''}`}
                  >
                    <div className="card__header" style={{ padding: '12px 16px', margin: 0, borderBottom: '1px solid var(--border)' }}>
                      <h2 className="card__title" style={{ fontSize: 'var(--fs-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isOngoing && <span className="live-dot no-print" />}
                        {PERIOD_LABEL[period.period_code] ?? period.period_name}
                        <span className="muted" style={{ marginLeft: 8, fontWeight: 400 }}>
                          {formatTime(period.start_time)}–{formatTime(period.end_time)}
                        </span>
                        {isOngoing && <span className="badge badge--status-published no-print" style={{ marginLeft: '4px' }}>Sedang Berlangsung</span>}
                      </h2>
                      <Link to={`/sesi/${period.period_code}?tanggal=${today}`} className="btn btn--ghost btn--xs no-print">
                        Detail <ArrowRight size={12} />
                      </Link>
                    </div>
                    <SessionTable lessons={lessonsInPeriod} />
                  </div>
                );
              })
            )}
          </div>

          {ann.data && ann.data.length > 0 && (
            <div className="home-announce no-print">
              <div className="home-announce__header">
                <h2>Pengumuman</h2>
                <Link to="/pengumuman" className="btn btn--ghost btn--xs">Semua</Link>
              </div>
              <div className="home-announce__list">
                {ann.data.map((a) => (
                  <div key={a.id} className="home-announce__item">
                    <div className="home-announce__item-head">
                      <strong>{a.title}</strong>
                      <ImportanceBadge level={a.importance} />
                    </div>
                    <p>{a.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}