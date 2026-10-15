import { useCallback } from 'react';
import { useAsync } from './useAsync.js';
import { getActiveClasses } from '../services/masterService.js';

export function useClasses() {
  const fn = useCallback(() => getActiveClasses(), []);
  return useAsync(fn, []);
}