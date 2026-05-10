import api from './api';
import type { Terras } from '../types';

export interface HydraCollection<T> {
  'hydra:totalItems': number;
  'hydra:member': (T & { '@id': string; '@type': string })[];
}

export type HydraTerras = Terras & { '@id': string; '@type': string };

export function uuidFromHydraId(hydraId: string): string {
  return hydraId.split('/').pop() ?? hydraId;
}

interface SearchParams {
  q?: string;
  sunnyOnly?: boolean;
  minIntensity?: number;
  maxIntensity?: number;
  limit?: number;
  skip?: number;
  north?: number;
  south?: number;
  east?: number;
  west?: number;
}

export async function searchTerras(params: SearchParams = {}): Promise<HydraCollection<Terras>> {
  const { data } = await api.get<HydraCollection<Terras>>('/search/terrasen', { params });
  return data;
}

export async function getTerrasById(uuid: string): Promise<HydraTerras> {
  const { data } = await api.get<HydraTerras>(`/terrasen/${uuid}`);
  return data;
}
