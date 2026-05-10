# Sun Seeker — Frontend

A single-page app that shows you, for every café terrace in Ghent, how much sun it's getting **right now** — and how that changes across the next 48 hours. A 3D Mapbox map dominates the screen; floating panels overlay live weather, the sunniest spots ranked at the selected time, and a draggable timeline that scrubs the entire UI through time.

> **Authors:** Wisdom Ononiba, Yoanna Oosterlinck — University Ghent, 2026

Live: **[sun-seeker.be](https://sun-seeker.be)** · Backend: **[api.sun-seeker.be](https://api.sun-seeker.be)** ([repo](https://github.com/Wissniper/Zon-Terras-In-Gent-Backend))

---

## Highlights

- **Photoreal 3D map** — Mapbox Standard style with the sun's actual altitude and azimuth driving directional lighting and building shadows (`AtmosphericLighting.tsx`)
- **Time travel** — `SunTimeline` lets you drag through 48 hours; intensity values, the leaderboard, and the weather panel all follow the selected time
- **Live leaderboard** — `SunniestNowPanel` ranks the top 5 sunniest terraces at the selected time, re-fetched live via the same path as the entity sun endpoint
- **Discover page** — editorial card grid of every terrace / restaurant / event with the same time-aware intensity badges
- **GPU-clustered markers** — single Mapbox symbol layer with viewport-bounds culling (`MapMarkersLayer.tsx`); thousands of points stay interactive
- **Safari fallback** — Safari's WebGL2/UBO budget can't sustain Mapbox v3, so `MapPageRouter` lazy-loads a Leaflet-based equivalent that reuses every floating panel
- **Editorial light + cinematic dark** — single CSS-token system inverts cleanly: warm honey-tan light mode, near-black amber dark mode, theme toggle persists

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS + CSS custom-properties for theming |
| 3D map (default) | mapbox-gl 3 + react-map-gl 8 |
| 2D fallback (Safari) | Leaflet + leaflet.markercluster |
| Data fetching | TanStack Query 5 |
| HTTP client | axios |
| Real-time | socket.io-client (`weather_update` invalidates queries) |
| Routing | React Router 7 |
| Type face | Playfair Display (display) + DM Sans (UI) |

---

## Routes

| Path | Component | What it shows |
|---|---|---|
| `/` | `MapPageRouter` → `MapPage` (or `MapPageSafari`) | Full-bleed map with floating live panels + bottom timeline |
| `/discover` | `SearchPage` | Editorial featured hero, partial-sun strip, paged browse grid |
| `/terrasen/:id` | `TerrasDetailPage` | Hero ring + sun stats + golden hour + "Show on map" deep-link |
| `/restaurants/:id` | `RestaurantDetailPage` | Same template + opening hours, phone, takeaway |
| `/events/:id` | `EventDetailPage` | Same template + start/end dates |

All detail pages render through one `EntityDetail` component driven by config — title, intensity ring, sun-position grid, golden-hour stats, link rows, and a "Show on map" button that deep-links back to `MapPage` with a `flyTo`.

---

## Project structure

```
src/
├── App.tsx                          # Routes + layout shell
├── main.tsx                         # QueryClient + provider tree
├── index.css                        # CSS tokens (light + dark) + utilities
├── pages/
│   ├── MapPageRouter.tsx            # Safari probe → Leaflet vs Mapbox
│   ├── MapPage.tsx                  # Mapbox v3, floating panels, timeline
│   ├── SearchPage.tsx               # /discover — featured + grid
│   └── *DetailPage.tsx              # Three thin wrappers around EntityDetail
├── safari/
│   └── MapPageSafari.tsx            # Leaflet fallback w/ cluster + same panels
├── components/
│   ├── AtmosphericLighting.tsx      # Sun-driven map lighting + shadows
│   ├── SunTimeline.tsx              # 48 h slider, horizontal + vertical
│   ├── EntityDetail.tsx             # Single detail-page template
│   ├── NavBar.tsx                   # Sticky top nav + theme toggle
│   ├── OfflineIndicator.tsx         # Socket-status pill
│   ├── map/
│   │   ├── LiveStatePanel.tsx       # Top-left: time, weather, sun
│   │   ├── SunniestNowPanel.tsx     # Top-right leaderboard
│   │   ├── MapMarkersLayer.tsx      # GPU-clustered symbol layer
│   │   └── MapSkeleton.tsx          # First-paint loading curtain
│   └── ui/                          # Card, Pill, IntensityRing, Stat, BackButton
├── contexts/                        # FilterContext, TimeContext, MapContext, SocketContext
├── hooks/
│   ├── useTerrasData / useRestaurantsData / useEventsData
│   ├── useSunPosition / useTerrasSunData / useRestaurantSunData / useEventSunData
│   ├── useSunniestTerrasen          # Candidate-pool re-rank for leaderboard
│   ├── useTimeAwareIntensities      # Shared cache w/ leaderboard, used by Discover
│   ├── useWeatherAtTime             # Open-Meteo hourly direct (covers 48-h horizon)
│   ├── useDeviceCapabilities        # Safari probe-skip + WebGL2 detect
│   └── useMapLoadingState           # First-idle ready flag
├── services/                        # api.ts, terrasService, restaurantService, eventService, sunService, weatherService, socket
├── types/index.ts                   # Terras, Restaurant, Event, SunData, Weather
└── utils/intensity.ts               # intensityColor / intensityLabel
```

---

## Getting started

**Requirements:** Node 20+, a Mapbox public token

```bash
npm install
cp .env.example .env       # add VITE_MAPBOX_TOKEN
npm run dev
```

### Environment variables

| Variable | Required | Default |
|---|---|---|
| `VITE_MAPBOX_TOKEN` | Yes | — (Mapbox refuses to render without it) |
| `VITE_API_URL` | No | `https://api.sun-seeker.be` (used by Vite's dev proxy) |

The dev server proxies `/api/*` requests to `VITE_API_URL`, so `axios` calls stay on the same origin in development. Mapbox tiles come straight from `api.mapbox.com`.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with `/api` proxy |
| `npm run build` | TypeScript project-references build + production bundle |
| `npm run lint` | Run ESLint |
| `npm run preview` | Serve the production bundle locally |

---

## Deployment

Deployed on **Vercel**. `vercel.json` rewrites:

- `/api/*` → `https://api.sun-seeker.be/api/*` (no CORS needed, same origin)
- `/(.*)` → `/index.html` (SPA fallback for direct URL loads)

CI runs lint + build on every push and PR via GitHub Actions.

## License

Academic project — University Ghent, 2026.
