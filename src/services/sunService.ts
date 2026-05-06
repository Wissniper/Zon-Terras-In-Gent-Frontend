import api from './api';
import type { SunData } from '../types';

interface SunTerrasResponse {
  sunData: SunData;
  terras: { uuid: string; name: string; address: string; intensity: number };
}
interface SunRestaurantResponse {
  sunData: SunData;
  restaurant: { uuid: string; name: string; address: string; intensity: number };
}
interface SunEventResponse {
  sunData: SunData;
  event: { uuid: string; title: string; address: string; intensity: number };
}

export async function fetchSunForTerras(uuid: string, time?: string): Promise<SunTerrasResponse> {
  const { data } = await api.get<SunTerrasResponse>(`/sun/terras/${uuid}`, {
    params: time ? { time } : undefined,
  });
  return data;
}

export async function fetchSunForRestaurant(uuid: string): Promise<SunRestaurantResponse> {
  const { data } = await api.get<SunRestaurantResponse>(`/sun/restaurant/${uuid}`);
  return data;
}

export async function fetchSunForEvent(uuid: string): Promise<SunEventResponse> {
  const { data } = await api.get<SunEventResponse>(`/sun/event/${uuid}`);
  return data;
}

export async function fetchSunData(locationRef: string, dateTime: string): Promise<SunData> {
  const { data } = await api.get<SunTerrasResponse>(`/sun/terras/${locationRef}`);
  void dateTime;
  return data.sunData;
}
