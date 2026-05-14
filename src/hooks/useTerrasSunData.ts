import { useEntityIntensity } from './useEntityIntensity';

/**
 * @deprecated Use `useEntityIntensity('terras', uuid)` directly in new code.
 * Kept as a thin compatibility shim so the legacy call sites stay green.
 */
export function useTerrasSunData(uuid: string | null): {
  intensity: number;
  loading: boolean;
} {
  const { intensity, loading } = useEntityIntensity('terras', uuid);
  return { intensity, loading };
}
