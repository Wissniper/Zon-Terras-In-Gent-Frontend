import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { Terras } from '../types';

interface TerrasResponse {
  count: number;
  terrasen: Terras[];
}

async function fetchTerrasen(): Promise<Terras[]> {
  const { data } = await api.get<TerrasResponse>('/terrasen');
  return data.terrasen;
}

export function useTerrasData() {
  return useQuery({
    queryKey: ['terrasen'],
    queryFn: fetchTerrasen,
  });
}
