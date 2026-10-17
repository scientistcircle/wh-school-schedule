import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { supabase } from '../../services/supabaseClient.js';
import { todayJakarta, formatDateLong, formatDateTime } from '../../utils/jakartaTime.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';

export default function Overview() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    today: null,
    counts: null,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      const today = todayJakarta();
      const [dayRes, classRes, teacherRes, subjectRes, roomRes, annRes] =
        await Promise.all([
          supabase
            .from('school_days')
            .select('id, schedule_date, status, published_at, updated_at')
            .eq('schedule_date', today)
            .maybeSingle(),
          supabase.from('classes').select('id', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('subjects').select('id', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('announcements').select('id', { count: 'exact', head: true }),
        ]);

      if (!alive) return;
      const firstErr = dayRes.error || classRes.error || teacherRes.error;
      setState({
        loading: false,
        error: firstErr,
        today: { date: today, day: dayRes.data ?? null },
        counts: {
          classes: classRes.count ?? 0,
          teachers: teacherRes.count ?? 0,
          subjects: subjectRes.count ?? 0,
          rooms: roomRes.count ?? 0,
          announcements: annRes.count ?? 0,
        },
      });
    })();
    return () => { alive = false; };
  }, []);

  if (state.loading) return <LoadingState message="Memuat ringkasan…" />;
  if (state.error) return <ErrorState description={state.error.message} />;

  const { today, counts } = state;

  // Kondisi untuk Checklist
  const hasClasses = counts.classes > 0;
  const hasTeachers = counts.teachers > 0;
  const hasSchedule = today.day !== null;

  return (
    <div className="stack">
      <h1>Ringkasan</h1>

      {/* ---- CHECKLIST ONBOARDING ---- */}
      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Langkah Cepat Memulai</h2>
        </div>
        <div className="checklist">
          <div className={`checklist__item ${hasClasses ? 'is-done' : ''}`}>
            {hasClasses ? <CheckCircle2 size={20} /> : <Circle size={20} />}
            <span>1. Tambahkan daftar kelas (X1, XI, XII, dll)</span>
            {!hasClasses && (
              <Link to="/admin/kelas" className="btn btn--primary btn--xs">
                Isi Kelas <ArrowRight size={12} />
              </Link>
            )}
          </div>
          
          <div className={`checklist__item ${hasTeachers ? 'is-done' : ''}`}>
            {hasTeachers ? <CheckCircle2 size={20} /> : <Circle size={20} />}
            <span>2. Tambahkan data Guru, Mapel, & Ruang</span>
            {!hasTeachers && (
              <Link to="/admin/master" className="btn btn--primary btn--xs">
                Isi Master <ArrowRight size={12} />
              </Link>
            )}
          </div>

          <div className={`checklist__item ${hasSchedule ? 'is-done' : ''}`}>
            {hasSchedule ? <CheckCircle2 size={20} /> : <Circle size={20} />}
            <span>3. Buat jadwal dan isi pelajarannya</span>
            {!hasSchedule && (
              <Link to="/admin/jadwal" className="btn btn--primary btn--xs">
                Buat Jadwal <ArrowRight size={12} />
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Hari Ini</h2>
          {today.day && <StatusBadge status={today.day.status} />}
        </div>
        <p className="muted">{formatDateLong(today.date)}</p>

        {today.day ? (
          <>
            <dl className="meta-grid">
              <div>
                <dt>Terakhir diperbarui</dt>
                <dd>{today.day.updated_at ? formatDateTime(today.day.updated_at) + ' WIB' : '-'}</dd>
              </div>
              <div>
                <dt>Dipublikasikan pada</dt>
                <dd>{today.day.published_at ? formatDateTime(today.day.published_at) + ' WIB' : '-'}</dd>
              </div>
            </dl>
            <div className="row-actions row-actions--start">
              <Link to={`/admin/jadwal?tanggal=${today.date}`} className="btn btn--primary">
                Kelola Jadwal Hari Ini
              </Link>
              <Link to="/admin/jadwal" className="btn btn--ghost">
                Semua Jadwal
              </Link>
            </div>
          </>
        ) : (
          <>
            <p>Belum ada jadwal untuk hari ini.</p>
            <Link to={`/admin/jadwal?tanggal=${today.date}`} className="btn btn--primary">
              Buat Jadwal Hari Ini
            </Link>
          </>
        )}
      </section>

      <section className="stat-grid">
        <StatCard label="Kelas Aktif" value={counts.classes} to="/admin/kelas" />
        <StatCard label="Guru Aktif" value={counts.teachers} to="/admin/master" />
        <StatCard label="Mata Pelajaran" value={counts.subjects} to="/admin/master" />
        <StatCard label="Ruang" value={counts.rooms} to="/admin/master" />
        <StatCard label="Pengumuman" value={counts.announcements} to="/admin/pengumuman" />
      </section>
    </div>
  );
}

function StatCard({ label, value, to }) {
  return (
    <Link to={to} className="stat-card">
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">{value}</span>
    </Link>
  );
}