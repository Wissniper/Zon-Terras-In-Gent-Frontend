// `mapbox-gl-safari` is an npm-alias install of mapbox-gl@^2 (used as the
// Safari WebGL1 fallback). It doesn't ship its own .d.ts files, but its
// runtime API is a strict subset of the v3 types we already have via
// `@types/mapbox-gl` — re-exporting those gives us full IntelliSense for
// the v2 surface we use without pulling in a second type package.
declare module 'mapbox-gl-safari' {
  import * as mapboxgl from 'mapbox-gl';
  export = mapboxgl;
}

declare module 'mapbox-gl-safari/dist/mapbox-gl.css';
