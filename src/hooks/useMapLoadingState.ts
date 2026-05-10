import { useEffect, useState, type RefObject } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';

interface State {
  loading: boolean;
  progress: number;
  ready: boolean;
}

const READY_DELAY_MS = 200;

/**
 * Tracks whether the Mapbox map is in its **initial** load phase.
 *
 * After the first `idle` event fires (style + initial tiles complete) we flip
 * `ready=true` and never show the loading state again. Subsequent re-loads
 * during pans rely on Mapbox's built-in tile fade for continuity rather than a
 * full-screen overlay.
 */
export function useMapLoadingState(
  mapRef: RefObject<MapRef | null>,
  mapLoaded: boolean,
): State {
  const [state, setState] = useState<State>({ loading: true, progress: 10, ready: false });

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current.getMap();

    let progressTimer: number | null = window.setInterval(() => {
      setState((s) =>
        s.ready ? s : { ...s, progress: Math.min(95, s.progress + 6) },
      );
    }, 120);

    const finish = () => {
      if (progressTimer !== null) {
        window.clearInterval(progressTimer);
        progressTimer = null;
      }
      setState({ loading: false, progress: 100, ready: true });
    };

    const onIdle = () => {
      window.setTimeout(finish, READY_DELAY_MS);
    };

    if (map.loaded() && map.areTilesLoaded?.()) {
      onIdle();
    } else {
      map.once('idle', onIdle);
    }

    return () => {
      if (progressTimer !== null) window.clearInterval(progressTimer);
      map.off('idle', onIdle);
    };
  }, [mapLoaded, mapRef]);

  return state;
}
