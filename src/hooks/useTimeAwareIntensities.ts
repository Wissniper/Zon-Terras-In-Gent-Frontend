import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { fetchSunForTerras, fetchSunForRestaurant, fetchSunForEvent } from '../services/sunService';
import { useSelectedTime } from '../contexts/TimeContext';

type Kind = 'terras' | 'restaurant' | 'event';

interface Entity { uuid: string; intensity?: number }

/**
 * Same data path that powers the map's "Sunniest at HH:MM" leaderboard:
 * for each entity we hit `/api/sun/<kind>/:uuid?time=` and read the
 * time-aware intensity. The query keys match `useTerrasSunData` and
 * `useSunniestTerrasen`, so a card on Discover and the same entity on the
 * map share results from the same cache.
 *
 * Returns a Map<uuid, intensity> the caller merges into its rendered list.
 */
export function useTimeAwareIntensities(
  entities: Entity[],
  kind: Kind,
): { byUuid: Map<string, number>; isLoading: boolean } {
  const { selectedTime } = useSelectedTime();

  // Round to the minute so the live tick doesn't double-fetch.
  const minuteKey = useMemo(() => {
    const d = new Date(selectedTime);
    d.setSeconds(0, 0);
    return d.toISOString();
  }, [selectedTime]);

  const queries = useQueries({
    queries: entities.map((e) => ({
      queryKey: [`sun-${kind}-shadow`, e.uuid, minuteKey],
      queryFn: () => {
        if (kind === 'terras') return fetchSunForTerras(e.uuid, minuteKey);
        if (kind === 'restaurant') return fetchSunForRestaurant(e.uuid, minuteKey);
        return fetchSunForEvent(e.uuid, minuteKey);
      },
      enabled: !!e.uuid,
      staleTime: 60_000,
    })),
  });

  const byUuid = useMemo(() => {
    const m = new Map<string, number>();
    entities.forEach((e, i) => {
      const v = queries[i]?.data?.sunData?.intensity;
      if (typeof v === 'number') m.set(e.uuid, v);
    });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entities, queries.map((q) => q.data?.sunData?.intensity).join(',')]);

  const isLoading = queries.some((q) => q.isLoading);
  return { byUuid, isLoading };
}
