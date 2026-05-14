import { useEntityIntensity } from './useEntityIntensity';

/**
 * @deprecated Use `useEntityIntensity('event', uuid)` directly.
 * Kept as a thin compatibility shim.
 */
export function useEventSunData(uuid: string | null): {
  intensity: number;
  shadowScore: number;
  loading: boolean;
} {
  const { intensity, shadowScore, loading } = useEntityIntensity('event', uuid);
  return { intensity, shadowScore, loading };
}
