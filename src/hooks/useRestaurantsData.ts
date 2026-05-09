import { useQuery } from '@tanstack/react-query';
import { searchRestaurants } from '../services/restaurantService';
import type { Restaurant } from '../types';

export function useRestaurantsData() {
  return useQuery({
    queryKey: ['restaurants'],
    queryFn: async (): Promise<Restaurant[]> => {
      const data = await searchRestaurants({ limit: 500 });
      return data['hydra:member'];
    },
  });
}
