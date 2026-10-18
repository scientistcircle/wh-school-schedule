import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listMaster, createMaster, updateMaster, deleteMaster,
} from '../../services/adminService.js';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { Plus, Check, X, Edit2 } from 'lucide-react';

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
  const [mode, setMode] = useState('single'); 
  
  const [newForm, setNewForm] = useState({ name: '', grade_level: 'X', display_order: 0 });
  const [bulkText, setBulkText] = useState('');
  const [bulkGrade, setBulkGrade] = useState('X');
  const [bulkBusy, setBulkBusy] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', grade_level: 'X', display_order: 0 });
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await listMaster('classes');
    setState({ loading: false, error, rows: data });
  }, []);

  useEffect(() => { load(); }, [load]);

  const bulkParsed = useMemo(() => parseBulkInput(bulkText), [bulkText]);
  const existingNames = useMemo(() => new Set(state.rows.map((r) => r.name.toLowerCase())), [state.rows]);
  const bulkNew = bulkParsed.filter((n) => !existingNames.has(n.toLowerCase()));
  const bulkSkip = bulkParsed.filter((n) => existingNames.has(n.toLowerCase()));

  async function submitAdd(e) {
    e.preventDefault();
    const payload = {
      name: newForm.name.trim(),
      grade_level: newForm.grade_level.trim() || null,
      display_order: Number(newForm.display_order) || 0,
    };
    if (!payload.name) return toast.error('Nama kelas wajib diisi.');

    const res = await createMaster('classes', payload);
    if (res.error) return toast.error(res.error.message);
    
    toast.success('Kelas ditambahkan.');
    setNewForm({ name: '', grade_level: 'X', display_order: 0 });
    load();
  }

  async function submitBulk(e) {
    e.preventDefault();
    if (bulkNew.length === 0) return toast.warning('Tidak ada kelas baru untuk ditambahkan.');

    const maxOrder = state.rows.reduce((mx, r) => Math.max(mx, r.display_order ?? 0), 0);
    setBulkBusy(true);
    let success = 0; let failed = 0;
    
    for (let i = 0; i < bulkNew.length; i++) {
      const { error } = await createMaster('classes', {
        name: bulkNew[i],
        grade_level: bulkGrade || null,
        display_order: maxOrder + 1 + i,
      });
      if (error) failed++; else success++;
    }
    setBulkBusy(false);

    if (failed === 0) {
      toast.success(`${success} kelas ditambahkan.`);
      setBulkText('');
      load();
    } else {
      toast.warning(`${success} berhasil, ${failed} gagal.`);
      load();
    }
  }

  function startEdit(row) {
    setEditingId(row.id);
    setEditForm({
      name: row.name,
      grade_level: row.grade_level ?? 'X',
      display_order: row.display_order ?? 0,
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id) {
    if (!editForm.name.trim()) return toast.error('Nama tidak boleh kosong.');
    setSavingEdit(true);
    const { error } = await updateMaster('classes', id, {
      name: editForm.name.trim(),
      grade_level: editForm.grade_level || null,
      display_order: Number(editForm.display_order) || 0,
    });
    setSavingEdit(false);
    
    if (error) return toast.error(error.message);
    toast.success('Kelas diperbarui.');
    setEditingId(null);
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

  return (
    <div className="stack-simple">
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1>Data Kelas</h1>
          <p className="muted">Kelola daftar kelas. Bisa tambah massal dan edit langsung di tabel.</p>
        </div>
        <div className="page-header__counts">
          <span className="stat-pill"><strong>{state.rows.length}</strong> total</span>
          <span className="stat-pill"><strong>{state.rows.filter((r) => r.is_active).length}</strong> aktif</span>
        </div>
      </div>

      <nav className="period-tabs" style={{ marginBottom: '12px' }}>
        <button type="button" className={'period-tabs__link' + (mode === 'single' ? ' is-active' : '')} onClick={() => setMode('single')}>Tambah Satu</button>
        <button type="button" className={'period-tabs__link' + (mode === 'bulk' ? ' is-active' : '')} onClick={() => setMode('bulk')}>Tambah Massal</button>
      </nav>

      {mode === 'single' && (
        <form className="card compact-card" onSubmit={submitAdd} style={{ maxWidth: '100%', marginBottom: '16px' }}>
          <div className="form-inline">
            <label className="field" style={{ flex: 2 }}><span>Nama Kelas</span><input value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} placeholder="Contoh: X1" required /></label>
            <label className="field" style={{ flex: 1 }}><span>Tingkat</span>
              <select value={newForm.grade_level} onChange={(e) => setNewForm({ ...newForm, grade_level: e.target.value })}>
                <option value="X">X</option><option value="XI">XI</option><option value="XII">XII</option><option value="">-</option>
              </select>
            </label>
            <label className="field" style={{ flex: 1 }}><span>Urutan</span><input type="number" value={newForm.display_order} onChange={(e) => setNewForm({ ...newForm, display_order: e.target.value })} /></label>
            <div className="form-actions">
              <button type="submit" className="btn btn--primary"><Plus size={16}/> Tambah</button>
            </div>
          </div>
        </form>
      )}

      {mode === 'bulk' && (
        <form className="card compact-card" onSubmit={submitBulk} style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <label className="field" style={{ flex: 1, minWidth: '280px' }}>
              <span>Daftar Kelas (Satu per baris / Rentang: X1-X8)</span>
              <textarea rows={4} value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder={`X1-X8\nXI PA\nXI PI`} style={{ padding: '8px', resize: 'vertical' }} />
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="field">
                <span>Tingkat untuk semua</span>
                <select value={bulkGrade} onChange={(e) => setBulkGrade(e.target.value)}>
                  <option value="X">X</option><option value="XI">XI</option><option value="XII">XII</option><option value="">-</option>
                </select>
              </label>
              <button type="submit" className="btn btn--primary" disabled={bulkBusy || bulkNew.length === 0}>
                {bulkBusy ? 'Menyimpan…' : `Tambah ${bulkNew.length} Kelas`}
              </button>
            </div>
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
                  <th style={{ width: '35%' }}>Nama</th>
                  <th style={{ width: '15%' }}>Tingkat</th>
                  <th style={{ width: '10%' }}>Urutan</th>
                  <th style={{ width: '15%' }}>Status</th>
                  <th style={{ width: '250px', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {state.rows.map((r) => {
                  const isEditing = editingId === r.id;
                  return (
                    <tr key={r.id} className={isEditing ? 'row-editing' : ''}>
                      <td>
                        {isEditing ? (
                          <input 
                            className="input-inline"
                            value={editForm.name} 
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                            autoFocus
                          />
                        ) : (
                          <strong>{r.name}</strong>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select 
                            className="input-inline"
                            value={editForm.grade_level} 
                            onChange={(e) => setEditForm({ ...editForm, grade_level: e.target.value })}
                          >
                            <option value="X">X</option><option value="XI">XI</option><option value="XII">XII</option><option value="">-</option>
                          </select>
                        ) : (
                          r.grade_level ?? '-'
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input 
                            className="input-inline"
                            type="number" 
                            value={editForm.display_order} 
                            onChange={(e) => setEditForm({ ...editForm, display_order: e.target.value })} 
                          />
                        ) : (
                          r.display_order
                        )}
                      </td>
                      <td>
                        <span className={'status-dot ' + (r.is_active ? 'is-on' : 'is-off')}>
                          {r.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                          {isEditing ? (
                            <>
                              <button type="button" className="btn btn--primary btn-xs" onClick={() => saveEdit(r.id)} disabled={savingEdit}>
                                <Check size={14}/> Simpan
                              </button>
                              <button type="button" className="btn btn--ghost btn-xs" onClick={cancelEdit} disabled={savingEdit}>
                                <X size={14}/> Batal
                              </button>
                            </>
                          ) : (
                            <>
                              <button type="button" className="btn btn--ghost btn-xs" onClick={() => startEdit(r)}>
                                <Edit2 size={14}/> Edit
                              </button>
                              <button type="button" className="btn btn--ghost btn-xs" onClick={() => toggleActive(r)}>
                                {r.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                              </button>
                              <button type="button" className="btn btn--danger btn-xs" onClick={() => hapus(r)}>Hapus</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}