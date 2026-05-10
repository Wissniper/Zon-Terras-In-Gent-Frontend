import { useQuery } from '@tanstack/react-query';
import { searchTerras } from '../services/terrasService';
import type { Terras } from '../types';
import type { ViewportBounds } from './useViewportBounds';

interface Options {
  bounds?: ViewportBounds | null;
  enabled?: boolean;
}

const ROUND = (n: number) => Math.round(n * 1000) / 1000;

export function useTerrasData(options: Options = {}) {
  const { bounds, enabled = true } = options;
  const bboxKey = bounds
    ? [ROUND(bounds.north), ROUND(bounds.south), ROUND(bounds.east), ROUND(bounds.west)]
    : null;

  return useQuery({
    queryKey: ['terrasen', bboxKey],
    queryFn: async (): Promise<Terras[]> => {
      const data = await searchTerras({
        limit: 500,
        ...(bounds ?? {}),
      });
      return data['hydra:member'];
    },
    enabled,
    staleTime: 30_000,
  });
}
