import { useEffect, useState, type RefObject } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';

/**
 * Boolean hook: `true` when the current zoom is at or above `showAt`,
 * `false` when it drops below `hideAt`. Hysteresis prevents flicker.
 *
 * Crucially, the React state only updates on threshold *crossings* — every
 * intermediate zoom-tick is read directly from the Mapbox instance, so a
 * pinch-zoom does not trigger one parent re-render per frame.
 */
export function useZoomThreshold(
  mapRef: RefObject<MapRef | null>,
  mapLoaded: boolean,
  showAt: number,
  hideAt: number,
): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current.getMap();

    let isActive = false;
    setActive(false);

    const evaluate = () => {
      const z = map.getZoom();
      if (!isActive && z >= showAt) {
        isActive = true;
        setActive(true);
      } else if (isActive && z < hideAt) {
        isActive = false;
        setActive(false);
      }
    };

    evaluate();
    map.on('zoomend', evaluate);
    map.on('zoom', evaluate);

    return () => {
      map.off('zoomend', evaluate);
      map.off('zoom', evaluate);
    };
  }, [mapLoaded, mapRef, showAt, hideAt]);

  return active;
}
