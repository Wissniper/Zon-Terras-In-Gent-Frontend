import { useQuery } from '@tanstack/react-query';
import { searchTerras } from '../services/terrasService';
import type { Terras } from '../types';

export function useTerrasData() {
  return useQuery({
    queryKey: ['terrasen'],
    queryFn: async (): Promise<Terras[]> => {
      const data = await searchTerras({ limit: 500 });
      return data['hydra:member'];
    },
  });
}
