import { useCallback } from 'react';
import { useAsync } from './useAsync.js';
import { getActiveAnnouncements } from '../services/announcementService.js';

export function useAnnouncements(limit = 20) {
  const fn = useCallback(
    () => getActiveAnnouncements(limit),
    [limit]
  );
  return useAsync(fn, [limit]);
}