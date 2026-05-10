import { useEffect, useRef, useState, type RefObject } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';

export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

const DEBOUNCE_MS = 250;
const PAD_FACTOR = 0.15;

export function useViewportBounds(
  mapRef: RefObject<MapRef | null>,
  mapLoaded: boolean,
): ViewportBounds | null {
  const [bounds, setBounds] = useState<ViewportBounds | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current.getMap();

    const compute = () => {
      const b = map.getBounds();
      if (!b) return;
      const ne = b.getNorthEast();
      const sw = b.getSouthWest();
      const latPad = (ne.lat - sw.lat) * PAD_FACTOR;
      const lngPad = (ne.lng - sw.lng) * PAD_FACTOR;
      setBounds({
        north: ne.lat + latPad,
        south: sw.lat - latPad,
        east: ne.lng + lngPad,
        west: sw.lng - lngPad,
      });
    };

    const onMoveEnd = () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(compute, DEBOUNCE_MS);
    };

    compute();
    map.on('moveend', onMoveEnd);
    map.on('zoomend', onMoveEnd);

    return () => {
      map.off('moveend', onMoveEnd);
      map.off('zoomend', onMoveEnd);
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [mapLoaded, mapRef]);

  return bounds;
}
