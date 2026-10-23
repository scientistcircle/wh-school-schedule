import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { CalendarDays, Clock, Megaphone, ShieldCheck, Gamepad2 } from 'lucide-react';
import { todayJakarta, formatDateLong } from '../utils/jakartaTime.js';
import { RealtimeProvider } from '../contexts/RealtimeContext.jsx';
import ConnectionIndicator from '../components/ConnectionIndicator.jsx';
import OfflineNotice from '../components/OfflineNotice.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import InstallPWA from '../components/InstallPWA.jsx';

const navItems = [
  { to: '/', label: 'Jadwal Hari Ini', end: true, Icon: CalendarDays },
  { to: '/sesi/KBM1', label: 'Per Sesi', Icon: Clock },
  { to: '/pengumuman', label: 'Pengumuman', Icon: Megaphone },
  { to: '/game', label: 'Game', Icon: Gamepad2 }, 
];

export default function PublicLayout() {
  const today = todayJakarta();
  const location = useLocation();
  
  // Cek apakah sedang berada di halaman game
  const isGameZone = location.pathname.startsWith('/game');

  return (
    <RealtimeProvider>
      <div className="app-shell">
        
        {/* HANYA TAMPILKAN HEADER JIKA BUKAN DI ZONA GAME */}
        {!isGameZone && (
          <header className="public-header">
            <div className="public-header__inner">
              <Link to="/" className="brand" aria-label="WH School Schedule">
                <span className="brand__mark" aria-hidden="true" style={{ overflow: 'hidden', background: 'transparent', padding: 0 }}>
                  <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                </span>
                <span className="brand__text">
                  <strong className="brand__title">WH SCHOOL SCHEDULE</strong>
                  <span className="brand__subtitle">School Timetable &amp; Daily Information</span>
                </span>
              </Link>

              <nav className="public-nav" aria-label="Navigasi utama">
                {navItems.map(({ to, label, end, Icon }) => (
                  <NavLink key={to} to={to} end={end} className={({ isActive }) => 'public-nav__link' + (isActive ? ' is-active' : '')}>
                    <Icon size={15} strokeWidth={2} />
                    <span>{label}</span>
                  </NavLink>
                ))}
                <NavLink to="/admin" className="public-nav__link public-nav__link--muted">
                  <ShieldCheck size={15} strokeWidth={2} />
                  <span>Admin</span>
                </NavLink>
                <ThemeToggle variant="header" />
                <ConnectionIndicator />
              </nav>
            </div>
          </header>
        )}

        <main className="app-main">
          <OfflineNotice />
          <Outlet />
        </main>

        {/* HANYA TAMPILKAN FOOTER JIKA BUKAN DI ZONA GAME */}
        {!isGameZone && (
          <footer className="app-footer">
            <p>WH School Schedule — Dibuat oleh <strong>Riefky Yoan</strong>.</p>
          </footer>
        )}

        <InstallPWA />
      </div>
    </RealtimeProvider>
  );
}