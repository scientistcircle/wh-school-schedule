import { useMemo } from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { useSchoolDay } from '../../hooks/useSchoolDay.js';
import { useClasses } from '../../hooks/useClasses.js';
import { todayJakarta, formatDateLong } from '../../utils/jakartaTime.js';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import DateNavigator from '../../components/DateNavigator.jsx';
import ScheduleTable from '../../components/ScheduleTable.jsx';
import { useAutoRefresh } from '../../hooks/useAutoRefresh.js';

export default function ClassSchedulePage() {
  const { classId } = useParams();
  const [params, setParams] = useSearchParams();
  const today = todayJakarta();
  const date = params.get('tanggal') || today;

  const classes = useClasses();
  const { data, loading, error, refetch, notFound } = useSchoolDay(date);
useAutoRefresh(refetch);
  const currentClass = useMemo(
    () => classes.data?.find((c) => c.id === classId),
    [classes.data, classId]
  );

  if (!classId) return <Navigate to="/" replace />;

  const lessonsForClass = data
    ? data.lessons.filter((l) => l.class?.id === classId)
    : [];

  return (
    <div className="stack">
      <DateNavigator
        dateString={date}
        basePath={`/kelas/${classId}`}
        // basePath tidak punya query ?tanggal, jadi pakai handler khusus di bawah
      />

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">
            Jadwal Kelas {currentClass?.name ?? '(memuat…)'}
          </h2>
          {data?.day && <StatusBadge status={data.day.status} />}
        </div>
        <p className="muted">{formatDateLong(date)}</p>

        <ClassPicker
          classes={classes.data ?? []}
          value={classId}
          onChange={(id) => {
            const next = new URLSearchParams(params);
            next.set('tanggal', date);
            window.location.href = `/kelas/${id}?${next.toString()}`;
          }}
        />
      </section>

      {loading && <LoadingState message="Memuat jadwal kelas…" />}
      {error && (
        <ErrorState
          title="Gagal memuat jadwal"
          description={error.message}
          onRetry={refetch}
        />
      )}
      {!loading && !error && (notFound || !data) && (
        <EmptyState
          title="Belum ada jadwal untuk tanggal ini"
          description={`Jadwal ${formatDateLong(date)} belum tersedia.`}
        />
      )}
      {data && (
        lessonsForClass.length === 0 ? (
          <EmptyState
            title="Tidak ada pelajaran"
            description="Kelas ini tidak memiliki pelajaran pada tanggal tersebut."
          />
        ) : (
          <section className="card">
            <ScheduleTable lessons={lessonsForClass} periods={data.periods} />
          </section>
        )
      )}
    </div>
  );
}

function ClassPicker({ classes, value, onChange }) {
  return (
    <div className="class-picker">
      {classes.map((c) => (
        <button
          key={c.id}
          type="button"
          className={'class-picker__btn' + (c.id === value ? ' is-active' : '')}
          onClick={() => onChange(c.id)}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}