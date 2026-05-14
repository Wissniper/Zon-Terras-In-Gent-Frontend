import { useEntityIntensity } from './useEntityIntensity';

/**
 * @deprecated Use `useEntityIntensity('restaurant', uuid)` directly.
 * Kept as a thin compatibility shim.
 */
export function useRestaurantSunData(uuid: string | null): {
  intensity: number;
  shadowScore: number;
  loading: boolean;
} {
  const { intensity, shadowScore, loading } = useEntityIntensity('restaurant', uuid);
  return { intensity, shadowScore, loading };
}
