import { createContext, useContext, useRef, useState, ReactNode } from 'react';
import type { Map as LeafletMap } from 'leaflet';

interface MapContextValue {
  mapRef: React.MutableRefObject<LeafletMap | null>;
  center: [number, number]; // [lat, lng]
  zoom: number;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
}

const MapContext = createContext<MapContextValue | null>(null);

// Default center: Ghent, Belgium
const DEFAULT_CENTER: [number, number] = [51.0543, 3.7174];
const DEFAULT_ZOOM = 14;

export function MapProvider({ children }: { children: ReactNode }) {
  const mapRef = useRef<LeafletMap | null>(null);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  return (
    <MapContext.Provider value={{ mapRef, center, setCenter, zoom, setZoom }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext(): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error('useMapContext must be used inside MapProvider');
  return ctx;
}
