import { Link, useParams } from 'react-router-dom';
import { useSchoolDay } from '../../hooks/useSchoolDay.js';
import { useAnnouncements } from '../../hooks/useAnnouncements.js';
import { useClasses } from '../../hooks/useClasses.js';
import { todayJakarta, formatTime, formatDateLong, formatDateTime } from '../../utils/jakartaTime.js';
import { SCHOOL_DAY_STATUS_LABEL, PERIOD_LABEL } from '../../utils/constants.js';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import StatusBadge, { ImportanceBadge } from '../../components/StatusBadge.jsx';
import DateNavigator from '../../components/DateNavigator.jsx';
import { useAutoRefresh } from '../../hooks/useAutoRefresh.js';

export default function HomePage() {
  const { date: dateParam } = useParams();
  const today = dateParam || todayJakarta();
  const { data, loading, error, refetch } = useSchoolDay(today);
useAutoRefresh(refetch);
  const ann = useAnnouncements(3);
  const classes = useClasses();

  return (
    <div className="stack">
      <DateNavigator dateString={today} basePath="/tanggal" />

      {loading && <LoadingState message="Memuat jadwal hari ini…" />}

      {error && (
        <ErrorState
          title="Gagal memuat jadwal"
          description={error.message}
          onRetry={refetch}
        />
      )}

      {!loading && !error && !data && (
        <EmptyState
          title="Belum ada jadwal untuk hari ini"
          description={`Jadwal untuk ${formatDateLong(today)} belum dipublikasikan. Silakan pilih tanggal lain atau hubungi admin.`}
        />
      )}

      {data && <HomeContent data={data} today={today} classes={classes.data ?? []} />}

      <AnnouncementPreview state={ann} />
    </div>
  );
}

function HomeContent({ data, today, classes }) {
  const { day, activities, duty, periods } = data;
  const lessonsToday = data.lessons;

  return (
    <>
      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Status Jadwal</h2>
          <StatusBadge status={day.status} />
        </div>
        <dl className="meta-grid">
          <div>
            <dt>Tanggal</dt>
            <dd>{formatDateLong(day.schedule_date)}</dd>
          </div>
          <div>
            <dt>Terakhir diperbarui</dt>
            <dd>{day.updated_at ? formatDateTime(day.updated_at) + ' WIB' : '-'}</dd>
          </div>
          <div>
            <dt>Dipublikasikan pada</dt>
            <dd>{day.published_at ? formatDateTime(day.published_at) + ' WIB' : '-'}</dd>
          </div>
        </dl>
        {day.status !== 'published' && (
          <p className="notice notice--warn">
            Jadwal hari ini belum dipublikasikan. Data yang tampil mungkin masih berupa draft.
          </p>
        )}
      </section>

      <div className="grid-2">
        <section className="card">
          <h3 className="card__title">Guru Piket</h3>
          {duty.length === 0 ? (
            <p className="muted">Belum ada data guru piket.</p>
          ) : (
            <ul className="pill-list">
              {duty.map((d) => (
                <li key={d.id} className="pill">{d.teacher?.name ?? '-'}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h3 className="card__title">Agenda Harian</h3>
          {activities.length === 0 ? (
            <p className="muted">Belum ada agenda.</p>
          ) : (
            <ul className="agenda-list">
              {activities.map((a) => (
                <li key={a.id} className="agenda-list__item">
                  <span className="agenda-list__name">{a.activity_name}</span>
                  <span className="agenda-list__time">
                    {formatTime(a.start_time)}–{formatTime(a.end_time)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Jadwal KBM</h2>
          <div className="card__actions">
            <Link to={`/sesi/KBM1?tanggal=${today}`} className="btn btn--ghost">
              Lihat per Sesi
            </Link>
            <Link to={`/kelas/${classes[0]?.id ?? ''}?tanggal=${today}`} className="btn btn--ghost">
              Lihat per Kelas
            </Link>
          </div>
        </div>

        {lessonsToday.length === 0 ? (
          <EmptyState
            title="Tidak ada pelajaran"
            description="Belum ada entri pelajaran yang dipublikasikan untuk hari ini."
          />
        ) : (
          <HomeLessonsBySession lessons={lessonsToday} periods={periods} classes={classes} today={today} />
        )}
      </section>
    </>
  );
}

// Tampilkan lessons hari ini dikelompokkan per sesi KBM.
function HomeLessonsBySession({ lessons, periods, classes, today }) {
  const sortedPeriods = [...periods].sort((a, b) => a.display_order - b.display_order);
  const byPeriod = new Map();
  for (const l of lessons) {
    const pid = l.period?.id;
    if (!pid) continue;
    if (!byPeriod.has(pid)) byPeriod.set(pid, []);
    byPeriod.get(pid).push(l);
  }

  return (
    <div className="session-stack">
      {sortedPeriods.map((p) => {
        const rows = byPeriod.get(p.id) ?? [];
        if (rows.length === 0) return null;
        rows.sort((a, b) => (a.class?.name ?? '').localeCompare(b.class?.name ?? ''));
        return (
          <div key={p.id} className="session-card">
            <div className="session-card__header">
              <h3 className="session-card__title">
                {PERIOD_LABEL[p.period_code] ?? p.period_name}
              </h3>
              <span className="session-card__time">
                {formatTime(p.start_time)}–{formatTime(p.end_time)}
              </span>
            </div>
            <ul className="session-classes">
              {rows.map((l) => (
                <li key={l.id} className="session-classes__item">
                  <Link
                    to={`/kelas/${l.class?.id}?tanggal=${today}`}
                    className="session-classes__class"
                  >
                    {l.class?.name}
                  </Link>
                  <span className="session-classes__subject">{l.subject?.name}</span>
                  <span className="session-classes__teacher">
                    {l.teacher?.name}
                    {l.substitute_teacher?.name && ` (pengganti: ${l.substitute_teacher.name})`}
                  </span>
                  <span className="session-classes__room">{l.room?.name}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function AnnouncementPreview({ state }) {
  const { data, loading, error } = state;
  return (
    <section className="card">
      <div className="card__header">
        <h2 className="card__title">Pengumuman Terbaru</h2>
        <Link to="/pengumuman" className="btn btn--ghost">Semua pengumuman</Link>
      </div>

      {loading && <LoadingState compact message="Memuat pengumuman…" />}
      {error && <ErrorState title="Gagal memuat pengumuman" description={error.message} />}
      {!loading && !error && (!data || data.length === 0) && (
        <p className="muted">Belum ada pengumuman aktif.</p>
      )}
      {!loading && !error && data?.length > 0 && (
        <ul className="announce-list">
          {data.map((a) => (
            <li key={a.id} className="announce-list__item">
              <div className="announce-list__head">
                <strong>{a.title}</strong>
                <ImportanceBadge level={a.importance} />
              </div>
              <p className="announce-list__body">{a.content}</p>
              <small className="muted">
                Berlaku {a.start_date} s.d. {a.end_date}
              </small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}