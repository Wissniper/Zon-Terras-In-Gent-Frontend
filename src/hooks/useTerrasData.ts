import { useQuery } from '@tanstack/react-query';
import { searchTerras } from '../services/terrasService';
import type { Terras } from '../types';

interface Options {
  enabled?: boolean;
}

export function useTerrasData(options: Options = {}) {
  const { enabled = true } = options;
  return useQuery({
    queryKey: ['terrasen'],
    queryFn: async (): Promise<Terras[]> => {
      const data = await searchTerras({ limit: 500 });
      return data['hydra:member'];
    },
    enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
