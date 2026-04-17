import api from './api';
import type { Restaurant } from '../types';
import type { HydraCollection } from './terrasService';

export type HydraRestaurant = Restaurant & { '@id': string; '@type': string };

interface SearchParams {
  q?: string;
  cuisine?: string;
  minIntensity?: number;
  maxIntensity?: number;
  limit?: number;
  skip?: number;
}

export async function searchRestaurants(params: SearchParams = {}): Promise<HydraCollection<Restaurant>> {
  const { data } = await api.get<HydraCollection<Restaurant>>('/search/restaurants', { params });
  return data;
}

export async function getRestaurantById(uuid: string): Promise<HydraRestaurant> {
  const { data } = await api.get<HydraRestaurant>(`/restaurants/${uuid}`);
  return data;
}
