import { useEffect, useRef } from 'react';
import { useRealtime } from '../contexts/RealtimeContext.jsx';

// Panggil `refetch` saat ada event realtime masuk.
// Event pertama (mount) dilewati agar tidak double-fetch.
export function useAutoRefresh(refetch) {
  const { tick } = useRealtime();
  const first = useRef(true);
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    refetchRef.current?.();
  }, [tick]);
}