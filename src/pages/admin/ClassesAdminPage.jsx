import { useCallback, useEffect, useState } from 'react';
import {
  listMaster, createMaster, updateMaster, deleteMaster,
} from '../../services/adminService.js';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function ClassesAdminPage() {
  const toast = useToast();
  const [state, setState] = useState({ loading: true, error: null, rows: [] });
  const [form, setForm] = useState({ name: '', grade_level: 'X', display_order: 0 });
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await listMaster('classes');
    if (error) setState({ loading: false, error, rows: [] });
    else setState({ loading: false, error: null, rows: data });
  }, []);

  useEffect(() => { load(); }, [load]);

  function reset() {
    setForm({ name: '', grade_level: 'X', display_order: 0 });
    setEditingId(null);
  }

  async function submit(e) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      grade_level: form.grade_level.trim() || null,
      display_order: Number(form.display_order) || 0,
    };
    if (!payload.name) return toast.error('Nama kelas wajib diisi.');

    const res = editingId
      ? await updateMaster('classes', editingId, payload)
      : await createMaster('classes', payload);

    if (res.error) return toast.error(res.error.message);
    toast.success(editingId ? 'Kelas diperbarui.' : 'Kelas ditambahkan.');
    reset();
    load();
  }

  async function toggleActive(row) {
    const { error } = await updateMaster('classes', row.id, { is_active: !row.is_active });
    if (error) return toast.error(error.message);
    load();
  }

  async function hapus(row) {
    if (!confirm(`Hapus kelas "${row.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    const { error } = await deleteMaster('classes', row.id);
    if (error) return toast.error(error.message);
    toast.success('Kelas dihapus.');
    load();
  }

  function edit(row) {
    setEditingId(row.id);
    setForm({
      name: row.name,
      grade_level: row.grade_level ?? '',
      display_order: row.display_order ?? 0,
    });
  }

  return (
    <div className="stack">
      <h1>Data Kelas</h1>

      <form className="card admin-form" onSubmit={submit}>
        <h2 className="card__title">{editingId ? 'Edit Kelas' : 'Tambah Kelas'}</h2>
        <div className="form-grid">
          <label className="field">
            <span>Nama Kelas</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: X1"
              required
            />
          </label>
          <label className="field">
            <span>Tingkat</span>
            <select
              value={form.grade_level}
              onChange={(e) => setForm({ ...form, grade_level: e.target.value })}
            >
              <option value="X">X</option>
              <option value="XI">XI</option>
              <option value="XII">XII</option>
              <option value="">-</option>
            </select>
          </label>
          <label className="field">
            <span>Urutan</span>
            <input
              type="number"
              value={form.display_order}
              onChange={(e) => setForm({ ...form, display_order: e.target.value })}
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn--primary">
            {editingId ? 'Simpan Perubahan' : 'Tambah Kelas'}
          </button>
          {editingId && (
            <button type="button" className="btn btn--ghost" onClick={reset}>
              Batal
            </button>
          )}
        </div>
      </form>

      {state.loading && <LoadingState message="Memuat daftar kelas…" />}
      {state.error && <ErrorState description={state.error.message} onRetry={load} />}
      {!state.loading && !state.error && state.rows.length === 0 && (
        <EmptyState title="Belum ada kelas" description="Tambahkan kelas pertama di atas." />
      )}

      {state.rows.length > 0 && (
        <div className="card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Tingkat</th>
                  <th>Urutan</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {state.rows.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.name}</strong></td>
                    <td>{r.grade_level ?? '-'}</td>
                    <td>{r.display_order}</td>
                    <td>{r.is_active ? 'Aktif' : 'Nonaktif'}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="btn btn--ghost" onClick={() => edit(r)}>Edit</button>
                        <button type="button" className="btn btn--ghost" onClick={() => toggleActive(r)}>
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
    </div>
  );
}