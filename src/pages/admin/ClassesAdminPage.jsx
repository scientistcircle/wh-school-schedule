import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listMaster, createMaster, updateMaster, deleteMaster,
} from '../../services/adminService.js';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

// Parse input massal: newline/comma split + range expansion (X1-X8).
function parseBulkInput(text) {
  const raw = text.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
  const out = [];
  for (const line of raw) {
    const m = line.match(/^([A-Za-z]+)\s*(\d+)\s*[-–]\s*(?:[A-Za-z]+\s*)?(\d+)$/);
    if (m) {
      const prefix = m[1];
      const start = parseInt(m[2], 10);
      const end = parseInt(m[3], 10);
      if (Number.isFinite(start) && Number.isFinite(end) && start <= end && end - start < 100) {
        for (let i = start; i <= end; i++) out.push(`${prefix}${i}`);
        continue;
      }
    }
    out.push(line);
  }
  // Dedupe case-insensitive
  const seen = new Set();
  return out.filter((n) => {
    const key = n.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function ClassesAdminPage() {
  const toast = useToast();
  const [state, setState] = useState({ loading: true, error: null, rows: [] });
  const [mode, setMode] = useState('single'); // 'single' | 'bulk'

  // Single mode
  const [form, setForm] = useState({ name: '', grade_level: 'X', display_order: 0 });
  const [editingId, setEditingId] = useState(null);

  // Bulk mode
  const [bulkText, setBulkText] = useState('');
  const [bulkGrade, setBulkGrade] = useState('X');
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await listMaster('classes');
    setState({ loading: false, error, rows: data });
  }, []);

  useEffect(() => { load(); }, [load]);

  const bulkParsed = useMemo(() => parseBulkInput(bulkText), [bulkText]);
  const existingNames = useMemo(
    () => new Set(state.rows.map((r) => r.name.toLowerCase())),
    [state.rows]
  );
  const bulkNew = bulkParsed.filter((n) => !existingNames.has(n.toLowerCase()));
  const bulkSkip = bulkParsed.filter((n) => existingNames.has(n.toLowerCase()));

  function resetSingle() {
    setForm({ name: '', grade_level: 'X', display_order: 0 });
    setEditingId(null);
  }

  async function submitSingle(e) {
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
    resetSingle();
    load();
  }

  async function submitBulk(e) {
    e.preventDefault();
    if (bulkNew.length === 0) {
      return toast.warning('Tidak ada kelas baru untuk ditambahkan.');
    }

    // display_order mulai dari max + 1
    const maxOrder = state.rows.reduce((mx, r) => Math.max(mx, r.display_order ?? 0), 0);
    setBulkBusy(true);
    let success = 0;
    let failed = 0;
    for (let i = 0; i < bulkNew.length; i++) {
      const { error } = await createMaster('classes', {
        name: bulkNew[i],
        grade_level: bulkGrade || null,
        display_order: maxOrder + 1 + i,
      });
      if (error) failed++;
      else success++;
    }
    setBulkBusy(false);

    if (failed === 0) {
      toast.success(`${success} kelas berhasil ditambahkan.`);
      setBulkText('');
      load();
    } else {
      toast.warning(`${success} kelas berhasil, ${failed} gagal.`);
      load();
    }
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
    setMode('single');
    setEditingId(row.id);
    setForm({
      name: row.name,
      grade_level: row.grade_level ?? '',
      display_order: row.display_order ?? 0,
    });
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Data Kelas</h1>
          <p className="muted">Kelola daftar kelas. Bisa satu-satu atau tambah banyak sekaligus.</p>
        </div>
        <div className="page-header__counts">
          <span className="stat-pill">
            <strong>{state.rows.length}</strong> total
          </span>
          <span className="stat-pill">
            <strong>{state.rows.filter((r) => r.is_active).length}</strong> aktif
          </span>
        </div>
      </div>

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
          Tambah massal
        </button>
      </nav>

      {mode === 'single' && (
        <form className="card admin-form" onSubmit={submitSingle}>
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
              <button type="button" className="btn btn--ghost" onClick={resetSingle}>Batal</button>
            )}
          </div>
        </form>
      )}

      {mode === 'bulk' && (
        <form className="card admin-form" onSubmit={submitBulk}>
          <h2 className="card__title">Tambah Banyak Kelas Sekaligus</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Tulis satu nama kelas per baris. Bisa juga pisah dengan koma.
            Dukungan rentang: <code>X1-X8</code> otomatis jadi X1 sampai X8.
          </p>

          <div className="form-grid">
            <label className="field field--wide">
              <span>Daftar Kelas</span>
              <textarea
                rows={8}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`X1-X8\nXI PA\nXI PI\nXII Science 1\nXII Science 2\nXII Social 1-XII Social 3`}
              />
            </label>
            <label className="field">
              <span>Tingkat untuk semua</span>
              <select value={bulkGrade} onChange={(e) => setBulkGrade(e.target.value)}>
                <option value="X">X</option>
                <option value="XI">XI</option>
                <option value="XII">XII</option>
                <option value="">-</option>
              </select>
            </label>
          </div>

          {bulkParsed.length > 0 && (
            <div className="bulk-preview">
              <div className="bulk-preview__stats">
                <span className="stat-pill stat-pill--success">
                  <strong>{bulkNew.length}</strong> baru
                </span>
                {bulkSkip.length > 0 && (
                  <span className="stat-pill stat-pill--warning">
                    <strong>{bulkSkip.length}</strong> dilewati (sudah ada)
                  </span>
                )}
              </div>

              {bulkNew.length > 0 && (
                <div className="bulk-preview__chips">
                  {bulkNew.map((n) => (
                    <span key={n} className="chip">{n}</span>
                  ))}
                </div>
              )}

              {bulkSkip.length > 0 && (
                <details className="bulk-preview__skipped">
                  <summary>Lihat yang dilewati</summary>
                  <div className="bulk-preview__chips">
                    {bulkSkip.map((n) => (
                      <span key={n} className="chip chip--muted">{n}</span>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={bulkBusy || bulkNew.length === 0}
            >
              {bulkBusy
                ? 'Menyimpan…'
                : `Tambah ${bulkNew.length} Kelas`}
            </button>
            {bulkText && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setBulkText('')}
                disabled={bulkBusy}
              >
                Bersihkan
              </button>
            )}
          </div>
        </form>
      )}

      {state.loading && <LoadingState message="Memuat daftar kelas…" />}
      {state.error && <ErrorState description={state.error.message} onRetry={load} />}
      {!state.loading && !state.error && state.rows.length === 0 && (
        <EmptyState title="Belum ada kelas" description="Tambahkan kelas lewat form di atas." />
      )}

      {state.rows.length > 0 && (
        <div className="card card--flush">
          <div className="table-wrap table-wrap--bare">
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
                    <td>
                      <span className={'status-dot ' + (r.is_active ? 'is-on' : 'is-off')}>
                        {r.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
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