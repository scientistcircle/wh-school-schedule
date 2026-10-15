import { useCallback, useEffect, useState } from 'react';
import {
  listMaster, createMaster, updateMaster, deleteMaster,
} from '../../services/adminService.js';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

const TABS = [
  { key: 'teachers', label: 'Guru' },
  { key: 'subjects', label: 'Mata Pelajaran' },
  { key: 'rooms', label: 'Ruang' },
];

export default function MasterDataPage() {
  const [tab, setTab] = useState('teachers');

  return (
    <div className="stack">
      <h1>Data Master</h1>
      <p className="muted">Kelola daftar guru, mata pelajaran, dan ruang.</p>

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

      <MasterTable key={tab} table={tab} />
    </div>
  );
}

function MasterTable({ table }) {
  const toast = useToast();
  const [state, setState] = useState({ loading: true, error: null, rows: [] });
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await listMaster(table);
    setState({ loading: false, error, rows: data });
  }, [table]);

  useEffect(() => { load(); }, [load]);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = editingId
      ? await updateMaster(table, editingId, { name: name.trim() })
      : await createMaster(table, { name: name.trim() });
    if (res.error) return toast.error(res.error.message);
    toast.success(editingId ? 'Data diperbarui.' : 'Data ditambahkan.');
    setName('');
    setEditingId(null);
    load();
  }

  async function toggle(row) {
    const { error } = await updateMaster(table, row.id, { is_active: !row.is_active });
    if (error) return toast.error(error.message);
    load();
  }

  async function hapus(row) {
    if (!confirm(`Hapus "${row.name}"?`)) return;
    const { error } = await deleteMaster(table, row.id);
    if (error) return toast.error(error.message);
    toast.success('Data dihapus.');
    load();
  }

  return (
    <>
      <form className="card admin-form" onSubmit={submit}>
        <h2 className="card__title">{editingId ? 'Edit Data' : 'Tambah Data'}</h2>
        <div className="form-grid">
          <label className="field">
            <span>Nama</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn--primary">
            {editingId ? 'Simpan Perubahan' : 'Tambah'}
          </button>
          {editingId && (
            <button type="button" className="btn btn--ghost" onClick={() => { setName(''); setEditingId(null); }}>
              Batal
            </button>
          )}
        </div>
      </form>

      {state.loading && <LoadingState />}
      {state.error && <ErrorState description={state.error.message} onRetry={load} />}
      {!state.loading && !state.error && state.rows.length === 0 && (
        <EmptyState title="Belum ada data" />
      )}

      {state.rows.length > 0 && (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Nama</th><th>Status</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {state.rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.is_active ? 'Aktif' : 'Nonaktif'}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="btn btn--ghost" onClick={() => { setEditingId(r.id); setName(r.name); }}>Edit</button>
                        <button type="button" className="btn btn--ghost" onClick={() => toggle(r)}>
                          {r.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button type="button" className="btn btn--danger" onClick={() => hapus(r)}>Hapus</button>
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