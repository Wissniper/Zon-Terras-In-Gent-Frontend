import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchTerras } from '../services/terrasService';
import { useSelectedTime } from '../contexts/TimeContext';
import { minuteIsoFrom } from '../services/intensitySource';
import type { Terras } from '../types';

interface Options {
  enabled?: boolean;
}

/**
 * Bulk terras list used by the map marker layer. Passes `time=` from the
 * shared TimeContext so marker colors track the timeline scrubber and match
 * what the per-entity hooks return for the same minute.
 */
export function useTerrasData(options: Options = {}) {
  const { enabled = true } = options;
  const { selectedTime } = useSelectedTime();
  const minuteKey = useMemo(() => minuteIsoFrom(selectedTime), [selectedTime]);

  return useQuery({
    queryKey: ['terrasen', minuteKey],
    queryFn: async (): Promise<Terras[]> => {
      const data = await searchTerras({ limit: 500, time: minuteKey });
      return data['hydra:member'];
    },
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
