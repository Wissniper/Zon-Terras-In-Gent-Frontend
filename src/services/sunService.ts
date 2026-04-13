import api from './api';
import type { SunData } from '../types';

export async function fetchSunData(locationRef: string, dateTime: string): Promise<SunData> {
  const { data } = await api.get<SunData>('/sun', {
    params: { locationRef, dateTime },
  });
  return data;
}
