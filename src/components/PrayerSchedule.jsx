import { useEffect, useState } from 'react';
import { Moon, Sun, CloudSun, Sunrise, Sunset, Clock, AlertCircle } from 'lucide-react';
import { getPrayerTimes } from '../services/prayerService.js';

const PRAYER_ICONS = {
  subuh: <Sunrise size={14} />,
  dzuhur: <Sun size={14} />,
  ashar: <CloudSun size={14} />,
  maghrib: <Sunset size={14} />,
  isya: <Moon size={14} />,
};

export default function PrayerSchedule({ city = 'Jakarta' }) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [nextPrayer, setNextPrayer] = useState('');

  useEffect(() => {
    let alive = true;
    getPrayerTimes(city).then(({ data, error }) => {
      if (!alive) return;
      setState({ loading: false, data, error });
      
      if (data) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const times = [
          { name: 'Subuh', time: data.subuh },
          { name: 'Dzuhur', time: data.dzuhur },
          { name: 'Ashar', time: data.ashar },
          { name: 'Maghrib', time: data.maghrib },
          { name: 'Isya', time: data.isya },
        ];

        for (const t of times) {
          const [h, m] = t.time.split(':').map(Number);
          const prayerTime = h * 60 + m;
          if (prayerTime > currentTime) {
            setNextPrayer(t.name);
            break;
          }
        }
      }
    });
    return () => { alive = false; };
  }, [city]);

  if (state.loading) return <div className="prayer-widget" style={{ textAlign: 'center' }}>Memuat jadwal sholat...</div>;
  
  // JIKA ERROR, TAMPILKAN PESAN INI (Agar kita tahu ada masalah)
  if (state.error || !state.data) {
    return (
      <div className="prayer-widget" style={{ color: 'var(--danger)', textAlign: 'center' }}>
        <AlertCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
        Gagal memuat jadwal sholat. Cek koneksi internet atau matikan AdBlocker.
      </div>
    );
  }

  const { data } = state;

  return (
    <div className="prayer-widget">
      <div className="prayer-widget__header">
        <span className="prayer-widget__title">
          <Clock size={14} /> Jadwal Sholat ({city})
        </span>
        {nextPrayer && (
          <span className="badge badge--imp-normal" style={{ fontSize: '10px' }}>
            Berikutnya: {nextPrayer}
          </span>
        )}
      </div>
      
      <div className="prayer-grid">
        <div className="prayer-item"><span className="prayer-label">{PRAYER_ICONS.subuh} Subuh</span><span className="prayer-time">{data.subuh}</span></div>
        <div className="prayer-item"><span className="prayer-label">{PRAYER_ICONS.dzuhur} Dzuhur</span><span className="prayer-time">{data.dzuhur}</span></div>
        <div className="prayer-item"><span className="prayer-label">{PRAYER_ICONS.ashar} Ashar</span><span className="prayer-time">{data.ashar}</span></div>
        <div className="prayer-item"><span className="prayer-label">{PRAYER_ICONS.maghrib} Maghrib</span><span className="prayer-time">{data.maghrib}</span></div>
        <div className="prayer-item"><span className="prayer-label">{PRAYER_ICONS.isya} Isya</span><span className="prayer-time">{data.isya}</span></div>
      </div>
    </div>
  );
}