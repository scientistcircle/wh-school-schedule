import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  listMaster, createMaster, updateMaster, deleteMaster,
} from '../../services/adminService.js';
import LoadingState from '../../components/LoadingState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { Plus, Check, X, Edit2 } from 'lucide-react';

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
  
  // State form massal
  const [bulkText, setBulkText] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  // State untuk Edit Inline
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await listMaster(table);
    setState({ loading: false, error, rows: data });
  }, [table]);

  useEffect(() => { load(); }, [load]);

  // --- LOGIKA TAMBAH MASSAL ---
  const bulkParsed = useMemo(() => {
    if (!bulkText.trim()) return [];
    return bulkText.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
  }, [bulkText]);

  const uniqueBulkParsed = useMemo(() => {
    const seen = new Set();
    return bulkParsed.filter(n => {
      const lower = n.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
  }, [bulkParsed]);

  const existingNames = useMemo(() => new Set(state.rows.map(r => r.name.toLowerCase())), [state.rows]);
  const bulkNew = uniqueBulkParsed.filter(n => !existingNames.has(n.toLowerCase()));
  const bulkSkip = uniqueBulkParsed.filter(n => existingNames.has(n.toLowerCase()));

  async function submitBulk(e) {
    e.preventDefault();
    if (bulkNew.length === 0) return toast.warning('Tidak ada data baru untuk ditambahkan.');

    setBulkBusy(true);
    let success = 0;
    let failed = 0;

    for (const itemName of bulkNew) {
      const { error } = await createMaster(table, { name: itemName });
      if (error) failed++; else success++;
    }

    setBulkBusy(false);

    if (failed === 0) {
      toast.success(`${success} data berhasil ditambahkan.`);
      setBulkText('');
      load();
    } else {
      toast.warning(`${success} berhasil, ${failed} gagal.`);
      load();
    }
  }

  // --- LOGIKA EDIT INLINE ---
  function startEdit(row) {
    setEditingId(row.id);
    setEditName(row.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
  }

  async function saveEdit(id) {
    if (!editName.trim()) return toast.error('Nama tidak boleh kosong.');
    setSavingEdit(true);
    const { error } = await updateMaster(table, id, { name: editName.trim() });
    setSavingEdit(false);
    
    if (error) return toast.error(error.message);
    toast.success('Data diperbarui.');
    setEditingId(null);
    load();
  }

  // --- LOGIKA HAPUS & TOGGLE ---
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
      {/* FORM TAMBAH MASSAL (UTAMA) */}
      <form className="card admin-form" onSubmit={submitBulk} style={{ marginBottom: '16px' }}>
        <h2 className="card__title">Tambah Data Massal</h2>
        <p className="muted" style={{ marginBottom: '12px', fontSize: '13px' }}>
          Ketik atau paste banyak nama sekaligus. Pisahkan dengan <strong>Enter</strong> (baris baru), <strong>Koma (,)</strong>, atau <strong>Titik Koma (;)</strong>.
        </p>
        
        <div className="form-grid">
          <label className="field">
            <span>Daftar Nama</span>
            <textarea
              rows={6}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`Masukkan Data`}
              style={{ padding: '10px', resize: 'vertical', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <div className="muted" style={{ fontSize: '12px' }}>
            Terdeteksi: <strong>{bulkNew.length}</strong> data baru.
            {bulkSkip.length > 0 && <span style={{ color: 'var(--warning)', marginLeft: '8px' }}>({bulkSkip.length} data sudah ada/dilewati)</span>}
          </div>
          
          <button type="submit" className="btn btn--primary" disabled={bulkBusy || bulkNew.length === 0}>
            <Plus size={16}/> {bulkBusy ? 'Menyimpan...' : `Tambah ${bulkNew.length} Data`}
          </button>
        </div>
      </form>

      {/* TABEL DATA */}
      {state.loading && <LoadingState />}
      {state.error && <ErrorState description={state.error.message} onRetry={load} />}
      {!state.loading && !state.error && state.rows.length === 0 && (
        <EmptyState title="Belum ada data" />
      )}

      {state.rows.length > 0 && (
        <div className="card card--flush">
          <div className="table-wrap table-wrap--bare">
            <table className="data-table">
              <thead>
                <tr><th style={{ width: '50%' }}>Nama</th><th>Status</th><th>Aksi</th></tr>
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
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); saveEdit(r.id); }
                              if (e.key === 'Escape') cancelEdit();
                            }}
                          />
                        ) : (
                          <strong>{r.name}</strong>
                        )}
                      </td>
                      <td>{r.is_active ? 'Aktif' : 'Nonaktif'}</td>
                      <td>
                        <div className="row-actions" style={{ flexWrap: 'nowrap' }}>
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
                              <button type="button" className="btn btn--ghost btn-xs" onClick={() => toggle(r)}>
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
    </>
  );
}