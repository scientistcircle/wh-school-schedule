import { useNavigate } from 'react-router-dom';
import { addDaysToDateString, todayJakarta, formatDateLong } from '../utils/jakartaTime.js';

// Navigasi tanggal: kemarin / hari ini / besok + input pilih tanggal.
export default function DateNavigator({ dateString, basePath = '/tanggal' }) {
  const navigate = useNavigate();
  const today = todayJakarta();

  const go = (newDate) => {
    if (!newDate) return;
    if (newDate === today && basePath === '/') return;
    const path = basePath === '/' ? `/${newDate}` : `${basePath}/${newDate}`;
    navigate(path);
  };

  return (
    <div className="date-nav">
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => go(addDaysToDateString(dateString, -1))}
        aria-label="Hari sebelumnya"
      >
        ← Sebelumnya
      </button>

      <div className="date-nav__current">
        <strong>{formatDateLong(dateString)}</strong>
        {dateString === today && <span className="date-nav__pill">Hari ini</span>}
      </div>

      <input
        type="date"
        className="date-nav__input"
        value={dateString}
        onChange={(e) => go(e.target.value)}
        aria-label="Pilih tanggal"
      />

      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => go(addDaysToDateString(dateString, 1))}
        aria-label="Hari berikutnya"
      >
        Berikutnya →
      </button>
    </div>
  );
}