import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getSchoolDayByDate, updateSchoolDayMeta, setSchoolDayStatus, deleteSchoolDay,
  listActivities, createActivity, updateActivity, deleteActivity,
  listDuty, addDuty, removeDuty,
  listPeriods, createPeriod, updatePeriod, deletePeriod,
  listActiveMaster, listLessons,
} from '../../services/adminService.js';
import { formatDateLong, formatDateTime, formatTime } from '../../utils/jakartaTime.js';
import { ACTIVITY_CODES, PERIOD_CODES, PERIOD_LABEL } from '../../utils/constants.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import LessonsEditor from './LessonsEditor.jsx';

const TABS = [
  { key: 'agenda', label: 'Agenda Harian' },
  { key: 'duty', label: 'Guru Piket' },
  { key: 'periods', label: 'Sesi KBM' },
  { key: 'lessons', label: 'Pelajaran' },
];

export default function ScheduleEditorPage() {
  const { date } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState('agenda');
const [state, setState] = useState({
  loading: true, error: null, day: null, activities: [], duty: [], periods: [], lessons: [],
});
  const [teachers, setTeachers] = useState([]);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
  const dayRes = await getSchoolDayByDate(date);
if (dayRes.error || !dayRes.data) {
  setState({ loading: false, error: dayRes.error, day: null, activities: [], duty: [], periods: [], lessons: [] });
  return;
}
const [a, d, p, l, t] = await Promise.all([
  listActivities(dayRes.data.id),
  listDuty(dayRes.data.id),
  listPeriods(dayRes.data.id),
  listLessons(dayRes.data.id),
  listActiveMaster('teachers'),
]);
setState({
  loading: false,
  error: a.error || d.error || p.error || l.error,
  day: dayRes.data,
  activities: a.data,
  duty: d.data,
  periods: p.data,
  lessons: l.data,
});
setTeachers(t.data);
  }, [date]);

  useEffect(() => { load(); }, [load]);

  async function togglePublish() {
    if (!state.day) return;
    const target = state.day.status === 'published' ? 'draft' : 'published';
    const msg = target === 'published'
      ? 'Publikasikan jadwal ini? Santri akan langsung melihatnya.'
      : 'Batalkan publikasi? Santri tidak akan melihat jadwal ini sampai dipublikasikan kembali.';
    if (!confirm(msg)) return;
    const { data, error } = await setSchoolDayStatus(state.day.id, target);
    if (error) return toast.error(error.message);
    setState((s) => ({ ...s, day: data }));
    toast.success(target === 'published' ? 'Jadwal dipublikasikan.' : 'Publikasi dibatalkan.');
  }

  async function handleDelete() {
    if (!state.day) return;
    if (!confirm('Hapus jadwal ini beserta seluruh isinya? Tindakan tidak dapat dibatalkan.')) return;
    const { error } = await deleteSchoolDay(state.day.id);
    if (error) return toast.error(error.message);
    toast.success('Jadwal dihapus.');
    navigate('/admin/jadwal');
  }

  async function handleSaveNotes(notes) {
    if (!state.day) return;
    const { data, error } = await updateSchoolDayMeta(state.day.id, { notes });
    if (error) return toast.error(error.message);
    setState((s) => ({ ...s, day: data }));
    toast.success('Catatan disimpan.');
  }

  if (state.loading) return <LoadingState message="Memuat jadwal…" />;
  if (!state.day) {
    return (
      <div className="stack">
        <h1>Jadwal tidak ditemukan</h1>
        <p className="muted">Tidak ada jadwal untuk tanggal {date}.</p>
        <Link to="/admin/jadwal" className="btn btn--primary">Kembali ke Daftar</Link>
      </div>
    );
  }

  const { day } = state;
  const isPublished = day.status === 'published';

  return (
    <div className="stack">
      <div className="row-actions row-actions--start">
        <Link to="/admin/jadwal" className="btn btn--ghost">← Kembali</Link>
        <Link to={`/tanggal/${day.schedule_date}`} target="_blank" rel="noreferrer" className="btn btn--ghost">
          Lihat Halaman Publik
        </Link>
      </div>

      <section className="card">
        <div className="card__header">
          <div>
            <h1 style={{ margin: 0 }}>{formatDateLong(day.schedule_date)}</h1>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              Terakhir diperbarui {day.updated_at ? formatDateTime(day.updated_at) + ' WIB' : '-'}
            </p>
          </div>
          <StatusBadge status={day.status} />
        </div>

        <div className="row-actions row-actions--start">
          <button
            type="button"
            className={isPublished ? 'btn btn--ghost' : 'btn btn--primary'}
            onClick={togglePublish}
          >
            {isPublished ? 'Batalkan Publikasi' : 'Publikasikan'}
          </button>
          <button type="button" className="btn btn--danger" onClick={handleDelete}>
            Hapus Jadwal
          </button>
        </div>

        <NotesEditor day={day} onSave={handleSaveNotes} />
      </section>

      <nav className="period-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={'period-tabs__link' + (tab === t.key ? ' is-active' : '')}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'agenda' && (
        <ActivitiesSection day={day} items={state.activities} onChange={load} />
      )}
      {tab === 'duty' && (
        <DutySection day={day} items={state.duty} teachers={teachers} onChange={load} />
      )}
      {tab === 'periods' && (
        <PeriodsSection day={day} items={state.periods} onChange={load} />
      )}
{tab === 'lessons' && (
  <LessonsEditor
    day={day}
    periods={state.periods}
    lessons={state.lessons}
    activities={state.activities}
    onChange={load}
  />
)}
    </div>
  );
}

// =====================================================================
// NotesEditor
// =====================================================================
function NotesEditor({ day, onSave }) {
  const [notes, setNotes] = useState(day.notes ?? '');
  const [saving, setSaving] = useState(false);
  useEffect(() => { setNotes(day.notes ?? ''); }, [day.notes]);
  const changed = (day.notes ?? '') !== notes;

  async function handleSave() {
    setSaving(true);
    await onSave(notes);
    setSaving(false);
  }

  return (
    <div style={{ marginTop: 'var(--space-3)' }}>
      <label className="field">
        <span>Catatan Hari</span>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan opsional untuk hari ini…"
        />
      </label>
      {changed && (
        <div className="form-actions">
          <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan Catatan'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setNotes(day.notes ?? '')}>
            Batal
          </button>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// ActivitiesSection
// =====================================================================
function ActivitiesSection({ day, items, onChange }) {
  const toast = useToast();
  const [form, setForm] = useState({
    activity_name: '', activity_code: '', start_time: '07:00', end_time: '07:30',
  });
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setForm({ activity_name: '', activity_code: '', start_time: '07:00', end_time: '07:30' });
    setEditingId(null);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.activity_name.trim()) return toast.error('Nama agenda wajib diisi.');
    if (form.end_time <= form.start_time) return toast.error('Waktu selesai harus setelah waktu mulai.');

    setBusy(true);
    const payload = {
      activity_name: form.activity_name.trim(),
      activity_code: form.activity_code || null,
      start_time: form.start_time,
      end_time: form.end_time,
      display_order: editingId
        ? items.find((i) => i.id === editingId)?.display_order ?? 0
        : (items[items.length - 1]?.display_order ?? 0) + 1,
    };
    const res = editingId
      ? await updateActivity(editingId, payload)
      : await createActivity(day.id, payload);
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(editingId ? 'Agenda diperbarui.' : 'Agenda ditambahkan.');
    reset();
    onChange();
  }

  async function hapus(row) {
    if (!confirm(`Hapus agenda "${row.activity_name}"?`)) return;
    const { error } = await deleteActivity(row.id);
    if (error) return toast.error(error.message);
    toast.success('Agenda dihapus.');
    onChange();
  }

  function edit(row) {
    setEditingId(row.id);
    setForm({
      activity_name: row.activity_name,
      activity_code: row.activity_code ?? '',
      start_time: row.start_time.slice(0, 5),
      end_time: row.end_time.slice(0, 5),
    });
  }

  return (
    <>
      <form className="card admin-form" onSubmit={submit}>
        <h2 className="card__title">{editingId ? 'Edit Agenda' : 'Tambah Agenda'}</h2>
        <div className="form-grid">
          <label className="field">
            <span>Nama</span>
            <input
              value={form.activity_name}
              onChange={(e) => setForm({ ...form, activity_name: e.target.value })}
              placeholder="Apel / Istirahat / KBM 1"
              required
            />
          </label>
          <label className="field">
            <span>Kode</span>
            <select
              value={form.activity_code}
              onChange={(e) => setForm({ ...form, activity_code: e.target.value })}
            >
              <option value="">— Tidak ada —</option>
              {ACTIVITY_CODES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Mulai</span>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Selesai</span>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              required
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {editingId ? 'Simpan Perubahan' : 'Tambah'}
          </button>
          {editingId && (
            <button type="button" className="btn btn--ghost" onClick={reset}>Batal</button>
          )}
        </div>
      </form>

      {items.length > 0 && (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Urutan</th><th>Nama</th><th>Kode</th><th>Waktu</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id}>
                    <td>{a.display_order}</td>
                    <td>{a.activity_name}</td>
                    <td>{a.activity_code ?? '-'}</td>
                    <td>{formatTime(a.start_time)}–{formatTime(a.end_time)}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="btn btn--ghost" onClick={() => edit(a)}>Edit</button>
                        <button type="button" className="btn btn--danger" onClick={() => hapus(a)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// =====================================================================
// DutySection
// =====================================================================
function DutySection({ day, items, teachers, onChange }) {
  const toast = useToast();
  const [teacherId, setTeacherId] = useState('');
  const [busy, setBusy] = useState(false);

  const used = new Set(items.map((i) => i.teacher?.id));
  const available = teachers.filter((t) => !used.has(t.id));

  async function add(e) {
    e.preventDefault();
    if (!teacherId) return;
    setBusy(true);
    const { error } = await addDuty(day.id, teacherId, items.length + 1);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success('Guru piket ditambahkan.');
    setTeacherId('');
    onChange();
  }

  async function hapus(row) {
    if (!confirm(`Hapus ${row.teacher?.name} dari daftar piket?`)) return;
    const { error } = await removeDuty(row.id);
    if (error) return toast.error(error.message);
    onChange();
  }

  return (
    <>
      <form className="card admin-form" onSubmit={add}>
        <h2 className="card__title">Tambah Guru Piket</h2>
        <div className="form-grid">
          <label className="field">
            <span>Guru</span>
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required>
              <option value="">— Pilih guru —</option>
              {available.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={busy || !teacherId}>
            Tambah
          </button>
        </div>
      </form>

      <div className="card">
        {items.length === 0 ? (
          <p className="muted">Belum ada guru piket untuk hari ini.</p>
        ) : (
          <ul className="pill-list">
            {items.map((d) => (
              <li key={d.id} className="pill pill--removable">
                {d.teacher?.name}
                <button type="button" onClick={() => hapus(d)} aria-label="Hapus">×</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

// =====================================================================
// PeriodsSection
// =====================================================================
function PeriodsSection({ day, items, onChange }) {
  const toast = useToast();
  const [form, setForm] = useState({
    period_code: 'KBM1', period_name: 'KBM 1',
    start_time: '08:00', end_time: '08:50',
  });
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  // Cek kode mana yang belum dipakai (untuk form tambah).
  const usedCodes = new Set(items.map((i) => i.period_code));

  // Auto isi period_name saat kode diubah (hanya saat menambah).
  useEffect(() => {
    if (!editingId) setForm((f) => ({ ...f, period_name: PERIOD_LABEL[f.period_code] ?? f.period_code }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.period_code]);

  function reset() {
    setForm({ period_code: 'KBM1', period_name: 'KBM 1', start_time: '08:00', end_time: '08:50' });
    setEditingId(null);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.period_name.trim()) return toast.error('Nama sesi wajib diisi.');
    if (form.end_time <= form.start_time) return toast.error('Waktu selesai harus setelah waktu mulai.');

    setBusy(true);
    const payload = {
      period_code: form.period_code,
      period_name: form.period_name.trim(),
      start_time: form.start_time,
      end_time: form.end_time,
      display_order: editingId
        ? items.find((i) => i.id === editingId)?.display_order ?? 0
        : PERIOD_CODES.indexOf(form.period_code) + 1,
    };
    const res = editingId
      ? await updatePeriod(editingId, payload)
      : await createPeriod(day.id, payload);
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(editingId ? 'Sesi diperbarui.' : 'Sesi ditambahkan.');
    reset();
    onChange();
  }

  async function hapus(row) {
    if (!confirm(`Hapus sesi ${row.period_name}? Semua pelajaran pada sesi ini juga akan terhapus.`)) return;
    const { error } = await deletePeriod(row.id);
    if (error) return toast.error(error.message);
    toast.success('Sesi dihapus.');
    onChange();
  }

  function edit(row) {
    setEditingId(row.id);
    setForm({
      period_code: row.period_code,
      period_name: row.period_name,
      start_time: row.start_time.slice(0, 5),
      end_time: row.end_time.slice(0, 5),
    });
  }

  return (
    <>
      <form className="card admin-form" onSubmit={submit}>
        <h2 className="card__title">{editingId ? 'Edit Sesi KBM' : 'Tambah Sesi KBM'}</h2>
        <div className="form-grid">
          <label className="field">
            <span>Kode</span>
            <select
              value={form.period_code}
              onChange={(e) => setForm({ ...form, period_code: e.target.value })}
              disabled={!!editingId}
            >
              {PERIOD_CODES.map((c) => (
                <option key={c} value={c} disabled={!editingId && usedCodes.has(c)}>
                  {c}{!editingId && usedCodes.has(c) ? ' (sudah ada)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Nama Tampilan</span>
            <input
              value={form.period_name}
              onChange={(e) => setForm({ ...form, period_name: e.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Mulai</span>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Selesai</span>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              required
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {editingId ? 'Simpan Perubahan' : 'Tambah'}
          </button>
          {editingId && (
            <button type="button" className="btn btn--ghost" onClick={reset}>Batal</button>
          )}
        </div>
      </form>

      {items.length > 0 && (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Kode</th><th>Nama</th><th>Waktu</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.period_code}</strong></td>
                    <td>{p.period_name}</td>
                    <td>{formatTime(p.start_time)}–{formatTime(p.end_time)}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="btn btn--ghost" onClick={() => edit(p)}>Edit</button>
                        <button type="button" className="btn btn--danger" onClick={() => hapus(p)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}