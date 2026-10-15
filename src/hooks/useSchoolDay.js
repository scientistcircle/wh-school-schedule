import { useCallback } from 'react';
import { useAsync } from './useAsync.js';
import { getFullSchoolDay } from '../services/scheduleService.js';

export function useSchoolDay(dateString) {
  const fn = useCallback(
    () => getFullSchoolDay(dateString),
    [dateString]
  );

  return useAsync(fn, [dateString], { skip: !dateString });
}