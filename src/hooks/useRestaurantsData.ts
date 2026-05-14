import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchRestaurants } from '../services/restaurantService';
import { useSelectedTime } from '../contexts/TimeContext';
import { minuteIsoFrom } from '../services/intensitySource';
import type { Restaurant } from '../types';

interface Options {
  enabled?: boolean;
}

/**
 * Bulk restaurant list used by the map marker layer. Same time-awareness
 * contract as useTerrasData — markers stay in sync with the timeline scrub.
 */
export function useRestaurantsData(options: Options = {}) {
  const { enabled = true } = options;
  const { selectedTime } = useSelectedTime();
  const minuteKey = useMemo(() => minuteIsoFrom(selectedTime), [selectedTime]);

  return useQuery({
    queryKey: ['restaurants', minuteKey],
    queryFn: async (): Promise<Restaurant[]> => {
      const data = await searchRestaurants({ limit: 500, time: minuteKey });
      return data['hydra:member'];
    },
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
