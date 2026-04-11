# Issues

Issues listed in recommended completion order.

---

## #82 — Set up React frontend with Vite + TypeScript
**Status:** Open | Opened Mar 8

Foundation. Nothing else can start until this is done.

- Scaffold: `npx create-vite@latest . --template react-ts`
- Install: `leaflet react-leaflet @tanstack/react-query axios socket.io-client tailwindcss leaflet-shadow-simulator`
- Configure Tailwind, Vite proxy to backend, folder structure, TypeScript types

---

## #21 — Implement global state with Context
**Status:** Open | Opened Feb 27

Other components need shared state — set this up before building any UI.

- Context (or Zustand) for map bounds, filters, and current time
- `FilterContext`: sunnyOnly, minIntensity, cuisine, query
- `TimeContext`: selected datetime (ISO string), default now
- `MapContext`: Leaflet map instance ref, center, zoom

---

## #22 — Add routing with React Router
**Status:** Open | Opened Feb 27

Define page structure before building individual pages.

- Install `react-router-dom`
- Routes: `/` (MapPage), `/terrasen/:id`, `/restaurants/:id`, `/events/:id`, `/search`
- Stub page components and a navigation bar

---

## #27 — Asynchronous Communication
**Status:** Open | Opened Feb 27

Data fetching infrastructure must exist before any component fetches real data.

- Set up TanStack Query: `useQuery` for sun/weather data with 5-minute polling
- Integrate Socket.io-client: listen for `sunUpdate`, refetch queries on events
- Add error handling: retries, exponential backoff, offline indicators

---

## #25 — Future-Sun-Slider
**Status:** Open | Opened Feb 27

Depends on #27 (async) and #21 (TimeContext).

- Build SVG circle component with hourly arcs, color-coded by predicted intensity
- Fetch 24h sun data via API, animate slider for time selection
- Sync slider with map shadows and markers

---

## #28 — Weather Widgets
**Status:** Open | Opened Feb 27

Depends on #27 (async communication).

- Floating component showing current UV, wind, temperature, cloud cover via Open-Meteo
- Animate updates on socket events

---

## #29 — Legend and Info
**Status:** Open | Opened Feb 27

UI polish — do after markers and data are working.

- Design color-coded legend for intensity, icons for events/restaurants
- Fill map empty space with legend, filters, slider, info panels

---

## #11 — Fetch Gent 3D CSV
**Status:** Open | Opened Feb 27

Backend script — can be worked on in parallel with frontend issues.

- Write Node script to fetch Gent 3D CSV from data.stad.gent, parse tiles, download OBJ/GLTF files, store metadata in MongoDB
- Implement fallback: parse Stad.Gent API v2 JSON or OpenDataSoft GeoJSON exports
- Add script logging, error handling for large downloads, and progress tracking
