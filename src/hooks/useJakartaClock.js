import { useState, useEffect } from 'react';

export function useJakartaClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      // Format ke HH:MM (24 jam) dengan zona waktu Asia/Jakarta
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      setTime(formatter.format(now));
    }

    updateTime();
    // Perbarui setiap 10 detik (cukup akurat untuk jadwal, hemat resource)
    const interval = setInterval(updateTime, 10000); 
    return () => clearInterval(interval);
  }, []);

  return time; // Contoh output: "08:15"
}