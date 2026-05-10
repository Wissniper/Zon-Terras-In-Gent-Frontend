import api from './api';
import type { Weather } from '../types';

const GHENT = { lat: 51.05, lng: 3.72 };

export async function fetchWeather(): Promise<Weather> {
  const { data } = await api.get<{ count: number; weather: Weather[] }>(
    '/weather/by-location',
    { params: GHENT }
  );
  // TanStack Query rejects `undefined` as a valid response; throw so the
  // query enters its error state instead of polluting the console with
  // "Query data cannot be undefined".
  if (!data?.weather?.[0]) {
    throw new Error('No weather data available for Ghent');
  }
  return data.weather[0];
}
