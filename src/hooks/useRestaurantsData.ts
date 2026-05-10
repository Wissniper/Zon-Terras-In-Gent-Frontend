import { useQuery } from '@tanstack/react-query';
import { searchRestaurants } from '../services/restaurantService';
import type { Restaurant } from '../types';
import type { ViewportBounds } from './useViewportBounds';

interface Options {
  bounds?: ViewportBounds | null;
  enabled?: boolean;
}

const ROUND = (n: number) => Math.round(n * 1000) / 1000;

export function useRestaurantsData(options: Options = {}) {
  const { bounds, enabled = true } = options;
  const bboxKey = bounds
    ? [ROUND(bounds.north), ROUND(bounds.south), ROUND(bounds.east), ROUND(bounds.west)]
    : null;

  return useQuery({
    queryKey: ['restaurants', bboxKey],
    queryFn: async (): Promise<Restaurant[]> => {
      const data = await searchRestaurants({
        limit: 500,
        ...(bounds ?? {}),
      });
      return data['hydra:member'];
    },
    enabled,
    staleTime: 30_000,
  });
}
