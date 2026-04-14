import api from './api';
import type { Weather } from '../types';

export async function fetchWeather(): Promise<Weather> {
  const { data } = await api.get<Weather>('/weather');
  return data;
}
