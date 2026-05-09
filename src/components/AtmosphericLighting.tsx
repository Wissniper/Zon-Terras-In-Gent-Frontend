import { useEffect, useRef } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';
import type { Map as MapboxMap } from 'mapbox-gl';

interface SunPosition {
  azimuth: number;  // radians, suncalc3 compass bearing (0 = N, CW)
  altitude: number; // radians, 0 = horizon
}

interface Props {
  mapRef: React.RefObject<MapRef | null>;
  sunPosition: SunPosition | null;
  mapLoaded: boolean;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

// Linear hex interpolation. Inputs '#rrggbb', t in [0,1].
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

// Spec colours
const NIGHT_BLUE = '#0a1530';   // deep blue ambient at night
const WARM_WHITE = '#fff5e0';   // ambient daylight warm-white
const GOLDEN     = '#f5ac32';   // golden-hour amber (matches spec)
const SUN_WHITE  = '#ffffff';

// Pick the Standard-style basemap lightPreset that best matches the sun altitude.
// Mapbox transitions between presets smoothly when toggled.
function pickLightPreset(altitudeDeg: number, azimuthDeg: number): 'dawn' | 'day' | 'dusk' | 'night' {
  if (altitudeDeg <= -6) return 'night';
  if (altitudeDeg >= 6)  return 'day';
  // Twilight band: classify by azimuth (east half → dawn, west half → dusk).
  // In compass bearing: 0..180 = E half, 180..360 = W half.
  return azimuthDeg < 180 ? 'dawn' : 'dusk';
}

/**
 * Drives the Mapbox Standard style's lighting + sky from the current sun position.
 *
 * Spec mapping (originally for R3F):
 *   <Sky />            → setConfigProperty('basemap','lightPreset', dawn|day|dusk|night)
 *   <HemisphereLight>  → setLights([{ type: 'ambient', ... }])
 *   <DirectionalLight> → setLights([{ type: 'directional', cast-shadows, ... }])
 *
 * Behaviour:
 *   • Night  (alt < 0°)   → ambient = deep blue, no directional, lightPreset = night.
 *   • Twilight (-6°..0°)  → lerp ambient toward warm-white; lightPreset = dawn/dusk.
 *   • Day    (alt > 0°)   → ambient warm-white, intensity 0.2 → 0.8 at zenith.
 *   • Golden Hour (-4°..6°) → directional + ambient tinted toward GOLDEN.
 *
 * All transitions use smoothstep over the sun's altitude so slider movement produces
 * a continuous fade — no intensity/colour pops.
 */
export default function AtmosphericLighting({ mapRef, sunPosition, mapLoaded }: Props) {
  const lastPreset = useRef<string | null>(null);

  useEffect(() => {
    if (!mapLoaded || !sunPosition || !mapRef.current) return;
    const map = mapRef.current.getMap() as MapboxMap;

    const altDeg = (sunPosition.altitude * 180) / Math.PI;
    const azDeg = ((sunPosition.azimuth * 180) / Math.PI + 360) % 360;

    // ---- Sky / atmosphere via Standard-style basemap ----------------------
    const preset = pickLightPreset(altDeg, azDeg);
    if (preset !== lastPreset.current) {
      try {
        map.setConfigProperty('basemap', 'lightPreset', preset);
        lastPreset.current = preset;
      } catch {
        // Ignored: older Mapbox versions or non-Standard style do not support this.
      }
    }

    // ---- Ambient (HemisphereLight equivalent) ----------------------------
    // Spec: night = 0.05 deep blue; day = 0.2 → 0.8 at noon, warm white.
    // Use sin(alt) above horizon for a smooth zenith ramp.
    const sinAlt = Math.max(0, Math.sin(sunPosition.altitude));
    const dayLerp = smoothstep(-6, 6, altDeg);            // 0 deep night → 1 full day
    const ambientIntensity = altDeg > 0
      ? 0.2 + sinAlt * 0.6                                  // 0.2..0.8
      : 0.05 + smoothstep(-6, 0, altDeg) * 0.15;            // 0.05..0.2
    let ambientColor = lerpColor(NIGHT_BLUE, WARM_WHITE, dayLerp);

    // ---- Golden-hour tint --------------------------------------------------
    // Active when altitude ∈ [-4°, 6°]. Strength peaks at altitude 1°.
    const goldenStrength =
      smoothstep(-4, 1, altDeg) * (1 - smoothstep(1, 6, altDeg));

    if (goldenStrength > 0) {
      ambientColor = lerpColor(ambientColor, GOLDEN, goldenStrength * 0.5);
    }

    // ---- Directional sun light --------------------------------------------
    // Present only when sun is above the horizon; otherwise the moonlight is
    // approximated entirely by the ambient term.
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

      lights.push({
        id: 'sun',
        type: 'directional',
        properties: {
          direction: [azDeg, polarDeg],
          color: sunColor,
          intensity: sunIntensity,
          'cast-shadows': true,
          'shadow-intensity': 0.85,
        },
      });
    }

    map.setLights(lights);
  }, [sunPosition, mapLoaded, mapRef]);

  return null;
}
