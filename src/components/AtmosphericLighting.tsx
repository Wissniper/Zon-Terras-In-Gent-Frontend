import { useEffect, useRef } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';
import type { Map as MapboxMap } from 'mapbox-gl';

interface SunPosition {
  azimuth: number;
  altitude: number;
}

interface Props {
  mapRef: React.RefObject<MapRef | null>;
  sunPosition: SunPosition | null;
  mapLoaded: boolean;
  enableShadows?: boolean;
  /** When true, defer the first lighting computation until the map fires `idle`. */
  deferUntilIdle?: boolean;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

function lerpColor(a: string, b: string, t: number): string {
  const ai = parseInt(a.slice(1), 16);
  const bi = parseInt(b.slice(1), 16);
  const ar = (ai >> 16) & 0xff, ag = (ai >> 8) & 0xff, ab = ai & 0xff;
  const br = (bi >> 16) & 0xff, bg = (bi >> 8) & 0xff, bb = bi & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return '#' + ((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0');
}

const NIGHT_BLUE = '#0a1530';
const WARM_WHITE = '#fff5e0';
const GOLDEN     = '#f5ac32';
const SUN_WHITE  = '#ffffff';

function pickLightPreset(altitudeDeg: number, azimuthDeg: number): 'dawn' | 'day' | 'dusk' | 'night' {
  if (altitudeDeg <= -6) return 'night';
  if (altitudeDeg >= 6)  return 'day';
  return azimuthDeg < 180 ? 'dawn' : 'dusk';
}

export default function AtmosphericLighting({
  mapRef, sunPosition, mapLoaded, enableShadows = true, deferUntilIdle = true,
}: Props) {
  const lastPreset = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const firstApplyDone = useRef(false);

  useEffect(() => {
    if (!mapLoaded || !sunPosition || !mapRef.current) return;
    const map = mapRef.current.getMap() as MapboxMap;
    const sun = sunPosition; // capture for narrowed reads inside `apply`

    const schedule = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(apply);
    };

    let detachIdle: (() => void) | null = null;
    if (deferUntilIdle && !firstApplyDone.current) {
      const onIdle = () => {
        firstApplyDone.current = true;
        schedule();
      };
      map.once('idle', onIdle);
      detachIdle = () => map.off('idle', onIdle);
    } else {
      schedule();
    }

    function apply() {
      rafRef.current = null;
      const altDeg = (sun.altitude * 180) / Math.PI;
      const azDeg = ((sun.azimuth * 180) / Math.PI + 360) % 360;

      const preset = pickLightPreset(altDeg, azDeg);
      if (preset !== lastPreset.current) {
        try {
          map.setConfigProperty('basemap', 'lightPreset', preset);
          lastPreset.current = preset;
        } catch { /* style without basemap config */ }
      }

      const sinAlt = Math.max(0, Math.sin(sun.altitude));
      const dayLerp = smoothstep(-6, 6, altDeg);
      const ambientIntensity = altDeg > 0
        ? 0.2 + sinAlt * 0.6
        : 0.05 + smoothstep(-6, 0, altDeg) * 0.15;
      let ambientColor = lerpColor(NIGHT_BLUE, WARM_WHITE, dayLerp);

      const goldenStrength =
        smoothstep(-4, 1, altDeg) * (1 - smoothstep(1, 6, altDeg));

      if (goldenStrength > 0) {
        ambientColor = lerpColor(ambientColor, GOLDEN, goldenStrength * 0.5);
      }

      const lights: any[] = [
        {
          id: 'ambient',
          type: 'ambient',
          properties: { color: ambientColor, intensity: clamp(ambientIntensity, 0, 1) },
        },
      ];

      if (altDeg > 0) {
        const polarDeg = 90 - altDeg;
        const sunIntensity = clamp(0.3 + sinAlt * 0.7, 0, 1);
        const sunColor = goldenStrength > 0
          ? lerpColor(SUN_WHITE, GOLDEN, goldenStrength)
          : SUN_WHITE;

        const sunLight: any = {
          id: 'sun',
          type: 'directional',
          properties: {
            direction: [azDeg, polarDeg],
            color: sunColor,
            intensity: sunIntensity,
          },
        };
        if (enableShadows) {
          sunLight.properties['cast-shadows'] = true;
          sunLight.properties['shadow-intensity'] = 0.85;
        }
        lights.push(sunLight);
      }

      try {
        map.setLights(lights);
      } catch { /* style not ready or unsupported */ }
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (detachIdle) detachIdle();
    };
  }, [sunPosition, mapLoaded, mapRef, enableShadows, deferUntilIdle]);

  return null;
}
