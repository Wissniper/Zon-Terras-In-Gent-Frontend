import { useEffect, useState, type RefObject } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';

/**
 * Subscribes to the map's `zoom` event and reports the current zoom level.
 *
 * Updates are throttled to one per animation frame so a slow pinch-zoom does
 * not trigger a re-render every micro-step.
 */
export function useMapZoom(
  mapRef: RefObject<MapRef | null>,
  mapLoaded: boolean,
): number {
  const [zoom, setZoom] = useState<number>(0);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current.getMap();

    setZoom(map.getZoom());

    let raf: number | null = null;
    const onZoom = () => {
      if (raf !== null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        setZoom(map.getZoom());
      });
    };

    map.on('zoom', onZoom);
    map.on('zoomend', onZoom);
    return () => {
      map.off('zoom', onZoom);
      map.off('zoomend', onZoom);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [mapLoaded, mapRef]);

  return zoom;
}
