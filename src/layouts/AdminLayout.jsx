import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

const adminNav = [
  { to: '/admin', label: 'Ringkasan', end: true, icon: '▦' },
  { to: '/admin/agenda', label: 'Agenda Harian', icon: '🕒' },
  { to: '/admin/piket', label: 'Guru Piket', icon: '👥' },
  { to: '/admin/jadwal', label: 'Jadwal KBM', icon: '📚' },
  { to: '/admin/kelas', label: 'Data Kelas', icon: '🏫' },
  { to: '/admin/master', label: 'Guru / Mapel / Ruang', icon: '🗂️' },
  { to: '/admin/pengumuman', label: 'Pengumuman', icon: '📢' },
  { to: '/admin/riwayat', label: 'Riwayat Perubahan', icon: '🧾' },
  { to: '/admin/pengaturan', label: 'Pengaturan', icon: '⚙️' },
];

export default function AdminLayout() {
  const { profile, user, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    const { error } = await signOut();
    if (error) {
      toast.error(`Gagal keluar: ${error.message}`);
      return;
    }
    toast.success('Berhasil keluar.');
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className={`admin-shell ${open ? 'is-sidebar-open' : ''}`}>
      <aside className="admin-sidebar" aria-label="Navigasi admin">
        <div className="admin-sidebar__brand">
          <span className="brand__mark" aria-hidden="true">WH</span>
          <div>
            <strong>WH Schedule</strong>
            <span className="admin-sidebar__role">Panel Admin</span>
          </div>
        </div>

        <nav className="admin-nav">
          {adminNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                'admin-nav__link' + (isActive ? ' is-active' : '')
              }
              onClick={() => setOpen(false)}
            >
              <span className="admin-nav__icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-user">
            <strong>{profile?.display_name ?? 'Admin'}</strong>
            <span>{user?.email}</span>
          </div>
          <button type="button" className="btn btn--ghost" onClick={handleSignOut}>
            Keluar
          </button>
        </div>
      </aside>

      <div className="admin-content">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-topbar__menu"
            onClick={() => setOpen((v) => !v)}
            aria-label="Buka navigasi admin"
            aria-expanded={open}
          >
            ☰
          </button>
          <span className="admin-topbar__title">Panel Administrasi</span>
          <NavLink to="/" className="btn btn--ghost">Lihat Situs</NavLink>
        </header>

        <section className="admin-page">
          <Outlet />
        </section>
      </div>

      {open && (
        <button
          type="button"
          className="admin-scrim"
          aria-label="Tutup navigasi"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}