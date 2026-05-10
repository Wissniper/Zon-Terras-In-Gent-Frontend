import { useQuery } from '@tanstack/react-query';
import { searchRestaurants } from '../services/restaurantService';
import type { Restaurant } from '../types';

interface Options {
  enabled?: boolean;
}

export function useRestaurantsData(options: Options = {}) {
  const { enabled = true } = options;
  return useQuery({
    queryKey: ['restaurants'],
    queryFn: async (): Promise<Restaurant[]> => {
      const data = await searchRestaurants({ limit: 500 });
      return data['hydra:member'];
    },
    enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
