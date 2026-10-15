import { Link, NavLink, Outlet } from 'react-router-dom';
import { todayJakarta, formatDateLong } from '../utils/jakartaTime.js';
import { RealtimeProvider } from '../contexts/RealtimeContext.jsx';
import ConnectionIndicator from '../components/ConnectionIndicator.jsx';
import OfflineNotice from '../components/OfflineNotice.jsx';

const navItems = [
  { to: '/', label: 'Jadwal Hari Ini', end: true },
  { to: '/sesi/KBM1', label: 'Per Sesi' },
  { to: '/pengumuman', label: 'Pengumuman' },
];

export default function PublicLayout() {
  const today = todayJakarta();

  return (
    <RealtimeProvider>
      <div className="app-shell">
        <header className="public-header">
          <div className="public-header__inner">
            <Link to="/" className="brand" aria-label="WH School Schedule">
              <span className="brand__mark" aria-hidden="true">WH</span>
              <span className="brand__text">
                <strong className="brand__title">WH SCHOOL SCHEDULE</strong>
                <span className="brand__subtitle">
                  School Timetable &amp; Daily Information
                </span>
              </span>
            </Link>

            <nav className="public-nav" aria-label="Navigasi utama">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    'public-nav__link' + (isActive ? ' is-active' : '')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <Link to="/admin" className="public-nav__link public-nav__link--muted">
                Admin
              </Link>
            </nav>
          </div>

          <div className="public-header__meta">
            <span>{formatDateLong(today)}</span>
            <ConnectionIndicator />
          </div>
        </header>

        <main className="app-main">
          <OfflineNotice />
          <Outlet />
        </main>

        <footer className="app-footer">
          <p>
            WH School Schedule — data ditampilkan menurut zona waktu Asia/Jakarta.
          </p>
        </footer>
      </div>
    </RealtimeProvider>
  );
}