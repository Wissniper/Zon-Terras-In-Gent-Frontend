import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchWeather } from '../services/weatherService';
import socket from '../services/socket';
import type { Weather } from '../types';

export const WEATHER_QUERY_KEY = ['weather'] as const;

export function useWeatherData() {
  const queryClient = useQueryClient();

  useEffect(() => {
    function onWeatherUpdate() {
      queryClient.invalidateQueries({ queryKey: WEATHER_QUERY_KEY });
    }
    socket.on('weather_update', onWeatherUpdate);
    return () => {
      socket.off('weather_update', onWeatherUpdate);
    };
  }, [queryClient]);

  return useQuery<Weather, Error>({
    queryKey: WEATHER_QUERY_KEY,
    queryFn: fetchWeather,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  });
}
