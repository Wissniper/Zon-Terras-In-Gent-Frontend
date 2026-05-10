import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelectedTime } from '../contexts/TimeContext';

const GHENT_LAT = 51.0543;
const GHENT_LNG = 3.7174;

interface HourlyResponse {
  hourly: {
    time: string[];                // ISO-like "2026-05-10T14:00"
    temperature_2m: number[];
    wind_speed_10m: number[];
    cloud_cover: number[];
  };
}

export interface WeatherAtTime {
  temperature: number;
  windspeed: number;
  cloudCover: number;
  hourIso: string; // the hour bucket actually used
}

/**
 * Returns weather (temp/wind/cloud) for the timeline's selectedTime hour.
 *
 * The project's backend only proxies *current* weather, so we hit Open-Meteo's
 * hourly forecast directly — it's free, CORS-enabled, and returns ~7 days of
 * hourly data which covers the SunTimeline's 48h horizon comfortably.
 */
export function useWeatherAtTime(): {
  data: WeatherAtTime | null;
  isLoading: boolean;
} {
  const { selectedTime } = useSelectedTime();

  const { data: hourly, isLoading } = useQuery<HourlyResponse>({
    queryKey: ['open-meteo-hourly', GHENT_LAT, GHENT_LNG],
    queryFn: async () => {
      const url =
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${GHENT_LAT}&longitude=${GHENT_LNG}` +
        `&hourly=temperature_2m,wind_speed_10m,cloud_cover` +
        `&timezone=auto&past_days=1&forecast_days=7`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
      return res.json();
    },
    staleTime: 30 * 60_000,    // hourly forecast is stable enough
    refetchInterval: 30 * 60_000,
  });

  const data = useMemo<WeatherAtTime | null>(() => {
    if (!hourly?.hourly) return null;

    // Find the hour bucket nearest to selectedTime.
    const target = new Date(selectedTime).getTime();
    let bestIdx = 0;
    let bestDelta = Infinity;
    for (let i = 0; i < hourly.hourly.time.length; i++) {
      // Open-Meteo returns local time without offset (e.g. "2026-05-10T14:00").
      // Treat as local — Date constructor parses without 'Z' as local time.
      const t = new Date(hourly.hourly.time[i]).getTime();
      const delta = Math.abs(t - target);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestIdx = i;
      }
    }

    return {
      temperature: hourly.hourly.temperature_2m[bestIdx],
      windspeed: hourly.hourly.wind_speed_10m[bestIdx],
      cloudCover: hourly.hourly.cloud_cover[bestIdx],
      hourIso: hourly.hourly.time[bestIdx],
    };
  }, [hourly, selectedTime]);

  return { data, isLoading };
}
