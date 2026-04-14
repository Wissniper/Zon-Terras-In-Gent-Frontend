import { useQuery } from '@tanstack/react-query';
import { fetchSunData } from '../services/sunService';
import type { SunData } from '../types';

export function useSunData(locationRef: string, dateTime?: string) {
  return useQuery<SunData, Error>({
    queryKey: ['sunData', locationRef, dateTime ?? 'now'],
    queryFn: () => fetchSunData(locationRef, dateTime ?? new Date().toISOString()),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
    enabled: Boolean(locationRef),
  });
}
