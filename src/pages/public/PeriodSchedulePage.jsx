import { useMemo, useState } from 'react';
import { useParams, useSearchParams, Navigate, Link } from 'react-router-dom';
import { useSchoolDay } from '../../hooks/useSchoolDay.js';
import { useClasses } from '../../hooks/useClasses.js';
import { todayJakarta, formatDateLong, formatTime } from '../../utils/jakartaTime.js';
import { PERIOD_CODES, PERIOD_LABEL } from '../../utils/constants.js';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import DateNavigator from '../../components/DateNavigator.jsx';
import SessionTable from '../../components/SessionTable.jsx';
import ClassFilter from '../../components/ClassFilter.jsx';
import { useAutoRefresh } from '../../hooks/useAutoRefresh.js';

export default function PeriodSchedulePage() {
  const { periodCode } = useParams();
  const [params, setParams] = useSearchParams();
  const today = todayJakarta();
  const date = params.get('tanggal') || today;

  const [classId, setClassId] = useState(null);

  const { data, loading, error, refetch, notFound } = useSchoolDay(date);
useAutoRefresh(refetch);
  const classes = useClasses();

  const period = useMemo(
    () => data?.periods.find((p) => p.period_code === periodCode),
    [data, periodCode]
  );

  const lessons = useMemo(() => {
    if (!data || !period) return [];
    let rows = data.lessons.filter((l) => l.period?.id === period.id);
    if (classId) rows = rows.filter((l) => l.class?.id === classId);
    rows.sort((a, b) => (a.class?.name ?? '').localeCompare(b.class?.name ?? ''));
    return rows;
  }, [data, period, classId]);

  if (!periodCode || !PERIOD_CODES.includes(periodCode)) {
    return <Navigate to="/sesi/KBM1" replace />;
  }

  return (
    <div className="stack">
      <DateNavigator dateString={date} basePath="/tanggal" />

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">
            Jadwal {PERIOD_LABEL[periodCode] ?? periodCode}
          </h2>
          {data?.day && <StatusBadge status={data.day.status} />}
        </div>
        <p className="muted">
          {formatDateLong(date)}
          {period && (
            <>
              {' · '}
              {formatTime(period.start_time)}–{formatTime(period.end_time)}
            </>
          )}
        </p>

        <nav className="period-tabs">
          {PERIOD_CODES.map((code) => (
            <Link
              key={code}
              to={`/sesi/${code}?tanggal=${date}`}
              className={'period-tabs__link' + (code === periodCode ? ' is-active' : '')}
            >
              {PERIOD_LABEL[code]}
            </Link>
          ))}
        </nav>

        <ClassFilter
          classes={classes.data ?? []}
          value={classId}
          onChange={setClassId}
        />
      </section>

      {loading && <LoadingState message="Memuat jadwal sesi…" />}
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
      {data && !period && (
        <EmptyState
          title="Sesi tidak tersedia"
          description="Sesi ini tidak ada pada tanggal tersebut."
        />
      )}
      {data && period && (
        lessons.length === 0 ? (
          <EmptyState
            title="Tidak ada pelajaran"
            description={
              classId
                ? 'Kelas yang dipilih tidak memiliki pelajaran pada sesi ini.'
                : 'Belum ada pelajaran untuk sesi ini.'
            }
          />
        ) : (
          <section className="card">
            <SessionTable lessons={lessons} />
          </section>
        )
      )}
    </div>
  );
}