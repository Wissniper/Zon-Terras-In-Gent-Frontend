import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchTerras } from '../services/terrasService';
import { useSelectedTime } from '../contexts/TimeContext';
import { minuteIsoFrom } from '../services/intensitySource';
import type { Terras } from '../types';

/**
 * Top-N terraces ranked by sun intensity at the timeline's selectedTime.
 *
 * Backend `/api/search/terrasen?time=` already returns shadow + cloud-aware
 * intensity sorted intensity:-1, so a single search call gives us the
 * leaderboard directly — no per-entity fan-out. Uses `minuteIsoFrom` for
 * canonical time quantization so the keys match every other surface.
 */
export function useSunniestTerrasen(limit: number = 5): {
  items: { terras: Terras; intensity: number }[];
  isLoading: boolean;
} {
  const { selectedTime } = useSelectedTime();
  const minuteKey = useMemo(() => minuteIsoFrom(selectedTime), [selectedTime]);

  const { data, isLoading } = useQuery({
    queryKey: ['sunniest-terrasen', limit, minuteKey],
    queryFn: () => searchTerras({ time: minuteKey, limit }),
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });

  const items = useMemo(() => {
    const members = data?.['hydra:member'] ?? [];
    return members
      .slice(0, limit)
      .map((t) => ({ terras: t as Terras, intensity: t.intensity }));
  }, [data, limit]);

  return { items, isLoading };
}
