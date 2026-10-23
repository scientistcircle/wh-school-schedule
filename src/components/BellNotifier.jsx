import { useEffect, useRef, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useToast } from '../contexts/ToastContext.jsx';

export default function BellNotifier({ periods }) {
  const toast = useToast();
  
  // Default-nya kita set TRUE agar otomatis aktif
  const [isEnabled, setIsEnabled] = useState(true); 
  const audioRef = useRef(null);
  const notifiedSessions = useRef(new Set());

  const BELL_URL = '/bel.mp3';

  // Effect 1: Persiapkan audio & Buka Blokir Autoplay Browser
  useEffect(() => {
    audioRef.current = new Audio(BELL_URL);
    audioRef.current.volume = 1;

    // Fungsi untuk membuka izin audio browser saat user klik di mana saja
    const unlockAudio = () => {
      if (audioRef.current) {
        // Mainkan audio dengan volume 0 (tidak terdengar), lalu langsung jeda
        audioRef.current.volume = 0;
        audioRef.current.play().then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.volume = 1; // Kembalikan volume
        }).catch(e => console.log('Audio unlock failed', e));
      }
      // Hapus event listener agar tidak berjalan berulang kali
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    // Pasang listener di seluruh dokumen
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Effect 2: Logika Pengecekan Waktu Bel
  useEffect(() => {
    if (!isEnabled || !periods || periods.length === 0) return;

    const checkTime = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      periods.forEach((p) => {
        const startTimeStr = p.start_time.slice(0, 5);
        const endTimeStr = p.end_time.slice(0, 5);

        // Notifikasi Mulai
        if (currentTime === startTimeStr && !notifiedSessions.current.has(`start-${p.id}-${now.toDateString()}`)) {
          playBell(`KBM ${p.period_name} Dimulai!`, `Waktu: ${startTimeStr}`);
          notifiedSessions.current.add(`start-${p.id}-${now.toDateString()}`);
        }

        // Notifikasi Selesai
        if (currentTime === endTimeStr && !notifiedSessions.current.has(`end-${p.id}-${now.toDateString()}`)) {
          playBell(`KBM ${p.period_name} Selesai!`, `Waktu: ${endTimeStr}`);
          notifiedSessions.current.add(`end-${p.id}-${now.toDateString()}`);
        }
      });
    };

    const interval = setInterval(checkTime, 10000); 
    return () => clearInterval(interval);
  }, [isEnabled, periods]);

  const playBell = (title, body) => {
    if (audioRef.current) {
      // Mainkan suara
      audioRef.current.play().catch(e => {
        console.log('Audio masih diblokir browser. Harap klik layar sekali.', e);
      });
    }
    // Tampilkan notifikasi desktop
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/logo.png' });
    }
  };

  const toggleBell = async () => {
    if (isEnabled) {
      setIsEnabled(false);
      toast.info('Suara bel dimatikan.');
      return;
    }

    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }

    setIsEnabled(true);
    toast.success('Bel dan notifikasi diaktifkan!');
    
    // Pancing izin audio saat tombol diklik
    if (audioRef.current) {
      audioRef.current.volume = 0;
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 1;
      }).catch(e => console.log(e));
    }
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