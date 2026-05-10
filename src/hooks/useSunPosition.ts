import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import api from '../services/api';
import { useSelectedTime } from '../contexts/TimeContext';

interface SunPositionResponse {
  position: {
    azimuth: number;
    altitude: number;
  };
  intensity: number;
}

const GHENT_LAT = 51.0543;
const GHENT_LNG = 3.7174;

/**
 * Returns { azimuth, altitude } in radians for Ghent center at selectedTime.
 * Returns null when loading or on error.
 */
export function useSunPosition(): { azimuth: number; altitude: number } | null {
  const { selectedTime } = useSelectedTime();

  const minuteKey = useMemo(() => {
    const d = new Date(selectedTime);
    d.setSeconds(0, 0);
    return d.toISOString();
  }, [selectedTime]);

  const { data } = useQuery<SunPositionResponse>({
    queryKey: ['sun-position', minuteKey],
    queryFn: async () => {
      const { data } = await api.get<SunPositionResponse>(
        `/sun/${GHENT_LAT}/${GHENT_LNG}/${minuteKey}`,
      );
      return data;
    },
    staleTime: 60_000,
    refetchInterval: 300_000,
  });

  return useMemo(() => {
    if (!data) return null;

    return {
      azimuth: data.position.azimuth,
      altitude: data.position.altitude,
    };
  }, [data]);
}
