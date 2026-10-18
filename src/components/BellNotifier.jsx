import { useEffect, useRef, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useToast } from '../contexts/ToastContext.jsx';

export default function BellNotifier({ periods }) {
  const toast = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const audioRef = useRef(null);
  const notifiedSessions = useRef(new Set());

  // URL Suara Bel (Bisa diganti dengan file lokal /bell.mp3)
const BELL_URL = '/bel.mp3';

  useEffect(() => {
    audioRef.current = new Audio(BELL_URL);
    
    // Cek apakah user sudah pernah mengaktifkan di sesi ini
    if (sessionStorage.getItem('bell_enabled') === 'true') {
      setIsEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!isEnabled || !periods || periods.length === 0) return;

    const checkTime = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      periods.forEach((p) => {
        // Bunyikan bel 1 menit sebelum KBM dimulai & saat KBM selesai
        const startTimeStr = p.start_time.slice(0, 5);
        const endTimeStr = p.end_time.slice(0, 5);

        // Logika Notifikasi Mulai
        if (currentTime === startTimeStr && !notifiedSessions.current.has(`start-${p.id}-${now.toDateString()}`)) {
          playBell(`KBM ${p.period_name} Dimulai!`, `Waktu: ${startTimeStr}`);
          notifiedSessions.current.add(`start-${p.id}-${now.toDateString()}`);
        }

        // Logika Notifikasi Selesai
        if (currentTime === endTimeStr && !notifiedSessions.current.has(`end-${p.id}-${now.toDateString()}`)) {
          playBell(`KBM ${p.period_name} Selesai!`, `Waktu: ${endTimeStr}`);
          notifiedSessions.current.add(`end-${p.id}-${now.toDateString()}`);
        }
      });
    };

    const interval = setInterval(checkTime, 10000); // Cek setiap 10 detik
    return () => clearInterval(interval);
  }, [isEnabled, periods]);

  const playBell = (title, body) => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio blocked', e));
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/logo.png' });
    }
  };

  const toggleBell = async () => {
    if (isEnabled) {
      setIsEnabled(false);
      sessionStorage.setItem('bell_enabled', 'false');
      toast.info('Suara bel dimatikan.');
      return;
    }

    // Minta izin notifikasi
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        toast.warning('Notifikasi diblokir browser. Harap izinkan notifikasi di pengaturan situs.');
      }
    }

    setIsEnabled(true);
    sessionStorage.setItem('bell_enabled', 'true');
    toast.success('Bel dan notifikasi diaktifkan!');
    
    // Putar sekali untuk membuka izin audio browser
    audioRef.current.volume = 0;
    audioRef.current.play().then(() => {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 1;
    }).catch(e => console.log(e));
  };

  return (
    <button 
      type="button" 
      className={`btn ${isEnabled ? 'btn--primary' : 'btn--ghost'} btn-action no-print`} 
      onClick={toggleBell}
      title={isEnabled ? 'Matikan Bel' : 'Aktifkan Bel & Notifikasi'}
    >
      {isEnabled ? <Bell size={16} /> : <BellOff size={16} />}
      <span className="hide-mobile">{isEnabled ? 'Bel Aktif' : 'Aktifkan Bel'}</span>
    </button>
  );
}