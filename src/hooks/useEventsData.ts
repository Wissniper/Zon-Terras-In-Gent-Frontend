import { useQuery } from '@tanstack/react-query';
import { searchEvents } from '../services/eventService';
import type { Event } from '../types';
import type { ViewportBounds } from './useViewportBounds';

interface Options {
  bounds?: ViewportBounds | null;
  enabled?: boolean;
}

const ROUND = (n: number) => Math.round(n * 1000) / 1000;

export function useEventsData(options: Options = {}) {
  const { bounds, enabled = true } = options;
  const bboxKey = bounds
    ? [ROUND(bounds.north), ROUND(bounds.south), ROUND(bounds.east), ROUND(bounds.west)]
    : null;

  return useQuery({
    queryKey: ['events', bboxKey],
    queryFn: async (): Promise<Event[]> => {
      const data = await searchEvents({
        limit: 500,
        ...(bounds ?? {}),
      });
      return data['hydra:member'];
    },
    enabled,
    staleTime: 30_000,
  });
}
