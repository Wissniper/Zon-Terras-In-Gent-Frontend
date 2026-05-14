import api from './api';
import type { SunData } from '../types';

/**
 * Single source of truth for **per-entity** intensity reads.
 *
 * Every surface that shows a number for one specific terras / restaurant /
 * event — the map popup, the leaderboard slot, the detail page's
 * IntensityRing, the Discover card — calls this function so the four can
 * never disagree on the same (id, time) pair.
 *
 * The backend `/sun/<kind>/:id?time=` endpoint now routes through the same
 * `recomputeIntensities()` primitive that the bulk `/search/<kind>?time=`
 * endpoint uses, so list-vs-detail mismatch is impossible by construction.
 */

export type Kind = 'terras' | 'restaurant' | 'event';

export interface IntensityResult {
  intensity: number;
  shadowScore: number;
  isNight: boolean;
  cloudFactor: number | null;
  sun: Pick<SunData, 'azimuth' | 'altitude' | 'goldenHour'>;
}

interface SunEnvelope {
  sunData: SunData & { isNight?: boolean; cloudFactor?: number | null; shadowScore?: number };
}

const KIND_PATH: Record<Kind, string> = {
  terras: '/sun/terras',
  restaurant: '/sun/restaurant',
  event: '/sun/event',
};

/**
 * Canonical time quantization. Every caller must pass through this so the
 * backend always sees the same minute-key for the same UI tick — otherwise
 * subsequent requests within the same minute would hit different cache
 * buckets and the four surfaces would drift apart again.
 */
export function minuteIsoFrom(selectedTime: string): string {
  const d = new Date(selectedTime);
  d.setSeconds(0, 0);
  return d.toISOString();
}

/**
 * Canonical TanStack Query key. Same prefix + (kind, uuid, time) shape from
 * every caller — so invalidation and cache sharing across components behave.
 */
export function intensityQueryKey(kind: Kind, uuid: string | null, minuteKey: string) {
  return ['entity-intensity', kind, uuid, minuteKey] as const;
}

export async function fetchEntityIntensity(
  kind: Kind,
  uuid: string,
  minuteKey: string,
): Promise<IntensityResult> {
  const { data } = await api.get<SunEnvelope>(`${KIND_PATH[kind]}/${uuid}`, {
    params: { time: minuteKey },
  });
  const s = data.sunData;
  return {
    intensity: s.intensity ?? 0,
    shadowScore: s.shadowScore ?? 1.0,
    isNight: s.isNight ?? false,
    cloudFactor: s.cloudFactor ?? null,
    sun: {
      azimuth: s.azimuth,
      altitude: s.altitude,
      goldenHour: s.goldenHour,
    },
  };
}
