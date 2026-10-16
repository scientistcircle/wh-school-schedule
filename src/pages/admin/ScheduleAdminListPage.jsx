import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  listSchoolDays, createSchoolDay, deleteSchoolDay, copyDayToDate,
  getSchoolDayByDate,
} from '../../services/adminService.js';
import { todayJakarta, formatDateLong, formatDateTime, isValidDateString } from '../../utils/jakartaTime.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import SearchableSelect from '../../components/SearchableSelect.jsx';

export default function ScheduleAdminListPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: null, rows: [] });
  const [newDate, setNewDate] = useState(todayJakarta());
  const [copyFrom, setCopyFrom] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await listSchoolDays({ limit: 200 });
    setState({ loading: false, error, rows: data });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!isValidDateString(newDate)) return toast.error('Tanggal tidak valid.');
    setBusy(true);
    // Cek dulu apakah hari sudah ada
    const exist = await getSchoolDayByDate(newDate);
    if (exist.data) {
      setBusy(false);
      toast.warning('Jadwal untuk tanggal ini sudah ada.');
      return navigate(`/admin/jadwal/${newDate}`);
    }
    const { data, error } = await createSchoolDay(newDate);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success('Jadwal baru dibuat.');
    navigate(`/admin/jadwal/${newDate}`);
  }

  async function handleCopy(e) {
    e.preventDefault();
    if (!copyFrom) return toast.error('Pilih hari sumber terlebih dahulu.');
    if (!isValidDateString(newDate)) return toast.error('Tanggal tujuan tidak valid.');
    if (copyFrom === newDate) return toast.error('Tanggal sumber dan tujuan sama.');

    const source = state.rows.find((r) => r.schedule_date === copyFrom);
    if (!source) return toast.error('Hari sumber tidak ditemukan.');

    const exist = await getSchoolDayByDate(newDate);
    if (exist.data) return toast.error('Tanggal tujuan sudah punya jadwal.');

    if (!confirm(`Salin isi jadwal ${formatDateLong(copyFrom)} ke ${formatDateLong(newDate)}?`)) return;

    setBusy(true);
    const { error } = await copyDayToDate(source.id, newDate);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success('Jadwal berhasil disalin (status draft).');
    load();
    navigate(`/admin/jadwal/${newDate}`);
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
      <h1>Jadwal KBM</h1>
      <p className="muted">Kelola jadwal harian. Pilih tanggal untuk mengedit, atau buat jadwal baru.</p>

      <div className="grid-2">
        <form className="card admin-form" onSubmit={handleCreate}>
          <h2 className="card__title">Buat Jadwal Baru</h2>
          <label className="field">
            <span>Tanggal</span>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn--primary" disabled={busy}>
              Buat Jadwal Kosong
            </button>
          </div>
        </form>

        <form className="card admin-form" onSubmit={handleCopy}>
          <h2 className="card__title">Salin dari Hari Sebelumnya</h2>
          <div className="form-grid">
        <label className="field">
  <span>Dari tanggal</span>
  <SearchableSelect
    value={copyFrom}
    onChange={setCopyFrom}
    options={state.rows.map((r) => ({
      value: r.schedule_date,
      label: formatDateLong(r.schedule_date),
      sublabel: r.status === 'published' ? 'Sudah dipublikasikan' : 'Draft',
    }))}
    placeholder="— Pilih sumber —"
    searchPlaceholder="Cari tanggal…"
  />
</label>
            <label className="field">
              <span>Ke tanggal</span>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn--secondary" disabled={busy}>
              Salin Jadwal
            </button>
          </div>
          <p className="muted" style={{ fontSize: 'var(--fs-xs)', margin: 0 }}>
            Guru piket tidak ikut tersalin (biasanya berbeda setiap hari).
          </p>
        </form>
      </div>

      {state.loading && <LoadingState message="Memuat daftar jadwal…" />}
      {state.error && <ErrorState description={state.error.message} onRetry={load} />}
      {!state.loading && !state.error && state.rows.length === 0 && (
        <EmptyState title="Belum ada jadwal" description="Buat jadwal baru di atas." />
      )}

      {state.rows.length > 0 && (
        <div className="card">
          <div className="table-wrap">
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