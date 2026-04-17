import api from './api';
import type { Weather } from '../types';

const GHENT = { lat: 51.05, lng: 3.72 };

export async function fetchWeather(): Promise<Weather> {
  const { data } = await api.get<{ count: number; weather: Weather[] }>(
    '/weather/by-location',
    { params: GHENT }
  );
  return data.weather[0];
}
