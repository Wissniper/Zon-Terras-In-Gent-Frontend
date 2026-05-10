import { useQuery } from '@tanstack/react-query';
import { searchEvents } from '../services/eventService';
import type { Event } from '../types';

interface Options {
  enabled?: boolean;
}

export function useEventsData(options: Options = {}) {
  const { enabled = true } = options;
  return useQuery({
    queryKey: ['events'],
    queryFn: async (): Promise<Event[]> => {
      const data = await searchEvents({ limit: 500 });
      return data['hydra:member'];
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}
