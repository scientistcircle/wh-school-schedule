import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarClock, Users, BookOpen, GraduationCap,
  Layers, Megaphone, History, Settings, LogOut, Menu, ExternalLink,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

const adminNav = [
  { to: '/admin', label: 'Ringkasan', end: true, Icon: LayoutDashboard },
  { to: '/admin/agenda', label: 'Agenda Harian', Icon: CalendarClock },
  { to: '/admin/piket', label: 'Guru Piket', Icon: Users },
  { to: '/admin/jadwal', label: 'Jadwal KBM', Icon: BookOpen },
  { to: '/admin/kelas', label: 'Data Kelas', Icon: GraduationCap },
  { to: '/admin/master', label: 'Guru / Mapel / Ruang', Icon: Layers },
  { to: '/admin/pengumuman', label: 'Pengumuman', Icon: Megaphone },
  { to: '/admin/riwayat', label: 'Riwayat Perubahan', Icon: History },
  { to: '/admin/pengaturan', label: 'Pengaturan', Icon: Settings },
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
          <span className="admin-sidebar__mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="22" height="22" fill="none">
              <rect width="32" height="32" rx="8" fill="currentColor" opacity="0.18" />
              <path d="M9 12h14M9 20h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </span>
          <div className="admin-sidebar__brand-text">
            <strong>WH Schedule</strong>
            <span className="admin-sidebar__role">Panel Admin</span>
          </div>
        </div>

        <nav className="admin-nav">
          {adminNav.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                'admin-nav__link' + (isActive ? ' is-active' : '')
              }
              onClick={() => setOpen(false)}
            >
              <Icon size={17} strokeWidth={2} className="admin-nav__icon" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-user">
            <div className="admin-user__avatar" aria-hidden="true">
              {(profile?.display_name ?? 'A').charAt(0).toUpperCase()}
            </div>
            <div className="admin-user__text">
              <strong>{profile?.display_name ?? 'Admin'}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <button type="button" className="btn btn--ghost btn--block" onClick={handleSignOut}>
            <LogOut size={15} strokeWidth={2} />
            <span>Keluar</span>
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
            <Menu size={18} strokeWidth={2} />
          </button>
          <span className="admin-topbar__title">Panel Administrasi</span>
          <div className="admin-topbar__actions">
            <ThemeToggle />
            <NavLink to="/" className="btn btn--ghost" target="_blank" rel="noreferrer">
              <ExternalLink size={14} strokeWidth={2} />
              <span>Lihat Situs</span>
            </NavLink>
          </div>
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