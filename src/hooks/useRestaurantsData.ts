import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { Restaurant } from '../types';

interface RestaurantsResponse {
  count: number;
  restaurants: Restaurant[];
}

async function fetchRestaurants(): Promise<Restaurant[]> {
  const { data } = await api.get<RestaurantsResponse>('/restaurants');
  return data.restaurants;
}

export function useRestaurantsData() {
  return useQuery({
    queryKey: ['restaurants'],
    queryFn: fetchRestaurants,
  });
}
