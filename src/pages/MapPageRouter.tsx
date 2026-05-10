import { lazy, Suspense } from 'react';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import MapPage from './MapPage';
import MapSkeleton from '../components/map/MapSkeleton';

// Lazy-load the Safari fallback so non-Safari users never download the
// extra mapbox-gl@2 bundle.
const MapPageSafari = lazy(() => import('../safari/MapPageSafari'));

/**
 * One page component, two implementations:
 *   • Default `MapPage` — mapbox-gl@3 + react-map-gl@8, photoreal Standard
 *     style, GPU-clustered symbol layer markers.
 *   • `MapPageSafari` (lazy) — mapbox-gl@2 (WebGL1), streets-v12 style, DOM
 *     markers. Loads only when the user agent identifies as Safari, where
 *     v3's Standard style hits known WebGL2 / UBO limit issues.
 */
export default function MapPageRouter() {
  const caps = useDeviceCapabilities();
  if (caps.isSafari) {
    return (
      <Suspense fallback={<MapSkeleton visible />}>
        <MapPageSafari />
      </Suspense>
    );
  }
  return <MapPage />;
}
