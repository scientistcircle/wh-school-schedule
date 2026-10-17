import { useMemo, useState } from 'react';
import { Save, Zap, Trash2, CheckSquare, Square } from 'lucide-react';
import SearchableSelect from './SearchableSelect.jsx';
import { bulkUpsertLessons, deleteLesson } from '../services/adminService.js';
import { useToast } from '../contexts/ToastContext.jsx';

const EMPTY_ROW = {
  teacher_id: '',
  subject_id: '',
  room_id: '',
};

export default function BulkLessonsForm({
  day,
  period,
  classes,
  teachers,
  subjects,
  rooms,
  existingLessons,
  onSaved,
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState(new Set());

  // State tiap baris: class_id -> { teacher_id, subject_id, room_id, lesson_id? }
  const [rows, setRows] = useState(() => {
    const initial = {};
    for (const c of classes) {
      const existing = existingLessons.find((l) => l.class_id === c.id);
      initial[c.id] = existing
        ? {
            teacher_id: existing.teacher_id ?? '',
            subject_id: existing.subject_id ?? '',
            room_id: existing.room_id ?? '',
            lesson_id: existing.id,
          }
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

  // Statistik
  const stats = useMemo(() => {
    let complete = 0;
    let partial = 0;
    let empty = 0;
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
    setRows((prev) => ({
      ...prev,
      [classId]: { ...(prev[classId] ?? EMPTY_ROW), ...patch },
    }));
  }

  // --- Logika Checkbox ---
  function toggleClass(id) {
    setSelectedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedClasses.size === classes.length) {
      setSelectedClasses(new Set());
    } else {
      setSelectedClasses(new Set(classes.map((c) => c.id)));
    }
  }

  // --- Logika Isi Cepat ---
  function applyBulkToSelected() {
    if (selectedClasses.size === 0) {
      return toast.warning('Centang kelas terlebih dahulu di kolom paling kiri.');
    }
    if (!bulkTeacher && !bulkSubject && !bulkRoom) {
      return toast.warning('Pilih minimal satu nilai untuk diisi cepat.');
    }
    setRows((prev) => {
      const next = { ...prev };
      for (const c of classes) {
        if (selectedClasses.has(c.id)) {
          const r = next[c.id] ?? EMPTY_ROW;
          next[c.id] = {
            ...r,
            teacher_id: bulkTeacher || r.teacher_id,
            subject_id: bulkSubject || r.subject_id,
            room_id: bulkRoom || r.room_id,
          };
        }
      }
      return next;
    });
    toast.success(`Nilai diterapkan ke ${selectedClasses.size} kelas terpilih.`);
  }

  function applyBulkToAll() {
    if (!bulkTeacher && !bulkSubject && !bulkRoom) {
      return toast.warning('Pilih minimal satu nilai untuk diisi cepat.');
    }
    setRows((prev) => {
      const next = { ...prev };
      for (const c of classes) {
        const r = next[c.id] ?? EMPTY_ROW;
        next[c.id] = {
          ...r,
          teacher_id: bulkTeacher || r.teacher_id,
          subject_id: bulkSubject || r.subject_id,
          room_id: bulkRoom || r.room_id,
        };
      }
      return next;
    });
    toast.success('Nilai diterapkan ke semua baris.');
  }

  function clearAll() {
    if (!confirm('Kosongkan semua kolom (tidak menghapus yang sudah tersimpan sampai Anda klik Simpan)?')) return;
    setRows(() => {
      const next = {};
      for (const c of classes) next[c.id] = { ...EMPTY_ROW, lesson_id: null };
      return next;
    });
    setSelectedClasses(new Set());
  }

  async function save() {
    const complete = [];
    const incomplete = [];
    for (const c of classes) {
      const r = rows[c.id] ?? EMPTY_ROW;
      const filled = [r.teacher_id, r.subject_id, r.room_id].filter(Boolean).length;
      if (filled === 0) continue;
      if (filled < 3) {
        incomplete.push(c.name);
        continue;
      }
      complete.push({
        class_id: c.id,
        teacher_id: r.teacher_id,
        subject_id: r.subject_id,
        room_id: r.room_id,
      });
    }

    if (incomplete.length > 0) {
      return toast.error(`Ada ${incomplete.length} baris belum lengkap.`);
    }
    if (complete.length === 0) return toast.warning('Belum ada baris lengkap.');

    setBusy(true);
    const { error } = await bulkUpsertLessons(day.id, period.id, complete);
    setBusy(false);
    if (error) return toast.error(error.message);
    
    toast.success(`${complete.length} pelajaran disimpan.`);
    setSelectedClasses(new Set()); // Reset centang setelah simpan
    onSaved();
  }

  const allSelected = classes.length > 0 && selectedClasses.size === classes.length;

  return (
    <div className="bulk-lessons">
      {/* Toolbar isi cepat */}
      <div className="bulk-toolbar">
        <div className="bulk-toolbar__row">
          <span className="bulk-toolbar__label">
            <Zap size={13} strokeWidth={2.5} />
            Isi cepat
          </span>

          <div className="bulk-toolbar__fields">
            <SearchableSelect
              value={bulkTeacher}
              onChange={setBulkTeacher}
              options={teacherOptions}
              placeholder="Guru…"
              searchPlaceholder="Cari guru…"
            />
            <SearchableSelect
              value={bulkSubject}
              onChange={setBulkSubject}
              options={subjectOptions}
              placeholder="Mapel…"
              searchPlaceholder="Cari mapel…"
            />
            <SearchableSelect
              value={bulkRoom}
              onChange={setBulkRoom}
              options={roomOptions}
              placeholder="Ruang…"
              searchPlaceholder="Cari ruang…"
            />
          </div>

          <div className="bulk-toolbar__actions">
            <button
              type="button"
              className="btn btn--secondary btn--xs"
              onClick={applyBulkToSelected}
              title="Terapkan ke kelas yang dicentang"
              style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
            >
              Ke Terpilih ({selectedClasses.size})
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--xs"
              onClick={applyBulkToAll}
              title="Terapkan ke semua baris"
            >
              Ke Semua
            </button>
          </div>
        </div>

        <div className="bulk-toolbar__stats">
          <span className="stat-pill stat-pill--success">
            <strong>{stats.complete}</strong> lengkap
          </span>
          {stats.partial > 0 && (
            <span className="stat-pill stat-pill--warning">
              <strong>{stats.partial}</strong> setengah
            </span>
          )}
          <span className="stat-pill">
            <strong>{stats.empty}</strong> kosong
          </span>
          <div className="bulk-toolbar__spacer" />
          <button type="button" className="btn btn--ghost btn--xs" onClick={clearAll}>
            <Trash2 size={13} strokeWidth={2.25} />
            <span>Bersihkan</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="bulk-grid-wrap">
        <table className="bulk-grid">
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={toggleAll}
                  style={{ background: 'none', border: 0, cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center' }}
                  title={allSelected ? 'Batal pilih semua' : 'Pilih semua'}
                >
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
                <tr key={c.id} data-status={status} style={{ background: isSelected ? 'var(--primary-soft)' : undefined }}>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => toggleClass(c.id)}
                      style={{ background: 'none', border: 0, cursor: 'pointer', color: isSelected ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                    >
                      {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </td>
                  <td className="bulk-grid__class">
                    <strong>{c.name}</strong>
                  </td>
                  <td>
                    <SearchableSelect
                      value={r.teacher_id}
                      onChange={(v) => updateRow(c.id, { teacher_id: v })}
                      options={teacherOptions}
                      placeholder="Guru…"
                      searchPlaceholder="Cari guru…"
                    />
                  </td>
                  <td>
                    <SearchableSelect
                      value={r.subject_id}
                      onChange={(v) => updateRow(c.id, { subject_id: v })}
                      options={subjectOptions}
                      placeholder="Mapel…"
                      searchPlaceholder="Cari mapel…"
                    />
                  </td>
                  <td>
                    <SearchableSelect
                      value={r.room_id}
                      onChange={(v) => updateRow(c.id, { room_id: v })}
                      options={roomOptions}
                      placeholder="Ruang…"
                      searchPlaceholder="Cari ruang…"
                    />
                  </td>
                  <td className="bulk-grid__status">
                    {status === 'complete' && <span className="dot dot--success" title="Lengkap">●</span>}
                    {status === 'partial' && <span className="dot dot--warning" title="Setengah">●</span>}
                    {status === 'empty' && <span className="dot dot--muted" title="Kosong">●</span>}
                  </td>
                  <td className="bulk-grid__action">
                    {r.lesson_id && (
                      <button
                        type="button"
                        className="btn btn--ghost btn--xs"
                        onClick={() => deleteExisting(c.id)}
                        title="Hapus dari database"
                      >
                        <Trash2 size={12} strokeWidth={2.25} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer sticky */}
      <div className="bulk-footer">
        <span className="muted">
          {stats.complete} dari {stats.total} kelas siap disimpan
        </span>
        <button
          type="button"
          className="btn btn--primary"
          onClick={save}
          disabled={busy || stats.complete === 0}
        >
          <Save size={14} strokeWidth={2.25} />
          {busy ? 'Menyimpan…' : `Simpan ${stats.complete} Pelajaran`}
        </button>
      </div>
    </div>
  );

  // Fungsi hapus existing
  async function deleteExisting(classId) {
    const r = rows[classId];
    if (!r?.lesson_id) return;
    if (!confirm('Hapus pelajaran kelas ini dari database?')) return;
    const { error } = await deleteLesson(r.lesson_id);
    if (error) return toast.error(error.message);
    toast.success('Pelajaran dihapus.');
    setRows((prev) => ({
      ...prev,
      [classId]: { ...EMPTY_ROW, lesson_id: null },
    }));
    onSaved();
  }
}