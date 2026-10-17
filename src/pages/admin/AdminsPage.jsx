import { useCallback, useEffect, useState } from 'react';
import { UserPlus, ShieldAlert, Trash2 } from 'lucide-react';
import { 
  fetchAllUsers, 
  createNewAdmin, 
  updateUserRole, 
  deleteAdminUser 
} from '../../services/adminService.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import LoadingState from '../../components/LoadingState.jsx';
import { formatDateShort } from '../../utils/jakartaTime.js';

export default function AdminsPage() {
  const { isSuperAdmin, user: currentUser } = useAuth();
  const toast = useToast();
  
  const [state, setState] = useState({ loading: true, error: null, rows: [] });
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await fetchAllUsers();
    setState({ loading: false, error, rows: data });
  }, []);

  useEffect(() => { 
    if (isSuperAdmin) load(); 
  }, [load, isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="state-block state-block--error">
        <ShieldAlert size={40} />
        <h3 className="state-block__title">Akses Ditolak</h3>
        <p>Hanya Admin Utama yang dapat mengakses halaman ini.</p>
      </div>
    );
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.email || !form.password || !form.name) return toast.error('Lengkapi semua data.');
    if (form.password.length < 6) return toast.error('Password minimal 6 karakter.');

    setBusy(true);
    const { error } = await createNewAdmin(form.email, form.password, form.name);
    setBusy(false);

    if (error) return toast.error(error.message);
    toast.success('Admin baru berhasil ditambahkan.');
    setForm({ name: '', email: '', password: '' });
    load();
  }

  async function handleRoleChange(userId, newRole, userName) {
    if (userId === currentUser.id) return toast.warning('Anda tidak bisa mengubah role Anda sendiri.');
    if (!confirm(`Ubah role ${userName} menjadi ${newRole}?`)) return;

    const { error } = await updateUserRole(userId, newRole);
    if (error) return toast.error(error.message);
    toast.success('Role berhasil diubah.');
    load();
  }

  async function handleDelete(userId, userName) {
    if (userId === currentUser.id) return toast.warning('Anda tidak bisa menghapus akun Anda sendiri.');
    if (!confirm(`PERINGATAN: Hapus akun ${userName} secara permanen? Tindakan ini tidak dapat dibatalkan.`)) return;

    setBusy(true);
    const { error } = await deleteAdminUser(userId);
    setBusy(false);

    if (error) return toast.error(error.message);
    toast.success('Akun berhasil dihapus.');
    load();
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Kelola Admin</h1>
          <p className="muted">Hanya Admin Utama yang bisa menambah, mengubah role, atau menghapus pengguna.</p>
        </div>
      </div>

      <form className="card admin-form" onSubmit={handleCreate}>
        <h2 className="card__title">Tambah Admin Baru</h2>
        <div className="form-grid">
          <label className="field">
            <span>Nama Lengkap</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ustadz Ahmad" required />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ahmad@wh.sch.id" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimal 6 karakter" required />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={busy}>
            <UserPlus size={15} /> {busy ? 'Menyimpan…' : 'Buat Akun Admin'}
          </button>
        </div>
      </form>

      {state.loading && <LoadingState />}
      {!state.loading && state.rows.length > 0 && (
        <div className="card card--flush">
          <div className="table-wrap table-wrap--bare">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama / Email</th>
                  <th>Terdaftar</th>
                  <th>Role Akses</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {state.rows.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.display_name}</strong>
                      <div className="cell-note">{u.email}</div>
                    </td>
                    <td>{formatDateShort(u.created_at)}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value, u.display_name)}
                        disabled={u.id === currentUser.id}
                        style={{ 
                          padding: '6px', 
                          borderRadius: '4px', 
                          background: u.id === currentUser.id ? 'var(--surface-alt)' : 'var(--surface)', 
                          color: 'var(--text)', 
                          border: '1px solid var(--border)' 
                        }}
                      >
                        <option value="viewer">Santri / Viewer</option>
                        <option value="admin">Admin (Jadwal)</option>
                        <option value="super_admin">Admin Utama</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn--danger btn--xs"
                        onClick={() => handleDelete(u.id, u.display_name)}
                        disabled={busy || u.id === currentUser.id}
                        title="Hapus Akun"
                      >
                        <Trash2 size={14} />
                      </button>
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