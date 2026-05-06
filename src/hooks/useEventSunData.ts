import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchSunForEvent } from '../services/sunService';
import { useSelectedTime } from '../contexts/TimeContext';

export function useEventSunData(uuid: string | null): {
  intensity: number;
  shadowScore: number;
  loading: boolean;
} {
  const { selectedTime } = useSelectedTime();

  const { data, isLoading } = useQuery({
    queryKey: ['sun-event-shadow', uuid, selectedTime],
    queryFn: () => fetchSunForEvent(uuid!, selectedTime),
    enabled: !!uuid,
    staleTime: 60_000,
  });

  return useMemo(() => ({
    intensity: data?.sunData.intensity ?? 0,
    shadowScore: data?.sunData.shadowScore ?? 1.0,
    loading: isLoading,
  }), [data, isLoading]);
}
