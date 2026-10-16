import { Link, useParams } from 'react-router-dom';
import { ArrowRight, RefreshCw, Users, Clock, Megaphone } from 'lucide-react';
import { useSchoolDay } from '../../hooks/useSchoolDay.js';
import { useAnnouncements } from '../../hooks/useAnnouncements.js';
import { useAutoRefresh } from '../../hooks/useAutoRefresh.js';
import {
  todayJakarta,
  formatTime,
  formatDateLong,
  formatDateTime,
} from '../../utils/jakartaTime.js';
import { PERIOD_LABEL } from '../../utils/constants.js';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import StatusBadge, { ImportanceBadge } from '../../components/StatusBadge.jsx';
import DateNavigator from '../../components/DateNavigator.jsx';

export default function HomePage() {
  const { date: dateParam } = useParams();
  const today = dateParam || todayJakarta();

  const { data, loading, error, refetch } = useSchoolDay(today);
  const ann = useAnnouncements(3);
  useAutoRefresh(refetch);

  return (
    <div className="home">
      <DateNavigator dateString={today} basePath="/tanggal" />

      {loading && <LoadingState message="Memuat jadwal…" />}

      {error && (
        <ErrorState
          title="Gagal memuat jadwal"
          description={error.message}
          onRetry={refetch}
        />
      )}

      {!loading && !error && !data && (
        <EmptyState
          title="Belum ada jadwal"
          description={`Jadwal untuk ${formatDateLong(today)} belum dipublikasikan.`}
        />
      )}

      {data && (
        <>
          <HeroStrip day={data.day} today={today} />
          <InfoStrip activities={data.activities} duty={data.duty} />
          <ScheduleSection data={data} today={today} />
        </>
      )}

      <AnnouncementStrip state={ann} />
    </div>
  );
}

/* ============================================================
   Hero — tanggal besar + status + tombol aksi
   ============================================================ */
function HeroStrip({ day, today }) {
  return (
    <section className="hero">
      <div className="hero__main">
        <span className="hero__eyebrow">Jadwal hari</span>
        <h1 className="hero__date">{formatDateLong(today)}</h1>
        <div className="hero__meta">
          <StatusBadge status={day.status} />
          {day.updated_at && (
            <span className="hero__updated">
              <RefreshCw size={12} strokeWidth={2.25} />
              {formatDateTime(day.updated_at)} WIB
            </span>
          )}
        </div>
      </div>

      <div className="hero__actions">
        <Link to={`/sesi/KBM1?tanggal=${today}`} className="btn btn--primary">
          <Clock size={15} strokeWidth={2} />
          <span>Per Sesi</span>
        </Link>
        <Link to={`/kelas?tanggal=${today}`} className="btn btn--ghost">
          <ArrowRight size={15} strokeWidth={2} />
          <span>Per Kelas</span>
        </Link>
      </div>
    </section>
  );
}

/* ============================================================
   Info strip — guru piket + agenda (auto-hide kalau kosong)
   ============================================================ */
function InfoStrip({ activities, duty }) {
  const hasDuty = duty.length > 0;
  const hasAgenda = activities.length > 0;

  if (!hasDuty && !hasAgenda) return null;

  return (
    <section className="info-strip">
      {hasDuty && (
        <div className="info-strip__block">
          <span className="info-strip__label">
            <Users size={13} strokeWidth={2.25} />
            Guru Piket
          </span>
          <div className="info-strip__values">
            {duty.map((d) => (
              <span key={d.id} className="chip">
                {d.teacher?.name ?? '-'}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasAgenda && (
        <div className="info-strip__block info-strip__block--grow">
          <span className="info-strip__label">
            <Clock size={13} strokeWidth={2.25} />
            Agenda
          </span>
          <div className="info-strip__values info-strip__values--scroll">
            {activities.map((a) => (
              <span key={a.id} className="chip chip--outline">
                <strong>{a.activity_name}</strong>
                <span className="chip__time">
                  {formatTime(a.start_time)}–{formatTime(a.end_time)}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ============================================================
   Jadwal KBM — grid kartu per sesi
   ============================================================ */
function ScheduleSection({ data, today }) {
  const { lessons, periods, day } = data;

  if (lessons.length === 0) {
    return (
      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Jadwal KBM</h2>
        </div>
        <EmptyState
          title="Belum ada pelajaran"
          description="Belum ada entri pelajaran untuk hari ini."
        />
      </section>
    );
  }

  const byPeriod = new Map();
  for (const l of lessons) {
    const pid = l.period?.id;
    if (!pid) continue;
    if (!byPeriod.has(pid)) byPeriod.set(pid, []);
    byPeriod.get(pid).push(l);
  }
  const sortedPeriods = [...periods].sort(
    (a, b) => a.display_order - b.display_order
  );
  const totalClasses = new Set(lessons.map((l) => l.class?.id)).size;

  return (
    <section className="schedule">
      <div className="schedule__header">
        <div>
          <h2 className="schedule__title">Jadwal KBM</h2>
          <p className="schedule__subtitle">
            {lessons.length} pelajaran · {totalClasses} kelas ·{' '}
            {sortedPeriods.length} sesi
          </p>
        </div>
        {day.status !== 'published' && (
          <span className="badge badge--status-draft">Draft</span>
        )}
      </div>

      <div className="schedule__grid">
        {sortedPeriods.map((p) => {
          const rows = byPeriod.get(p.id) ?? [];
          if (rows.length === 0) return null;
          rows.sort((a, b) =>
            (a.class?.name ?? '').localeCompare(b.class?.name ?? '')
          );
          return <SessionCard key={p.id} period={p} rows={rows} today={today} />;
        })}
      </div>
    </section>
  );
}

function SessionCard({ period, rows, today }) {
  return (
    <div className="sess">
      <div className="sess__head">
        <span className="sess__name">
          {PERIOD_LABEL[period.period_code] ?? period.period_name}
        </span>
        <span className="sess__time">
          {formatTime(period.start_time)}–{formatTime(period.end_time)}
        </span>
      </div>
      <ul className="sess__list">
        {rows.map((l) => (
          <li
            key={l.id}
            className={'sess__row' + (l.is_cancelled ? ' is-cancelled' : '')}
          >
            <div className="sess__left">
              <Link
                to={`/kelas/${l.class?.id}?tanggal=${today}`}
                className="sess__class"
              >
                {l.class?.name}
              </Link>
              <span className="sess__room">{l.room?.name}</span>
            </div>
            <div className="sess__right">
              <span className="sess__subject">{l.subject?.name}</span>
              <span className="sess__teacher">
                {l.teacher?.name}
                {(l.substitute_teacher?.name || l.substitute_teacher_name) && (
                  <span className="sess__sub">
                    {' '}
                    → {l.substitute_teacher?.name ?? l.substitute_teacher_name}
                  </span>
                )}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============================================================
   Pengumuman ringkas
   ============================================================ */
function AnnouncementStrip({ state }) {
  const { data, loading, error } = state;

  if (!loading && !error && (!data || data.length === 0)) return null;

  return (
    <section className="card announce-compact">
      <div className="card__header">
        <h2 className="card__title">
          <Megaphone size={16} strokeWidth={2.25} />
          Pengumuman
        </h2>
        <Link to="/pengumuman" className="btn btn--ghost btn--xs">
          Semua
          <ArrowRight size={13} strokeWidth={2.25} />
        </Link>
      </div>

      {loading && <LoadingState compact message="Memuat pengumuman…" />}
      {error && (
        <ErrorState title="Gagal memuat pengumuman" description={error.message} />
      )}
      {!loading && !error && data?.length > 0 && (
        <ul className="announce-compact__list">
          {data.map((a) => (
            <li key={a.id} className="announce-compact__item">
              <div className="announce-compact__head">
                <strong>{a.title}</strong>
                <ImportanceBadge level={a.importance} />
              </div>
              <p className="announce-compact__body">{a.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}