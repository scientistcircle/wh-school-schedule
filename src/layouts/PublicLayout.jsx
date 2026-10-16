import { Link, NavLink, Outlet } from 'react-router-dom';
import { CalendarDays, Clock, Megaphone, ShieldCheck } from 'lucide-react';
import { RealtimeProvider } from '../contexts/RealtimeContext.jsx';
import ConnectionIndicator from '../components/ConnectionIndicator.jsx';
import OfflineNotice from '../components/OfflineNotice.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

const navItems = [
  { to: '/', label: 'Jadwal Hari Ini', end: true, Icon: CalendarDays },
  { to: '/sesi/KBM1', label: 'Per Sesi', Icon: Clock },
  { to: '/pengumuman', label: 'Pengumuman', Icon: Megaphone },
];

export default function PublicLayout() {
  return (
    <RealtimeProvider>
      <div className="app-shell">
        <header className="public-header">
          <div className="public-header__inner">
            <Link to="/" className="brand" aria-label="WH School Schedule">
              <span className="brand__mark" aria-hidden="true">
                <svg viewBox="0 0 32 32" width="20" height="20" fill="none">
                  <rect width="32" height="32" rx="8" fill="currentColor" opacity="0.15" />
                  <path d="M9 12h14M9 20h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
              <span className="brand__text">
                <strong className="brand__title">WH SCHOOL SCHEDULE</strong>
                <span className="brand__subtitle">School Timetable &amp; Daily Information</span>
              </span>
            </Link>

            <nav className="public-nav" aria-label="Navigasi utama">
              {navItems.map(({ to, label, end, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    'public-nav__link' + (isActive ? ' is-active' : '')
                  }
                >
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

        <main className="app-main">
          <OfflineNotice />
          <Outlet />
        </main>

        <footer className="app-footer">
          <p>WH School Schedule — waktu ditampilkan dalam zona Asia/Jakarta.</p>
        </footer>
      </div>
    </RealtimeProvider>
  );
}