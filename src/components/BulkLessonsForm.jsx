import { useMemo, useState } from 'react';
import { Save, Zap, Trash2, CheckSquare, Square, Eraser } from 'lucide-react';
import SearchableSelect from './SearchableSelect.jsx';
import { bulkUpsertLessons, deleteLesson } from '../services/adminService.js';
import { useToast } from '../contexts/ToastContext.jsx';

const EMPTY_ROW = { teacher_id: '', subject_id: '', room_id: '' };

export default function BulkLessonsForm({ day, period, classes, teachers, subjects, rooms, existingLessons, onSaved }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState(new Set());

  const [rows, setRows] = useState(() => {
    const initial = {};
    for (const c of classes) {
      const existing = existingLessons.find((l) => l.class_id === c.id);
      initial[c.id] = existing
        ? { teacher_id: existing.teacher_id ?? '', subject_id: existing.subject_id ?? '', room_id: existing.room_id ?? '', lesson_id: existing.id }
        : { ...EMPTY_ROW, lesson_id: null };
    }
    return initial;
  });

  const [bulkTeacher, setBulkTeacher] = useState('');
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkRoom, setBulkRoom] = useState('');

  const teacherOptions = useMemo(() => teachers.map((t) => ({ value: t.id, label: t.name })), [teachers]);
  const subjectOptions = useMemo(() => subjects.map((s) => ({ value: s.id, label: s.name })), [subjects]);
  const roomOptions = useMemo(() => rooms.map((r) => ({ value: r.id, label: r.name })), [rooms]);

  const stats = useMemo(() => {
    let complete = 0; let partial = 0; let empty = 0;
    for (const c of classes) {
      const r = rows[c.id] ?? EMPTY_ROW;
      const filled = [r.teacher_id, r.subject_id, r.room_id].filter(Boolean).length;
      if (filled === 3) complete++;
      else if (filled > 0) partial++;
      else empty++;
    }
    return { complete, partial, empty, total: classes.length };
  }, [rows, classes]);

  function updateRow(classId, patch) {
    setRows((prev) => ({ ...prev, [classId]: { ...(prev[classId] ?? EMPTY_ROW), ...patch } }));
  }

  function toggleClass(id) {
    setSelectedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedClasses.size === classes.length) setSelectedClasses(new Set());
    else setSelectedClasses(new Set(classes.map((c) => c.id)));
  }

  function applyBulkToSelected() {
    if (selectedClasses.size === 0) return toast.warning('Centang kelas terlebih dahulu.');
    if (!bulkTeacher && !bulkSubject && !bulkRoom) return toast.warning('Pilih minimal satu nilai.');
    
    setRows((prev) => {
      const next = { ...prev };
      for (const c of classes) {
        if (selectedClasses.has(c.id)) {
          const r = next[c.id] ?? EMPTY_ROW;
          next[c.id] = { ...r, teacher_id: bulkTeacher || r.teacher_id, subject_id: bulkSubject || r.subject_id, room_id: bulkRoom || r.room_id };
        }
      }
      return next;
    });
    toast.success(`Diterapkan ke ${selectedClasses.size} kelas.`);
  }

  function applyBulkToAll() {
    if (!bulkTeacher && !bulkSubject && !bulkRoom) return toast.warning('Pilih minimal satu nilai.');
    setRows((prev) => {
      const next = { ...prev };
      for (const c of classes) {
        const r = next[c.id] ?? EMPTY_ROW;
        next[c.id] = { ...r, teacher_id: bulkTeacher || r.teacher_id, subject_id: bulkSubject || r.subject_id, room_id: bulkRoom || r.room_id };
      }
      return next;
    });
    toast.success('Diterapkan ke semua baris.');
  }

  function clearSelected() {
    if (selectedClasses.size === 0) return toast.warning('Centang kelas yang ingin dikosongkan.');
    if (!confirm(`Kosongkan isian untuk ${selectedClasses.size} kelas terpilih? (Klik Simpan untuk menerapkan)`)) return;
    
    setRows((prev) => {
      const next = { ...prev };
      for (const c of classes) {
        if (selectedClasses.has(c.id)) {
          // Jangan hapus lesson_id agar sistem tahu ini harus dihapus dari DB saat simpan
          next[c.id] = { ...next[c.id], teacher_id: '', subject_id: '', room_id: '' };
        }
      }
      return next;
    });
    toast.info('Isian kelas terpilih dikosongkan.');
  }

  function clearAll() {
    if (!confirm('Kosongkan SEMUA isian di layar ini? (Klik Simpan untuk menerapkan)')) return;
    setRows((prev) => {
      const next = { ...prev };
      for (const c of classes) {
        next[c.id] = { ...next[c.id], teacher_id: '', subject_id: '', room_id: '' };
      }
      return next;
    });
    setSelectedClasses(new Set());
    toast.info('Semua isian dikosongkan.');
  }

  async function save() {
    const toUpsert = [];
    const toDelete = [];
    const incomplete = [];

    for (const c of classes) {
      const r = rows[c.id] ?? EMPTY_ROW;
      const filled = [r.teacher_id, r.subject_id, r.room_id].filter(Boolean).length;

      if (filled === 3) {
        toUpsert.push({ class_id: c.id, teacher_id: r.teacher_id, subject_id: r.subject_id, room_id: r.room_id });
      } else if (filled === 0) {
        if (r.lesson_id) {
          toDelete.push(r.lesson_id); // Tandai untuk dihapus dari database
        }
      } else {
        incomplete.push(c.name);
      }
    }
    
    if (incomplete.length > 0) return toast.error(`Ada ${incomplete.length} baris belum lengkap.`);
    if (toUpsert.length === 0 && toDelete.length === 0) return toast.warning('Tidak ada perubahan untuk disimpan.');

    setBusy(true);
    
    // 1. Proses Hapus
    if (toDelete.length > 0) {
      for (const id of toDelete) {
        const { error } = await deleteLesson(id);
        if (error) {
          setBusy(false);
          return toast.error(error.message);
        }
      }
    }

    // 2. Proses Simpan/Update
    if (toUpsert.length > 0) {
      const { error } = await bulkUpsertLessons(day.id, period.id, toUpsert);
      if (error) {
        setBusy(false);
        return toast.error(error.message);
      }
    }

    setBusy(false);
    toast.success(`${toUpsert.length} disimpan, ${toDelete.length} dihapus.`);
    setSelectedClasses(new Set());
    onSaved();
  }

  async function deleteExisting(classId) {
    const r = rows[classId];
    if (!r?.lesson_id) return;
    if (!confirm('Hapus pelajaran kelas ini secara permanen dari database?')) return;
    const { error } = await deleteLesson(r.lesson_id);
    if (error) return toast.error(error.message);
    toast.success('Pelajaran dihapus dari database.');
    setRows((prev) => ({ ...prev, [classId]: { ...EMPTY_ROW, lesson_id: null } }));
    onSaved();
  }

  const allSelected = classes.length > 0 && selectedClasses.size === classes.length;

  return (
    <div className="bulk-lessons">
      
      {/* HEADER TOOLBAR (2 BARIS) */}
      <div className="bulk-toolbar-container">
        
        {/* BARIS 1: ISI CEPAT */}
        <div className="bulk-toolbar-row">
          <span className="bulk-toolbar__label"><Zap size={14} /> ISI CEPAT</span>
          <div className="bulk-toolbar__fields">
            <SearchableSelect value={bulkTeacher} onChange={setBulkTeacher} options={teacherOptions} placeholder="Guru…" searchPlaceholder="Cari…" />
            <SearchableSelect value={bulkSubject} onChange={setBulkSubject} options={subjectOptions} placeholder="Mapel…" searchPlaceholder="Cari…" />
            <SearchableSelect value={bulkRoom} onChange={setBulkRoom} options={roomOptions} placeholder="Ruang…" searchPlaceholder="Cari…" />
          </div>
          <div className="bulk-toolbar__actions">
            <button type="button" className="btn btn--secondary btn--xs" onClick={applyBulkToSelected}>Ke Terpilih</button>
            <button type="button" className="btn btn--ghost btn--xs" onClick={applyBulkToAll}>Ke Semua</button>
          </div>
        </div>

        {/* BARIS 2: HAPUS & SIMPAN */}
        <div className="bulk-toolbar-row bulk-toolbar-row--bottom">
          <div className="bulk-toolbar__clear">
            <button type="button" className="btn btn--ghost btn--xs" onClick={clearSelected} disabled={selectedClasses.size === 0} style={{ color: 'var(--danger)' }}>
              <Eraser size={14} /> Kosongkan Terpilih
            </button>
            <button type="button" className="btn btn--ghost btn--xs" onClick={clearAll} style={{ color: 'var(--danger)' }}>
              <Eraser size={14} /> Kosongkan Semua
            </button>
          </div>
          
          <div className="bulk-toolbar__save">
            <div className="bulk-stats">
              <span className="text-success">{stats.complete} siap</span>
              {stats.partial > 0 && <span className="text-warning">{stats.partial} setengah</span>}
            </div>
            <button type="button" className="btn btn--primary" onClick={save} disabled={busy || (stats.complete === 0 && stats.empty === stats.total)}>
              <Save size={16} /> Simpan
            </button>
          </div>
        </div>

      </div>

      {/* TABEL */}
      <div className="bulk-grid-wrap">
        <table className="bulk-grid">
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: 'center' }}>
                <button type="button" onClick={toggleAll} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'inherit' }}>
                  {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              </th>
              <th className="bulk-grid__class">Kelas</th>
              <th>Guru</th>
              <th>Mata Pelajaran</th>
              <th>Ruang</th>
              <th className="bulk-grid__status">Status</th>
              <th className="bulk-grid__action"></th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => {
              const r = rows[c.id] ?? EMPTY_ROW;
              const filled = [r.teacher_id, r.subject_id, r.room_id].filter(Boolean).length;
              const status = filled === 3 ? 'complete' : filled > 0 ? 'partial' : 'empty';
              const isSelected = selectedClasses.has(c.id);
              
              return (
                <tr key={c.id} data-status={status} className={isSelected ? 'is-selected' : ''}>
                  <td style={{ textAlign: 'center' }}>
                    <button type="button" onClick={() => toggleClass(c.id)} style={{ background: 'none', border: 0, cursor: 'pointer', color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="bulk-grid__class"><strong>{c.name}</strong></td>
                  <td><SearchableSelect value={r.teacher_id} onChange={(v) => updateRow(c.id, { teacher_id: v })} options={teacherOptions} placeholder="Guru…" searchPlaceholder="Cari…" /></td>
                  <td><SearchableSelect value={r.subject_id} onChange={(v) => updateRow(c.id, { subject_id: v })} options={subjectOptions} placeholder="Mapel…" searchPlaceholder="Cari…" /></td>
                  <td><SearchableSelect value={r.room_id} onChange={(v) => updateRow(c.id, { room_id: v })} options={roomOptions} placeholder="Ruang…" searchPlaceholder="Cari…" /></td>
                  <td className="bulk-grid__status">
                    {status === 'complete' && <span className="dot dot--success" title="Lengkap">●</span>}
                    {status === 'partial' && <span className="dot dot--warning" title="Setengah">●</span>}
                    {status === 'empty' && <span className="dot dot--muted" title="Kosong">●</span>}
                  </td>
                  <td className="bulk-grid__action">
                    {r.lesson_id && (
                      <button type="button" className="btn btn--ghost btn--xs" onClick={() => deleteExisting(c.id)} title="Hapus dari database">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}