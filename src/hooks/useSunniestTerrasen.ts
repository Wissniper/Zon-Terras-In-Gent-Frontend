import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useTerrasData } from './useTerrasData';
import { fetchSunForTerras } from '../services/sunService';
import { useSelectedTime } from '../contexts/TimeContext';
import type { Terras } from '../types';

const CANDIDATE_POOL = 15;

/**
 * Top-N terraces ranked by sun intensity at the timeline's selectedTime.
 *
 * The backend search endpoint only knows "now" intensity, so we:
 *  1. Pull the top-`CANDIDATE_POOL` by current intensity (good proxy — south-facing
 *     spots tend to stay sunnier than shaded ones across the day).
 *  2. Re-fetch sun-at-selectedTime per candidate via the per-entity endpoint
 *     (which DOES support a `?time=` param and includes shadow + cloud factor).
 *  3. Sort by intensity at selectedTime and slice to N.
 *
 * Cache keys match `useTerrasSunData`, so the selected-entity panel and
 * leaderboard share results for free.
 */
export function useSunniestTerrasen(limit: number = 5): {
  items: { terras: Terras; intensity: number }[];
  isLoading: boolean;
} {
  const { selectedTime } = useSelectedTime();
  const { data: allTerras = [], isLoading: terrasLoading } = useTerrasData();

  // Round to the nearest minute so the live tick (every 30s) doesn't double-fetch.
  const minuteKey = useMemo(() => {
    const d = new Date(selectedTime);
    d.setSeconds(0, 0);
    return d.toISOString();
  }, [selectedTime]);

  const candidates = useMemo(
    () => [...allTerras].sort((a, b) => b.intensity - a.intensity).slice(0, CANDIDATE_POOL),
    [allTerras],
  );

  const sunQueries = useQueries({
    queries: candidates.map((t) => ({
      queryKey: ['sun-terras-shadow', t.uuid, minuteKey],
      queryFn: () => fetchSunForTerras(t.uuid, minuteKey),
      enabled: !!t.uuid,
      staleTime: 60_000,
    })),
  });

  const isLoading = terrasLoading || sunQueries.some((q) => q.isLoading);

  const items = useMemo(() => {
    return candidates
      .map((t, i) => ({
        terras: t,
        // Fall back to backend's "now" intensity if a per-time fetch hasn't resolved yet.
        intensity: sunQueries[i].data?.sunData.intensity ?? t.intensity,
      }))
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates, sunQueries.map((q) => q.data?.sunData.intensity).join(','), limit]);

  return { items, isLoading };
}
