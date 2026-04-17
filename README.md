# Sun-Seeker Gent — Frontend

A single-page app that lets you find the sunniest terraces in Ghent right now. A 3D rotatable map dominates the center, surrounded by floating widget panels showing live weather, sun intensity, and a time slider to preview which terraces will be in the sun later today.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** — build tool & dev server
- **Tailwind CSS** — styling
- **React Leaflet** — map rendering
- **TanStack Query** — data fetching
- **Socket.io** — live weather updates
- **React Router v7** — client-side routing

## Getting Started

```bash
npm install
npm run dev
```

The dev server proxies `/api` requests to `https://api.sun-seeker.be`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check + production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

## Deployment

Deployed on **Vercel**. The `vercel.json` config handles:
- `/api/*` rewrites to the backend at `https://api.sun-seeker.be`
- SPA fallback so React Router works on direct URL loads

CI runs on every push/PR to `main` via GitHub Actions (lint + build).

---

## Design Brief

### Concept

Single-page app. A 3D rotatable map of Ghent dominates the center. Floating widget panels surround it. Dark, premium feel — like a weather dashboard meets a city explorer.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  [Logo + App Name]              [Search bar]        │
├──────────┬──────────────────────────────┬───────────┤
│          │                              │           │
│ Weather  │                              │  Legend   │
│ Widget   │       3D MAP (center)        │  Widget   │
│          │       rotatable/tiltable     │           │
│          │                              │           │
│ Updates  │                              │  Sun      │
│ Widget   │                              │  Slider   │
│          │                              │  Widget   │
├──────────┴──────────────────────────────┴───────────┤
│              Future Sun Timeline (bottom bar)        │
└─────────────────────────────────────────────────────┘
```

### Color Palette

| Role | Color | Hex |
|---|---|---|
| Background | Deep charcoal | `#0F0F14` |
| Surface (widgets) | Dark navy | `#16182A` |
| Surface elevated | Slightly lighter | `#1E2138` |
| Border/divider | Subtle purple-grey | `#2E3055` |
| Primary accent | Warm amber/gold | `#F5A623` |
| Secondary accent | Sky blue | `#4FC3F7` |
| Sun intensity high | Orange-yellow | `#FFD45E` |
| Sun intensity low | Muted slate | `#4A5068` |
| Text primary | Off-white | `#F0F0F5` |
| Text secondary | Muted grey | `#8B8FA8` |
| Success/live | Soft green | `#4CAF81` |

### 3D Map (center, ~60% of screen width)

- Rendered with Mapbox GL JS or deck.gl — 3D buildings enabled
- Default pitch: 45°, bearing: -17° (slight rotation)
- Drag to rotate, scroll to zoom, right-click drag to tilt
- Terras locations shown as glowing circular markers — color mapped to sun intensity (amber = sunny, grey-blue = shaded)
- Clicking a marker opens a popup card: terras name, current intensity %, sun/cloud icon, address
- Map style: dark (`mapbox://styles/mapbox/dark-v11` or custom)
- Ghent city center locked as default view

### Widget Panels (frosted glass style)

All widgets: `background: rgba(22, 24, 42, 0.85)`, `backdrop-filter: blur(12px)`, `border: 1px solid #2E3055`, `border-radius: 16px`

**Weather Widget (top-left)**
- Current temp, wind speed, UV index, cloud cover %
- Large icon (sun/cloud/rain)
- Data from `/api/weather`

**Updates Widget (bottom-left)**
- Live feed via WebSocket — shows "Weather updated 2 min ago", new terras added, etc.
- Subtle pulsing green dot indicating live connection

**Legend Widget (top-right)**
- Gradient bar: grey-blue → amber → bright yellow
- Labels: Shaded / Partial / Full Sun
- Dot size legend if markers vary by size

**Sun Slider Widget (bottom-right)**
- Horizontal time slider: 06:00 → 22:00
- Dragging it re-renders marker colors on the map based on predicted sun intensity at that time
- Current time highlighted with amber thumb

**Future Sun Timeline (bottom bar, full width)**
- Horizontal scrollable bar showing today + next 3 days
- Each hour block colored by predicted sun intensity
- Click a block → updates the map to that time

### Typography

- Font: **Inter** (Google Fonts)
- App name/headings: 600 weight, `#F0F0F5`
- Widget labels: 12px, `#8B8FA8`, uppercase, letter-spacing 0.08em
- Values/data: 24–32px, `#F5A623` (accent), 700 weight

### Interactions

- Smooth transitions on all widget data updates (`transition: 0.3s ease`)
- Map markers pulse/animate when intensity is high
- Slider drag updates map in real-time (debounced ~100ms)
- Mobile: widgets collapse into a bottom sheet, map takes full screen
