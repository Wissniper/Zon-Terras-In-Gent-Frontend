import api from './api';
import type { Event } from '../types';
import type { HydraCollection } from './terrasService';

export type HydraEvent = Event & { '@id': string; '@type': string };

interface SearchParams {
  q?: string;
  date?: string;
  limit?: number;
  skip?: number;
}

export async function searchEvents(params: SearchParams = {}): Promise<HydraCollection<Event>> {
  const { data } = await api.get<HydraCollection<Event>>('/search/events', { params });
  return data;
}

export async function getEventById(uuid: string): Promise<HydraEvent> {
  const { data } = await api.get<HydraEvent>(`/events/${uuid}`);
  return data;
}
