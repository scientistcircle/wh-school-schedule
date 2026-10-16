import { useCallback, useEffect, useState } from 'react';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Calendar as CalendarIcon,
} from 'lucide-react';
import {
  listAllAnnouncements, createAnnouncement, updateAnnouncement,
  deleteAnnouncement, toggleAnnouncementPublish,
} from '../../services/announcementService.js';
import { todayJakarta, formatDateShort } from '../../utils/jakartaTime.js';
import { IMPORTANCE_LEVELS, IMPORTANCE_LABEL } from '../../utils/constants.js';
import { ImportanceBadge } from '../../components/StatusBadge.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

const EMPTY = {
  title: '',
  content: '',
  importance: 'normal',
  start_date: todayJakarta(),
  end_date: todayJakarta(),
  is_published: false,
};

export default function AnnouncementsAdminPage() {
  const toast = useToast();
  const [state, setState] = useState({ loading: true, error: null, rows: [] });
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'published' | 'draft'

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await listAllAnnouncements();
    setState({ loading: false, error, rows: data });
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = state.rows.filter((r) => {
    if (filter === 'published') return r.is_published;
    if (filter === 'draft') return !r.is_published;
    return true;
  });

  const stats = {
    total: state.rows.length,
    published: state.rows.filter((r) => r.is_published).length,
    draft: state.rows.filter((r) => !r.is_published).length,
  };

  function openNew() {
    setForm({ ...EMPTY, start_date: todayJakarta(), end_date: todayJakarta() });
    setEditingId(null);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openEdit(row) {
    setForm({
      title: row.title,
      content: row.content,
      importance: row.importance,
      start_date: row.start_date,
      end_date: row.end_date,
      is_published: row.is_published,
    });
    setEditingId(row.id);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Judul wajib diisi.');
    if (!form.content.trim()) return toast.error('Isi pengumuman wajib diisi.');
    if (form.end_date < form.start_date) return toast.error('Tanggal selesai harus setelah tanggal mulai.');

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      importance: form.importance,
      start_date: form.start_date,
      end_date: form.end_date,
      is_published: form.is_published,
    };

    setBusy(true);
    const res = editingId
      ? await updateAnnouncement(editingId, payload)
      : await createAnnouncement(payload);
    setBusy(false);

    if (res.error) return toast.error(res.error.message);
    toast.success(editingId ? 'Pengumuman diperbarui.' : 'Pengumuman dibuat.');
    closeForm();
    load();
  }

  async function hapus(row) {
    if (!confirm(`Hapus pengumuman "${row.title}"?`)) return;
    const { error } = await deleteAnnouncement(row.id);
    if (error) return toast.error(error.message);
    toast.success('Pengumuman dihapus.');
    load();
  }

  async function togglePublish(row) {
    const { error } = await toggleAnnouncementPublish(row.id, !row.is_published);
    if (error) return toast.error(error.message);
    toast.success(row.is_published ? 'Pengumuman ditarik.' : 'Pengumuman dipublikasikan.');
    load();
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Pengumuman</h1>
          <p className="muted">Kelola pengumuman yang tampil ke santri.</p>
        </div>
        <div className="page-header__counts">
          <span className="stat-pill"><strong>{stats.total}</strong> total</span>
          <span className="stat-pill stat-pill--success"><strong>{stats.published}</strong> terbit</span>
          <span className="stat-pill stat-pill--warning"><strong>{stats.draft}</strong> draft</span>
        </div>
      </div>

      {formOpen && (
        <form className="card admin-form" onSubmit={submit}>
          <div className="card__header">
            <h2 className="card__title">
              {editingId ? 'Edit Pengumuman' : 'Pengumuman Baru'}
            </h2>
            <button type="button" className="btn btn--ghost btn--xs" onClick={closeForm}>
              Tutup
            </button>
          </div>

          <div className="form-grid">
            <label className="field field--wide">
              <span>Judul</span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Contoh: Perubahan ruang KBM 1 kelas X1"
                required
              />
            </label>

            <label className="field field--wide">
              <span>Isi Pengumuman</span>
              <textarea
                rows={4}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Tulis detail pengumuman…"
                required
              />
            </label>

            <label className="field">
              <span>Tingkat Kepentingan</span>
              <select
                value={form.importance}
                onChange={(e) => setForm({ ...form, importance: e.target.value })}
              >
                {IMPORTANCE_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{IMPORTANCE_LABEL[lvl]}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Mulai Berlaku</span>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                required
              />
            </label>

            <label className="field">
              <span>Selesai Berlaku</span>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                required
              />
            </label>

            <label className="field field--check">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              />
              <span>Langsung publikasikan</span>
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn--primary" disabled={busy}>
              {busy ? 'Menyimpan…' : editingId ? 'Simpan Perubahan' : 'Buat Pengumuman'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={closeForm} disabled={busy}>
              Batal
            </button>
          </div>
        </form>
      )}

      {!formOpen && (
        <div className="toolbar">
          <div className="toolbar__filters">
            <button
              type="button"
              className={'chip-filter' + (filter === 'all' ? ' is-active' : '')}
              onClick={() => setFilter('all')}
            >
              Semua
            </button>
            <button
              type="button"
              className={'chip-filter' + (filter === 'published' ? ' is-active' : '')}
              onClick={() => setFilter('published')}
            >
              Terbit
            </button>
            <button
              type="button"
              className={'chip-filter' + (filter === 'draft' ? ' is-active' : '')}
              onClick={() => setFilter('draft')}
            >
              Draft
            </button>
          </div>
          <button type="button" className="btn btn--primary" onClick={openNew}>
            <Plus size={15} strokeWidth={2.25} />
            <span>Pengumuman Baru</span>
          </button>
        </div>
      )}

      {state.loading && <LoadingState message="Memuat pengumuman…" />}
      {state.error && <ErrorState description={state.error.message} onRetry={load} />}
      {!state.loading && !state.error && filtered.length === 0 && (
        <EmptyState
          title={filter === 'all' ? 'Belum ada pengumuman' : 'Tidak ada di filter ini'}
          description={filter === 'all' ? 'Buat pengumuman pertama dengan tombol di atas.' : undefined}
        />
      )}

      {filtered.length > 0 && (
        <div className="announce-admin">
          {filtered.map((a) => (
            <article key={a.id} className="announce-admin__card">
              <div className="announce-admin__head">
                <div className="announce-admin__title-row">
                  <h3 className="announce-admin__title">{a.title}</h3>
                  <ImportanceBadge level={a.importance} />
                </div>
                <span className={'badge badge--status-' + (a.is_published ? 'published' : 'draft')}>
                  {a.is_published ? 'Terbit' : 'Draft'}
                </span>
              </div>

              <p className="announce-admin__content">{a.content}</p>

              <div className="announce-admin__meta">
                <CalendarIcon size={13} strokeWidth={2.25} />
                <span>
                  {formatDateShort(a.start_date)} – {formatDateShort(a.end_date)}
                </span>
              </div>

              <div className="announce-admin__actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--xs"
                  onClick={() => togglePublish(a)}
                >
                  {a.is_published ? (
                    <>
                      <EyeOff size={13} strokeWidth={2.25} />
                      <span>Tarik</span>
                    </>
                  ) : (
                    <>
                      <Eye size={13} strokeWidth={2.25} />
                      <span>Terbitkan</span>
                    </>
                  )}
                </button>
                <button type="button" className="btn btn--ghost btn--xs" onClick={() => openEdit(a)}>
                  <Pencil size={13} strokeWidth={2.25} />
                  <span>Edit</span>
                </button>
                <button type="button" className="btn btn--danger btn--xs" onClick={() => hapus(a)}>
                  <Trash2 size={13} strokeWidth={2.25} />
                  <span>Hapus</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}