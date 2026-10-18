import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, Plus, CalendarDays } from 'lucide-react';
import {
  listSchoolDays, createSchoolDay, deleteSchoolDay, copyDayToDate,
  getSchoolDayByDate, copyWeekToWeek
} from '../../services/adminService.js';
import { todayJakarta, formatDateLong, formatDateTime, isValidDateString, addDaysToDateString } from '../../utils/jakartaTime.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function ScheduleAdminListPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: null, rows: [] });
  
  const [newDate, setNewDate] = useState(todayJakarta());
  const [copyFrom, setCopyFrom] = useState('');
  
  const [weekSource, setWeekSource] = useState(todayJakarta());
  const [weekTarget, setWeekTarget] = useState(addDaysToDateString(todayJakarta(), 7));
  
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await listSchoolDays({ limit: 200 });
    setState({ loading: false, error, rows: data });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!isValidDateString(newDate)) return toast.error('Tanggal tidak valid.');
    setBusy(true);
    const exist = await getSchoolDayByDate(newDate);
    if (exist.data) {
      setBusy(false);
      toast.warning('Jadwal untuk tanggal ini sudah ada.');
      return navigate(`/admin/jadwal/${newDate}`);
    }
    const { error } = await createSchoolDay(newDate);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success('Jadwal baru dibuat.');
    navigate(`/admin/jadwal/${newDate}`);
  }

  async function handleCopyDay(e) {
    e.preventDefault();
    if (!copyFrom) return toast.error('Pilih hari sumber terlebih dahulu.');
    if (!isValidDateString(newDate)) return toast.error('Tanggal tujuan tidak valid.');
    
    const source = state.rows.find((r) => r.schedule_date === copyFrom);
    if (!source) return toast.error('Hari sumber tidak ditemukan.');
    const exist = await getSchoolDayByDate(newDate);
    if (exist.data) return toast.error('Tanggal tujuan sudah punya jadwal.');

    setBusy(true);
    const { error } = await copyDayToDate(source.id, newDate);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success('Jadwal berhasil disalin (status draft).');
    navigate(`/admin/jadwal/${newDate}`);
  }

  async function handleCopyWeek(e) {
    e.preventDefault();
    if (!isValidDateString(weekSource) || !isValidDateString(weekTarget)) {
      return toast.error('Tanggal tidak valid.');
    }
    if (weekSource === weekTarget) {
      return toast.error('Tanggal sumber dan tujuan tidak boleh sama.');
    }
    if (!confirm(`Salin seluruh jadwal dari minggu ${formatDateLong(weekSource)} ke minggu ${formatDateLong(weekTarget)}?`)) return;

    setBusy(true);
    const res = await copyWeekToWeek(weekSource, weekTarget);
    setBusy(false);

    if (res.failCount > 0) {
      toast.warning(`Selesai: ${res.successCount} berhasil, ${res.failCount} gagal, ${res.skippedCount} dilewati.`);
    } else {
      toast.success(`Berhasil menyalin ${res.successCount} hari. (${res.skippedCount} hari dilewati).`);
    }
    load();
  }

  async function handleDelete(row) {
    if (!confirm(`Hapus jadwal ${formatDateLong(row.schedule_date)} beserta seluruh isinya?`)) return;
    const { error } = await deleteSchoolDay(row.id);
    if (error) return toast.error(error.message);
    toast.success('Jadwal dihapus.');
    load();
  }

  return (
    <div className="stack">
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1>Jadwal KBM</h1>
          <p className="muted">Kelola jadwal harian, salin per hari, atau salin per minggu.</p>
        </div>
      </div>

      <div className="compact-forms-grid">
        
        {/* Form 1: Buat Jadwal */}
        <form className="compact-card" onSubmit={handleCreate}>
          <h3 className="compact-title">Buat Jadwal Baru</h3>
          <div className="compact-body">
            <label className="compact-field">
              <span>Tanggal</span>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
            </label>
          </div>
          <button type="submit" className="btn btn--primary btn--block compact-btn" disabled={busy}>
            <Plus size={16}/> Buat Jadwal
          </button>
        </form>

        {/* Form 2: Salin Per Hari */}
        <form className="compact-card" onSubmit={handleCopyDay}>
          <h3 className="compact-title">Salin Per Hari</h3>
          <div className="compact-body">
            <label className="compact-field" style={{ flex: 1 }}>
              <span>Dari</span>
              <select value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)} required>
                <option value="">— Pilih —</option>
                {state.rows.map((r) => (
                  <option key={r.id} value={r.schedule_date}>{formatDateLong(r.schedule_date)}</option>
                ))}
              </select>
            </label>
            <label className="compact-field" style={{ flex: 1 }}>
              <span>Ke</span>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
            </label>
          </div>
          <button type="submit" className="btn btn--secondary btn--block compact-btn" disabled={busy}>
            <Copy size={16}/> Salin 1 Hari
          </button>
        </form>

        {/* Form 3: Salin Mingguan */}
        <form className="compact-card" onSubmit={handleCopyWeek}>
          <h3 className="compact-title">Salin 1 Minggu</h3>
          <div className="compact-body">
            <label className="compact-field" style={{ flex: 1 }}>
              <span>Dari</span>
              <input type="date" value={weekSource} onChange={(e) => setWeekSource(e.target.value)} required />
            </label>
            <label className="compact-field" style={{ flex: 1 }}>
              <span>Ke</span>
              <input type="date" value={weekTarget} onChange={(e) => setWeekTarget(e.target.value)} required />
            </label>
          </div>
          <button type="submit" className="btn btn--secondary btn--block compact-btn" disabled={busy}>
            <CalendarDays size={16}/> Salin 6 Hari
          </button>
        </form>
      </div>

      {state.loading && <LoadingState message="Memuat daftar jadwal…" />}
      {state.error && <ErrorState description={state.error.message} onRetry={load} />}
      {!state.loading && !state.error && state.rows.length === 0 && (
        <EmptyState title="Belum ada jadwal" description="Buat jadwal baru di atas." />
      )}

      {state.rows.length > 0 && (
        <div className="card card--flush">
          <div className="table-wrap table-wrap--bare">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th>Terakhir Diubah</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {state.rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link to={`/admin/jadwal/${r.schedule_date}`}>
                        <strong>{formatDateLong(r.schedule_date)}</strong>
                      </Link>
                    </td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>{r.updated_at ? formatDateTime(r.updated_at) + ' WIB' : '-'}</td>
                    <td>
                      <div className="row-actions">
                        <Link to={`/admin/jadwal/${r.schedule_date}`} className="btn btn--ghost">Edit</Link>
                        <Link to={`/tanggal/${r.schedule_date}`} className="btn btn--ghost" target="_blank" rel="noreferrer">Lihat</Link>
                        <button type="button" className="btn btn--danger" onClick={() => handleDelete(r)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}