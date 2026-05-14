import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelectedTime } from '../contexts/TimeContext';
import {
  fetchEntityIntensity,
  intensityQueryKey,
  minuteIsoFrom,
  type IntensityResult,
  type Kind,
} from '../services/intensitySource';

/**
 * Canonical per-entity intensity hook. All four surfaces — map popup,
 * leaderboard, detail page, Discover card — must go through this hook so
 * they never disagree on the same (id, time) pair.
 *
 * Delegates to `fetchEntityIntensity` for the actual network call and
 * `minuteIsoFrom` for time quantization, so the legacy
 * `useTerrasSunData / useRestaurantSunData / useEventSunData` hooks can
 * route through it without behavioural drift.
 */
export function useEntityIntensity(kind: Kind, uuid: string | null): {
  intensity: number;
  shadowScore: number;
  isNight: boolean;
  loading: boolean;
  data: IntensityResult | undefined;
} {
  const { selectedTime } = useSelectedTime();
  const minuteKey = useMemo(() => minuteIsoFrom(selectedTime), [selectedTime]);

  const { data, isLoading } = useQuery({
    queryKey: intensityQueryKey(kind, uuid, minuteKey),
    queryFn: () => fetchEntityIntensity(kind, uuid!, minuteKey),
    enabled: !!uuid,
    staleTime: 60_000,
  });

  return useMemo(() => ({
    intensity: data?.intensity ?? 0,
    shadowScore: data?.shadowScore ?? 1.0,
    isNight: data?.isNight ?? false,
    loading: isLoading,
    data,
  }), [data, isLoading]);
}
