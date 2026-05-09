import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchSunForTerras } from '../services/sunService';
import { useSelectedTime } from '../contexts/TimeContext';

export function useTerrasSunData(uuid: string | null): {
  intensity: number;
  shadowScore: number;
  shadowPct: number;
  isNight: boolean;
  loading: boolean;
} {
  const { selectedTime } = useSelectedTime();

  const { data, isLoading } = useQuery({
    queryKey: ['sun-terras-shadow', uuid, selectedTime],
    queryFn: () => fetchSunForTerras(uuid!, selectedTime),
    enabled: !!uuid,
    staleTime: 60_000,
  });

  return useMemo(() => {
    const shadowScore = data?.sunData.shadowScore ?? 1.0;
    const altitude = data?.sunData.altitude ?? -1;
    const isNight = altitude <= 0;
    const shadowPct = isNight ? 100 : Math.round((1 - shadowScore) * 100);
    return {
      intensity: data?.sunData.intensity ?? 0,
      shadowScore,
      shadowPct,
      isNight,
      loading: isLoading,
    };
  }, [data, isLoading]);
}
