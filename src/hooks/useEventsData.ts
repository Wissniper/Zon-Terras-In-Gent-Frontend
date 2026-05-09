import { useQuery } from '@tanstack/react-query';
import { searchEvents } from '../services/eventService';
import type { Event } from '../types';

export function useEventsData() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async (): Promise<Event[]> => {
      const data = await searchEvents({ limit: 500 });
      return data['hydra:member'];
    },
  });
}
