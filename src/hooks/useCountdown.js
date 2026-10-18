import { useState, useEffect } from 'react';

export function useCountdown(endTimeStr) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!endTimeStr) return;

    const calculateTime = () => {
      const now = new Date();
      const [hours, minutes] = endTimeStr.split(':');
      const targetDate = new Date();
      targetDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      const diff = targetDate - now;
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isFinished: true });
        return;
      }

      setTimeLeft({
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isFinished: false
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endTimeStr]);

  return timeLeft;
}