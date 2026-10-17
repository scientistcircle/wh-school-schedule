import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, Save, X } from 'lucide-react';
import {
  createLesson, updateLesson, deleteLesson,
  listActiveMaster, updatePeriod,
} from '../../services/adminService.js';
import {
  validateLessonInput,
  detectTeacherConflicts,
  detectRoomConflicts,
  detectTimeMismatch,
} from '../../utils/scheduleValidation.js';
import { formatTime } from '../../utils/jakartaTime.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import SearchableSelect from '../../components/SearchableSelect.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import BulkLessonsForm from '../../components/BulkLessonsForm.jsx';


const EMPTY_FORM = {
  class_id: '',
  teacher_id: '',
  subject_id: '',
  room_id: '',
  substitute_teacher_id: '',
  substitute_teacher_name: '',
  notes: '',
  is_cancelled: false,
};

export default function LessonsEditor({ day, periods, lessons, activities, onChange }) {
  const toast = useToast();

  const master = useAsync(async () => {
    const [c, t, s, r] = await Promise.all([
      listActiveMaster('classes'),
      listActiveMaster('teachers'),
      listActiveMaster('subjects'),
      listActiveMaster('rooms'),
    ]);
    if (c.error || t.error || s.error || r.error) {
      return { error: c.error || t.error || s.error || r.error };
    }
    return {
      data: { classes: c.data, teachers: t.data, subjects: s.data, rooms: r.data },
    };
  }, []);

  const [selectedPeriodId, setSelectedPeriodId] = useState(periods[0]?.id ?? null);
const [mode, setMode] = useState('bulk'); // 'single' | 'bulk'
  const periodMap = useMemo(() => new Map(periods.map((p) => [p.id, p])), [periods]);
  const currentPeriod = periodMap.get(selectedPeriodId) ?? periods[0] ?? null;

  const lookups = useMemo(() => {
    const m = master.data ?? { classes: [], teachers: [], subjects: [], rooms: [] };
    return {
      classes: m.classes,
      teachers: m.teachers,
      subjects: m.subjects,
      rooms: m.rooms,
      classById: new Map(m.classes.map((c) => [c.id, c])),
      teacherById: new Map(m.teachers.map((t) => [t.id, t])),
      subjectById: new Map(m.subjects.map((s) => [s.id, s])),
      roomById: new Map(m.rooms.map((r) => [r.id, r])),
    };
  }, [master.data]);

  const enriched = useMemo(() => {
    return lessons.map((l) => ({
      ...l,
      class: lookups.classById.get(l.class_id) ?? null,
      teacher: lookups.teacherById.get(l.teacher_id) ?? null,
      subject: lookups.subjectById.get(l.subject_id) ?? null,
      room: lookups.roomById.get(l.room_id) ?? null,
      substitute_teacher: lookups.teacherById.get(l.substitute_teacher_id) ?? null,
      period: periodMap.get(l.lesson_period_id) ?? null,
    }));
  }, [lessons, lookups, periodMap]);

  const teacherConflicts = useMemo(
    () => detectTeacherConflicts(enriched, periods, lookups.teachers),
    [enriched, periods, lookups.teachers]
  );
  const roomConflicts = useMemo(
    () => detectRoomConflicts(enriched, periods, lookups.rooms),
    [enriched, periods, lookups.rooms]
  );
  const timeMismatches = useMemo(
    () => detectTimeMismatch(activities, periods),
    [activities, periods]
  );

  const lessonsInPeriod = useMemo(() => {
    if (!currentPeriod) return [];
    return enriched
      .filter((l) => l.lesson_period_id === currentPeriod.id)
      .sort((a, b) => (a.class?.name ?? '').localeCompare(b.class?.name ?? ''));
  }, [enriched, currentPeriod]);

  if (master.loading) return <LoadingState message="Memuat data master…" />;
  if (master.error) {
    return (
      <div className="card">
        <p className="muted">Gagal memuat data master: {master.error.message}</p>
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <EmptyState
        title="Belum ada sesi KBM"
        description="Tambahkan sesi KBM di tab 'Sesi KBM' terlebih dahulu sebelum mengisi pelajaran."
      />
    );
  }

  return (
    <div className="stack">
      {(timeMismatches.length > 0 || teacherConflicts.length > 0 || roomConflicts.length > 0) && (
        <ValidationSummary
          teacherConflicts={teacherConflicts}
          roomConflicts={roomConflicts}
          timeMismatches={timeMismatches}
        />
      )}

      <nav className="period-tabs">
        {periods.map((p) => (
          <button
            key={p.id}
            type="button"
            className={'period-tabs__link' + (p.id === currentPeriod?.id ? ' is-active' : '')}
            onClick={() => setSelectedPeriodId(p.id)}
          >
            {p.period_name}
            <span className="period-tabs__count">
              {enriched.filter((l) => l.lesson_period_id === p.id).length}
            </span>
          </button>
        ))}
      </nav>

  {currentPeriod && (
  <>
    <PeriodHeader
      period={currentPeriod}
      count={lessonsInPeriod.length}
      onPeriodUpdated={onChange}
    />

    <nav className="period-tabs">
      <button
        type="button"
        className={'period-tabs__link' + (mode === 'single' ? ' is-active' : '')}
        onClick={() => setMode('single')}
      >
        Satu per satu
      </button>
      <button
        type="button"
        className={'period-tabs__link' + (mode === 'bulk' ? ' is-active' : '')}
        onClick={() => setMode('bulk')}
      >
        Isi banyak sekaligus
      </button>
    </nav>

    {mode === 'single' && (
      <>
        <LessonForm
          period={currentPeriod}
          allLessons={enriched}
          lookups={lookups}
          day={day}
          onSaved={onChange}
          onNotify={(msg, type) => {
            if (type === 'error') toast.error(msg);
            else if (type === 'warning') toast.warning(msg);
            else toast.success(msg);
          }}
        />

        {lessonsInPeriod.length === 0 ? (
          <EmptyState
            title="Belum ada pelajaran"
            description="Tambahkan entri pertama untuk sesi ini melalui form di atas."
          />
        ) : (
          <LessonTable
            rows={lessonsInPeriod}
            lookups={lookups}
            onSaved={onChange}
            onNotify={(msg, type) => {
              if (type === 'error') toast.error(msg);
              else toast.success(msg);
            }}
          />
        )}
      </>
    )}

    {mode === 'bulk' && (
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
  </>
)}
    </div>
  );
}

/* =====================================================================
   PeriodHeader — editor jam inline
   ===================================================================== */
function PeriodHeader({ period, count, onPeriodUpdated }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [start, setStart] = useState(period.start_time.slice(0, 5));
  const [end, setEnd] = useState(period.end_time.slice(0, 5));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStart(period.start_time.slice(0, 5));
    setEnd(period.end_time.slice(0, 5));
  }, [period.start_time, period.end_time]);

  function cancel() {
    setEditing(false);
    setStart(period.start_time.slice(0, 5));
    setEnd(period.end_time.slice(0, 5));
  }

  async function save() {
    if (!start || !end) return toast.error('Jam mulai dan selesai wajib diisi.');
    if (end <= start) return toast.error('Jam selesai harus setelah jam mulai.');

    setBusy(true);
    const { error } = await updatePeriod(period.id, {
      start_time: start,
      end_time: end,
    });
    setBusy(false);

    if (error) return toast.error(error.message);
    toast.success('Jam sesi diperbarui untuk semua kelas di sesi ini.');
    setEditing(false);
    onPeriodUpdated?.();
  }

  return (
    <div className="period-header">
      <div className="period-header__main">
        <strong>{period.period_name}</strong>

        {!editing ? (
          <span className="period-header__time">
            <Clock size={13} strokeWidth={2.25} />
            {formatTime(period.start_time)}–{formatTime(period.end_time)}
          </span>
        ) : (
          <span className="period-time-edit">
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              aria-label="Jam mulai"
            />
            <span className="period-time-edit__sep">–</span>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              aria-label="Jam selesai"
            />
          </span>
        )}
      </div>

      <div className="period-header__actions">
        <span className="badge badge--imp-normal">{count} kelas terisi</span>

        {!editing ? (
          <button
            type="button"
            className="btn btn--ghost btn--xs"
            onClick={() => setEditing(true)}
          >
            <Clock size={13} strokeWidth={2.25} />
            Ubah Jam
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn btn--ghost btn--xs"
              onClick={cancel}
              disabled={busy}
            >
              <X size={13} strokeWidth={2.25} />
              Batal
            </button>
            <button
              type="button"
              className="btn btn--primary btn--xs"
              onClick={save}
              disabled={busy}
            >
              <Save size={13} strokeWidth={2.25} />
              {busy ? 'Menyimpan…' : 'Simpan'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* =====================================================================
   ValidationSummary
   ===================================================================== */
function ValidationSummary({ teacherConflicts, roomConflicts, timeMismatches }) {
  return (
    <div className="card validation-card">
      <h3 className="card__title">Peringatan Validasi</h3>

      {timeMismatches.length > 0 && (
        <div className="validation-group">
          <strong className="validation-group__title">Waktu agenda dan sesi tidak sama</strong>
          <ul>
            {timeMismatches.map((m, i) => (
              <li key={i}>
                <strong>{m.periodName}</strong>: agenda {m.agenda} vs sesi {m.session}
              </li>
            ))}
          </ul>
        </div>
      )}

      {teacherConflicts.length > 0 && (
        <div className="validation-group">
          <strong className="validation-group__title">Guru mengajar dua kelas pada sesi yang sama</strong>
          <ul>
            {teacherConflicts.map((c, i) => (
              <li key={i}>
                <strong>{c.teacherName}</strong> pada {c.periodName}: {c.classes.join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {roomConflicts.length > 0 && (
        <div className="validation-group">
          <strong className="validation-group__title">Ruang dipakai dua kelas pada sesi yang sama</strong>
          <ul>
            {roomConflicts.map((c, i) => (
              <li key={i}>
                <strong>{c.roomName}</strong> pada {c.periodName}: {c.classes.join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="muted" style={{ margin: 0, marginTop: 12, fontSize: '0.75rem' }}>
        Peringatan ini tidak memblokir publikasi. Periksa dan tentukan koreksi sendiri.
      </p>
    </div>
  );
}

/* =====================================================================
   LessonForm
   ===================================================================== */
function LessonForm({ period, allLessons, lookups, day, onSaved, onNotify }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const usedClassIds = new Set(
    allLessons.filter((l) => l.lesson_period_id === period.id).map((l) => l.class_id)
  );

  const availableClasses = lookups.classes.filter((c) => !usedClassIds.has(c.id));

  const classOptions = availableClasses.map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: c.grade_level ? `Tingkat ${c.grade_level}` : undefined,
  }));
  const teacherOptions = lookups.teachers.map((t) => ({ value: t.id, label: t.name }));
  const subjectOptions = lookups.subjects.map((s) => ({ value: s.id, label: s.name }));
  const roomOptions = lookups.rooms.map((r) => ({ value: r.id, label: r.name }));

  async function submit(e) {
    e.preventDefault();
    const errs = validateLessonInput(form);
    if (errs.length) return onNotify(errs[0], 'error');

    setBusy(true);
    const payload = {
      school_day_id: day.id,
      lesson_period_id: period.id,
      class_id: form.class_id,
      teacher_id: form.teacher_id,
      subject_id: form.subject_id,
      room_id: form.room_id,
      substitute_teacher_id: form.substitute_teacher_id || null,
      substitute_teacher_name: form.substitute_teacher_name.trim() || null,
      notes: form.notes.trim() || null,
      is_cancelled: !!form.is_cancelled,
    };
    const { error } = await createLesson(payload);
    setBusy(false);
    if (error) return onNotify(error.message, 'error');
    onNotify('Pelajaran ditambahkan.', 'success');
    setForm(EMPTY_FORM);
    onSaved();
  }

  return (
    <form className="card admin-form" onSubmit={submit}>
      <h3 className="card__title">Tambah Pelajaran</h3>
      <div className="form-grid">
        <label className="field">
          <span>Kelas</span>
          <SearchableSelect
            value={form.class_id}
            onChange={(v) => setForm({ ...form, class_id: v })}
            options={classOptions}
            placeholder="— Pilih kelas —"
            searchPlaceholder="Cari kelas…"
            emptyMessage="Semua kelas sudah terisi pada sesi ini"
          />
          {availableClasses.length === 0 && (
            <small className="muted">Semua kelas sudah terisi pada sesi ini.</small>
          )}
        </label>

        <label className="field">
          <span>Guru</span>
          <SearchableSelect
            value={form.teacher_id}
            onChange={(v) => setForm({ ...form, teacher_id: v })}
            options={teacherOptions}
            placeholder="— Pilih guru —"
            searchPlaceholder="Cari guru…"
          />
        </label>

        <label className="field">
          <span>Mata Pelajaran</span>
          <SearchableSelect
            value={form.subject_id}
            onChange={(v) => setForm({ ...form, subject_id: v })}
            options={subjectOptions}
            placeholder="— Pilih mapel —"
            searchPlaceholder="Cari mapel…"
          />
        </label>

        <label className="field">
          <span>Ruang</span>
          <SearchableSelect
            value={form.room_id}
            onChange={(v) => setForm({ ...form, room_id: v })}
            options={roomOptions}
            placeholder="— Pilih ruang —"
            searchPlaceholder="Cari ruang…"
          />
        </label>

        <label className="field">
          <span>Guru Pengganti (opsional)</span>
          <SearchableSelect
            value={form.substitute_teacher_id}
            onChange={(v) => setForm({ ...form, substitute_teacher_id: v })}
            options={teacherOptions}
            placeholder="— Tidak ada —"
            searchPlaceholder="Cari guru pengganti…"
          />
        </label>

        <label className="field">
          <span>Nama Pengganti (jika belum terdaftar)</span>
          <input
            value={form.substitute_teacher_name}
            onChange={(e) => setForm({ ...form, substitute_teacher_name: e.target.value })}
            placeholder="Kosongkan jika tidak ada"
          />
        </label>

        <label className="field field--wide">
          <span>Catatan</span>
          <input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Opsional"
          />
        </label>

        <label className="field field--check">
          <input
            type="checkbox"
            checked={form.is_cancelled}
            onChange={(e) => setForm({ ...form, is_cancelled: e.target.checked })}
          />
          <span>Tandai sebagai dibatalkan</span>
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Menyimpan…' : 'Tambah Pelajaran'}
        </button>
      </div>
    </form>
  );
}

/* =====================================================================
   LessonTable
   ===================================================================== */
function LessonTable({ rows, lookups, onSaved, onNotify }) {
  const [editingId, setEditingId] = useState(null);

  return (
    <div className="card card--flush">
      <div className="table-wrap table-wrap--bare">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kelas</th>
              <th>Guru</th>
              <th>Mata Pelajaran</th>
              <th>Ruang</th>
              <th>Catatan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) =>
              editingId === l.id ? (
                <LessonRowEdit
                  key={l.id}
                  lesson={l}
                  lookups={lookups}
                  onDone={() => { setEditingId(null); onSaved(); }}
                  onCancel={() => setEditingId(null)}
                  onNotify={onNotify}
                />
              ) : (
                <LessonRowView
                  key={l.id}
                  lesson={l}
                  onEdit={() => setEditingId(l.id)}
                  onDeleted={onSaved}
                  onNotify={onNotify}
                />
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LessonRowView({ lesson, onEdit, onDeleted, onNotify }) {
  const [busy, setBusy] = useState(false);

  async function hapus() {
    if (!confirm(`Hapus pelajaran ${lesson.class?.name} — ${lesson.subject?.name}?`)) return;
    setBusy(true);
    const { error } = await deleteLesson(lesson.id);
    setBusy(false);
    if (error) return onNotify(error.message, 'error');
    onNotify('Pelajaran dihapus.', 'success');
    onDeleted();
  }

  return (
    <tr className={lesson.is_cancelled ? 'is-cancelled' : ''}>
      <td><strong>{lesson.class?.name}</strong></td>
      <td>
        {lesson.teacher?.name}
        {(lesson.substitute_teacher?.name || lesson.substitute_teacher_name) && (
          <div className="cell-substitute">
            Pengganti: {lesson.substitute_teacher?.name ?? lesson.substitute_teacher_name}
          </div>
        )}
      </td>
      <td>{lesson.subject?.name}</td>
      <td>{lesson.room?.name}</td>
      <td>
        {lesson.is_cancelled && <span className="tag tag--danger">Dibatalkan</span>}
        {lesson.notes && <div className="cell-note">{lesson.notes}</div>}
      </td>
      <td>
        <div className="row-actions">
          <button type="button" className="btn btn--ghost" onClick={onEdit}>Edit</button>
          <button type="button" className="btn btn--danger" onClick={hapus} disabled={busy}>
            Hapus
          </button>
        </div>
      </td>
    </tr>
  );
}

function LessonRowEdit({ lesson, lookups, onDone, onCancel, onNotify }) {
  const [form, setForm] = useState({
    teacher_id: lesson.teacher_id,
    subject_id: lesson.subject_id,
    room_id: lesson.room_id,
    substitute_teacher_id: lesson.substitute_teacher_id ?? '',
    substitute_teacher_name: lesson.substitute_teacher_name ?? '',
    notes: lesson.notes ?? '',
    is_cancelled: lesson.is_cancelled,
  });
  const [busy, setBusy] = useState(false);

  const teacherOptions = lookups.teachers.map((t) => ({ value: t.id, label: t.name }));
  const subjectOptions = lookups.subjects.map((s) => ({ value: s.id, label: s.name }));
  const roomOptions = lookups.rooms.map((r) => ({ value: r.id, label: r.name }));

  async function save() {
    const errs = validateLessonInput({
      class_id: lesson.class_id,
      teacher_id: form.teacher_id,
      subject_id: form.subject_id,
      room_id: form.room_id,
    });
    if (errs.length) return onNotify(errs[0], 'error');

    setBusy(true);
    const { error } = await updateLesson(lesson.id, {
      teacher_id: form.teacher_id,
      subject_id: form.subject_id,
      room_id: form.room_id,
      substitute_teacher_id: form.substitute_teacher_id || null,
      substitute_teacher_name: form.substitute_teacher_name.trim() || null,
      notes: form.notes.trim() || null,
      is_cancelled: form.is_cancelled,
    });
    setBusy(false);
    if (error) return onNotify(error.message, 'error');
    onNotify('Pelajaran diperbarui.', 'success');
    onDone();
  }

  return (
    <tr className="row-editing">
      <td><strong>{lesson.class?.name}</strong></td>
      <td>
        <SearchableSelect
          value={form.teacher_id}
          onChange={(v) => setForm({ ...form, teacher_id: v })}
          options={teacherOptions}
          searchPlaceholder="Cari guru…"
          clearable={false}
        />
      </td>
      <td>
        <SearchableSelect
          value={form.subject_id}
          onChange={(v) => setForm({ ...form, subject_id: v })}
          options={subjectOptions}
          searchPlaceholder="Cari mapel…"
          clearable={false}
        />
      </td>
      <td>
        <SearchableSelect
          value={form.room_id}
          onChange={(v) => setForm({ ...form, room_id: v })}
          options={roomOptions}
          searchPlaceholder="Cari ruang…"
          clearable={false}
        />
      </td>
      <td>
        <input
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Catatan"
        />
        <label className="inline-check">
          <input
            type="checkbox"
            checked={form.is_cancelled}
            onChange={(e) => setForm({ ...form, is_cancelled: e.target.checked })}
          />
          Dibatalkan
        </label>
      </td>
      <td>
        <div className="row-actions">
          <button type="button" className="btn btn--primary" onClick={save} disabled={busy}>
            Simpan
          </button>
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
            Batal
          </button>
        </div>
      </td>
    </tr>
  );
}