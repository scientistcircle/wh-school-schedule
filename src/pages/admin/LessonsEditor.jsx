import { useEffect, useMemo, useState } from 'react';
import { useAsync } from '../../hooks/useAsync.js';
import { listActiveMaster, bulkUpsertLessons, updatePeriod } from '../../services/adminService.js';
import { detectTimeMismatch } from '../../utils/scheduleValidation.js';
import { formatTime } from '../../utils/jakartaTime.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import SearchableSelect from '../../components/SearchableSelect.jsx';
import BulkLessonsForm from '../../components/BulkLessonsForm.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { Clock, Save, X } from 'lucide-react';

export default function LessonsEditor({ day, periods, lessons, activities, onChange }) {
  const toast = useToast();
  const master = useAsync(async () => {
    const [c, t, s, r] = await Promise.all([
      listActiveMaster('classes'), listActiveMaster('teachers'),
      listActiveMaster('subjects'), listActiveMaster('rooms'),
    ]);
    if (c.error || t.error || s.error || r.error) return { error: c.error || t.error || s.error || r.error };
    return { data: { classes: c.data, teachers: t.data, subjects: s.data, rooms: r.data } };
  }, []);

  const [selectedPeriodId, setSelectedPeriodId] = useState(periods[0]?.id ?? null);
  const periodMap = useMemo(() => new Map(periods.map((p) => [p.id, p])), [periods]);
  const currentPeriod = periodMap.get(selectedPeriodId) ?? periods[0] ?? null;

  const lookups = useMemo(() => {
    const m = master.data ?? { classes: [], teachers: [], subjects: [], rooms: [] };
    return { classes: m.classes, teachers: m.teachers, subjects: m.subjects, rooms: m.rooms };
  }, [master.data]);

  const enriched = useMemo(() => {
    return lessons.map((l) => ({
      ...l,
      class: lookups.classes.find(c => c.id === l.class_id),
      teacher: lookups.teachers.find(t => t.id === l.teacher_id),
      subject: lookups.subjects.find(s => s.id === l.subject_id),
      room: lookups.rooms.find(r => r.id === l.room_id),
      period: periodMap.get(l.lesson_period_id),
    }));
  }, [lessons, lookups, periodMap]);

  const lessonsInPeriod = useMemo(() => {
    if (!currentPeriod) return [];
    return enriched.filter((l) => l.lesson_period_id === currentPeriod.id).sort((a, b) => (a.class?.name ?? '').localeCompare(b.class?.name ?? ''));
  }, [enriched, currentPeriod]);

  if (master.loading) return <LoadingState message="Memuat data master…" />;
  if (master.error) return <div className="card"><p className="muted">Gagal memuat data master.</p></div>;
  if (periods.length === 0) return <EmptyState title="Belum ada sesi KBM" description="Tambahkan sesi di tab 'Sesi KBM'." />;

  return (
    <div className="stack-simple">
      <div className="period-nav-wrapper">
        <div className="period-tabs">
          {periods.map((p) => (
            <button
              key={p.id} type="button"
              className={'period-tabs__link' + (p.id === currentPeriod?.id ? ' is-active' : '')}
              onClick={() => setSelectedPeriodId(p.id)}
            >
              {p.period_name}
              <span className="period-tabs__count">{enriched.filter((l) => l.lesson_period_id === p.id).length}</span>
            </button>
          ))}
        </div>
        
        {currentPeriod && (
          <PeriodHeader period={currentPeriod} onPeriodUpdated={onChange} />
        )}
      </div>

      {currentPeriod && (
        <BulkLessonsForm
          key={currentPeriod.id}
          day={day}
          period={currentPeriod}
          classes={lookups.classes}
          teachers={lookups.teachers}
          subjects={lookups.subjects}
          rooms={lookups.rooms}
          existingLessons={lessonsInPeriod}
          onSaved={onChange}
        />
      )}
    </div>
  );
}

function PeriodHeader({ period, onPeriodUpdated }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [start, setStart] = useState(period.start_time.slice(0, 5));
  const [end, setEnd] = useState(period.end_time.slice(0, 5));
  const [busy, setBusy] = useState(false);

  useEffect(() => { setStart(period.start_time.slice(0, 5)); setEnd(period.end_time.slice(0, 5)); }, [period]);

  async function save() {
    if (end <= start) return toast.error('Jam selesai harus setelah mulai.');
    setBusy(true);
    const { error } = await updatePeriod(period.id, { start_time: start, end_time: end });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success('Jam sesi diperbarui.');
    setEditing(false);
    onPeriodUpdated?.();
  }

  return (
    <div className="period-header-compact">
      {!editing ? (
        <>
          <span className="muted"><Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> {formatTime(period.start_time)}–{formatTime(period.end_time)}</span>
          <button type="button" className="btn btn--ghost btn-xs" onClick={() => setEditing(true)}>Ubah Jam</button>
        </>
      ) : (
        <>
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border)' }} />
          <span>–</span>
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border)' }} />
          <button type="button" className="btn btn--primary btn-xs" onClick={save} disabled={busy}><Save size={14}/></button>
          <button type="button" className="btn btn--ghost btn-xs" onClick={() => setEditing(false)} disabled={busy}><X size={14}/></button>
        </>
      )}
    </div>
  );
}