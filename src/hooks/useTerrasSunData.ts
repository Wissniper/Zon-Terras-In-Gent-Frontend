import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchSunForTerras } from '../services/sunService';
import { useSelectedTime } from '../contexts/TimeContext';

export function useTerrasSunData(uuid: string | null): {
  intensity: number;
  loading: boolean;
} {
  const { selectedTime } = useSelectedTime();

  const minuteKey = useMemo(() => {
    const d = new Date(selectedTime);
    d.setSeconds(0, 0);
    return d.toISOString();
  }, [selectedTime]);

  const { data, isLoading } = useQuery({
    queryKey: ['sun-terras-shadow', uuid, minuteKey],
    queryFn: () => fetchSunForTerras(uuid!, minuteKey),
    enabled: !!uuid,
    staleTime: 60_000,
  });

  return useMemo(() => ({
    intensity: data?.sunData.intensity ?? 0,
    loading: isLoading,
  }), [data, isLoading]);
}
