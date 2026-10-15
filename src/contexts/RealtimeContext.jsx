import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../services/supabaseClient.js';
import { CONNECTION_STATUS } from '../utils/constants.js';

const RealtimeContext = createContext({
  status: CONNECTION_STATUS.CONNECTING,
  tick: 0,
  lastEventAt: null,
  online: true,
});

// Tabel yang perubahannya memicu refresh halaman publik.
const PUBLIC_TABLES = [
  'school_days',
  'lesson_periods',
  'lessons',
  'daily_activities',
  'duty_teachers',
  'announcements',
];

export function RealtimeProvider({ children }) {
  const [status, setStatus] = useState(CONNECTION_STATUS.CONNECTING);
  const [tick, setTick] = useState(0);
  const [lastEventAt, setLastEventAt] = useState(null);
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const debounceRef = useRef(null);

  useEffect(() => {
    // Nama channel unik agar tidak bentrok antar-tab.
    const channelName = `public-rt-${Math.random().toString(36).slice(2, 10)}`;
    let channel = supabase.channel(channelName);

    for (const table of PUBLIC_TABLES) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          // Banyak event sekaligus → debounce agar hanya refetch sekali.
          clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            setLastEventAt(new Date());
            setTick((t) => t + 1);
          }, 400);
        }
      );
    }

    channel.subscribe((s) => {
      if (s === 'SUBSCRIBED') setStatus(CONNECTION_STATUS.LIVE);
      else if (s === 'CHANNEL_ERROR') setStatus(CONNECTION_STATUS.RECONNECTING);
      else if (s === 'TIMED_OUT') setStatus(CONNECTION_STATUS.RECONNECTING);
      else if (s === 'CLOSED') setStatus(CONNECTION_STATUS.OFFLINE);
    });

    return () => {
      clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  // Deteksi online/offline dari browser.
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // Ketika koneksi pulih, paksa resync dengan menaikkan tick.
  useEffect(() => {
    if (online && status === CONNECTION_STATUS.LIVE) {
      setTick((t) => t + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  const effectiveStatus = !online ? CONNECTION_STATUS.OFFLINE : status;

  const value = useMemo(
    () => ({ status: effectiveStatus, tick, lastEventAt, online }),
    [effectiveStatus, tick, lastEventAt, online]
  );

  return (
    <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}