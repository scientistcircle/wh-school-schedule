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
import SearchableSelect from '../../components/SearchableSelect.jsx';
import { Edit3, Save, X, Clock, Trash2, ArrowLeft, Eye } from 'lucide-react';

const TABS = [
  { key: 'lessons', label: 'Pelajaran' },
  { key: 'periods', label: 'Sesi KBM' },
  { key: 'agenda', label: 'Agenda Harian' },
  { key: 'duty', label: 'Guru Piket' },
];

export default function ScheduleEditorPage() {
  const { date } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState('lessons');
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
      : 'Batalkan publikasi?';
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

  if (state.loading) return <LoadingState message="Memuat jadwal…" />;
  if (!state.day) {
    return (
      <div className="stack">
        <h1>Jadwal tidak ditemukan</h1>
        <Link to="/admin/jadwal" className="btn btn--primary">Kembali ke Daftar</Link>
      </div>
    );
  }

  const { day } = state;
  const isPublished = day.status === 'published';

  return (
    <div className="stack-simple">
      <div className="editor-header">
        <div className="editor-header__left">
          <Link to="/admin/jadwal" className="btn btn--ghost btn-icon"><ArrowLeft size={18} /></Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{formatDateLong(day.schedule_date)}</h1>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
              <StatusBadge status={day.status} />
              <span className="muted" style={{ fontSize: '12px' }}>Update: {formatDateTime(day.updated_at)} WIB</span>
            </div>
          </div>
        </div>
        <div className="editor-header__actions">
          <Link to={`/tanggal/${day.schedule_date}`} target="_blank" rel="noreferrer" className="btn btn--ghost">
            <Eye size={16} /> Lihat
          </Link>
          <button type="button" className="btn btn--danger" onClick={handleDelete}>
            <Trash2 size={16} /> Hapus
          </button>
          <button type="button" className={isPublished ? 'btn btn--ghost' : 'btn btn--primary'} onClick={togglePublish}>
            {isPublished ? 'Batalkan Publikasi' : 'Publikasikan'}
          </button>
        </div>
      </div>

      <nav className="editor-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={'editor-tab' + (tab === t.key ? ' is-active' : '')}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="editor-content">
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
              teachers={teachers}
            onChange={load}
          />
        )}
      </div>
    </div>
  );
}

// =====================================================================
// KOMPONEN ANAK (Agenda, Duty, Periods) - Form Sejajar Menyamping
// =====================================================================
function ActivitiesSection({ day, items, onChange }) {
  const toast = useToast();
  const [form, setForm] = useState({ activity_name: '', activity_code: '', start_time: '07:00', end_time: '07:30' });
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setForm({ activity_name: '', activity_code: '', start_time: '07:00', end_time: '07:30' });
    setEditingId(null);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.activity_name.trim()) return toast.error('Nama agenda wajib diisi.');
    setBusy(true);
    const payload = {
      activity_name: form.activity_name.trim(),
      activity_code: form.activity_code || null,
      start_time: form.start_time,
      end_time: form.end_time,
      display_order: editingId ? items.find((i) => i.id === editingId)?.display_order ?? 0 : (items[items.length - 1]?.display_order ?? 0) + 1,
    };
    const res = editingId ? await updateActivity(editingId, payload) : await createActivity(day.id, payload);
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(editingId ? 'Diperbarui.' : 'Ditambahkan.');
    reset();
    onChange();
  }

  async function hapus(row) {
    if (!confirm(`Hapus agenda "${row.activity_name}"?`)) return;
    const { error } = await deleteActivity(row.id);
    if (error) return toast.error(error.message);
    onChange();
  }

  return (
    <div className="stack-simple">
      <form className="card compact-card" onSubmit={submit} style={{ maxWidth: '100%' }}>
        {/* Form flex sejajar menyamping */}
        <div className="form-inline">
          <label className="field" style={{ flex: 2 }}><span>Nama</span><input value={form.activity_name} onChange={(e) => setForm({ ...form, activity_name: e.target.value })} required /></label>
          <label className="field" style={{ flex: 1 }}><span>Kode</span>
            <select value={form.activity_code} onChange={(e) => setForm({ ...form, activity_code: e.target.value })}>
              <option value="">—</option>
              {ACTIVITY_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="field" style={{ flex: 1 }}><span>Mulai</span><input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required /></label>
          <label className="field" style={{ flex: 1 }}><span>Selesai</span><input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required /></label>
          <div className="form-actions">
            <button type="submit" className="btn btn--primary" disabled={busy}>{editingId ? 'Simpan' : 'Tambah'}</button>
            {editingId && <button type="button" className="btn btn--ghost" onClick={reset}>Batal</button>}
          </div>
        </div>
      </form>

      <div className="card card--flush">
        <div className="table-wrap table-wrap--bare">
          <table className="data-table">
            <thead><tr><th>Urutan</th><th>Nama</th><th>Waktu</th><th>Aksi</th></tr></thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>{a.display_order}</td>
                  <td>{a.activity_name}</td>
                  <td>{formatTime(a.start_time)}–{formatTime(a.end_time)}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="btn btn--ghost btn-xs" onClick={() => { setEditingId(a.id); setForm({ ...a, start_time: a.start_time.slice(0,5), end_time: a.end_time.slice(0,5), activity_code: a.activity_code || '' }); }}>Edit</button>
                      <button type="button" className="btn btn--danger btn-xs" onClick={() => hapus(a)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DutySection({ day, items, teachers, onChange }) {
  const toast = useToast();
  const [teacherId, setTeacherId] = useState('');
  const used = new Set(items.map((i) => i.teacher?.id));
  const available = teachers.filter((t) => !used.has(t.id));
  
  const teacherOptions = available.map((t) => ({ value: t.id, label: t.name }));

  async function add(e) {
    e.preventDefault();
    if (!teacherId) return;
    const { error } = await addDuty(day.id, teacherId, items.length + 1);
    if (error) return toast.error(error.message);
    setTeacherId('');
    onChange();
  }

  return (
    <div className="stack-simple">
      <form className="card compact-card" onSubmit={add} style={{ maxWidth: '100%' }}>
        <div className="form-inline">
          <label className="field" style={{ flex: 1 }}>
            <span>Pilih Guru</span>
            <SearchableSelect
              value={teacherId}
              onChange={setTeacherId}
              options={teacherOptions}
              placeholder="— Pilih guru —"
              searchPlaceholder="Cari guru…"
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn--primary" disabled={!teacherId}>Tambah</button>
          </div>
        </div>
      </form>
      
      <div className="card">
        {items.length === 0 ? <p className="muted">Belum ada guru piket.</p> : (
          <ul className="pill-list">
            {items.map((d) => (
              <li key={d.id} className="pill pill--removable">
                {d.teacher?.name}
                <button type="button" onClick={() => removeDuty(d.id).then(onChange)}>×</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PeriodsSection({ day, items, onChange }) {
  const toast = useToast();
  const [form, setForm] = useState({ period_code: 'KBM1', period_name: 'KBM 1', start_time: '08:00', end_time: '08:50' });
  const [editingId, setEditingId] = useState(null);
  const usedCodes = new Set(items.map((i) => i.period_code));

  async function submit(e) {
    e.preventDefault();
    const payload = { ...form, display_order: editingId ? items.find((i) => i.id === editingId)?.display_order ?? 0 : PERIOD_CODES.indexOf(form.period_code) + 1 };
    const res = editingId ? await updatePeriod(editingId, payload) : await createPeriod(day.id, payload);
    if (res.error) return toast.error(res.error.message);
    onChange();
  }

  return (
    <div className="stack-simple">
      <form className="card compact-card" onSubmit={submit} style={{ maxWidth: '100%' }}>
        {/* Form flex sejajar menyamping */}
        <div className="form-inline">
          <label className="field" style={{ flex: 1 }}>
            <span>Kode</span>
            <select value={form.period_code} onChange={(e) => setForm({ ...form, period_code: e.target.value })} disabled={!!editingId}>
              {PERIOD_CODES.map((c) => <option key={c} value={c} disabled={!editingId && usedCodes.has(c)}>{c}</option>)}
            </select>
          </label>
          <label className="field" style={{ flex: 2 }}><span>Nama</span><input value={form.period_name} onChange={(e) => setForm({ ...form, period_name: e.target.value })} required /></label>
          <label className="field" style={{ flex: 1 }}><span>Mulai</span><input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required /></label>
          <label className="field" style={{ flex: 1 }}><span>Selesai</span><input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required /></label>
          <div className="form-actions">
            <button type="submit" className="btn btn--primary">{editingId ? 'Simpan' : 'Tambah'}</button>
          </div>
        </div>
      </form>
      <div className="card card--flush">
        <div className="table-wrap table-wrap--bare">
          <table className="data-table">
            <thead><tr><th>Kode</th><th>Nama</th><th>Waktu</th><th>Aksi</th></tr></thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.period_code}</strong></td>
                  <td>{p.period_name}</td>
                  <td>{formatTime(p.start_time)}–{formatTime(p.end_time)}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="btn btn--ghost btn-xs" onClick={() => { setEditingId(p.id); setForm({ ...p, start_time: p.start_time.slice(0,5), end_time: p.end_time.slice(0,5) }); }}>Edit</button>
                      <button type="button" className="btn btn--danger btn-xs" onClick={() => deletePeriod(p.id).then(onChange)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}