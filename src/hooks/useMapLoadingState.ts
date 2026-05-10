import { useEffect, useState, type RefObject } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';

interface State {
  ready: boolean;
}

/**
 * Flips `ready=true` after the map fires its first `idle` event (style + first
 * tile batch settled). No timers, no progress polling — the curtain stays up
 * during the heaviest paint and gets out of the way as soon as the map is
 * actually interactive.
 */
export function useMapLoadingState(
  mapRef: RefObject<MapRef | null>,
  mapLoaded: boolean,
): State {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current.getMap();

    const finish = () => setReady(true);

    if (map.areTilesLoaded?.()) {
      finish();
    } else {
      map.once('idle', finish);
    }

    return () => {
      map.off('idle', finish);
    };
  }, [mapLoaded, mapRef]);

  return { ready };
}
