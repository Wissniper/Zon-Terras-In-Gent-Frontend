import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocation } from 'react-router-dom';

import { useTerrasData } from '../hooks/useTerrasData';
import { useRestaurantsData } from '../hooks/useRestaurantsData';
import { useEventsData } from '../hooks/useEventsData';
import { useTerrasSunData } from '../hooks/useTerrasSunData';
import { useRestaurantSunData } from '../hooks/useRestaurantSunData';
import { useEventSunData } from '../hooks/useEventSunData';
import { intensityColor, intensityLabel } from '../utils/intensity';
import LiveStatePanel from '../components/map/LiveStatePanel';
import SunniestNowPanel from '../components/map/SunniestNowPanel';
import SunTimeline from '../components/SunTimeline';
import Pill from '../components/ui/Pill';
import type { Terras, Restaurant, Event } from '../types';

/**
 * Safari-only fallback map.
 *
 * Why Leaflet, not Mapbox?
 *   The default `MapPage` uses `mapbox-gl@3` which needs WebGL2 with UBO
 *   support. We tried `mapbox-gl@2` (WebGL1) too — also fails on the
 *   reporter's Safari with "WebGL: context lost" during `_setupPainter`,
 *   meaning Safari is unable to keep *any* WebGL context alive on this
 *   machine. Leaflet renders tiles via plain Canvas2D / DOM, no WebGL,
 *   no GPU contexts to lose.
 *
 *   Tile source: OpenStreetMap (no token, zero infrastructure required).
 *   Markers: plain DivIcons, same colour-coded dots as the WebGL path.
 *   Floating panels (LiveStatePanel, SunniestNowPanel, SunTimeline) are
 *   reused from the desktop bundle — they don't depend on the map engine.
 */

const INITIAL = { lat: 51.0543, lng: 3.7174, zoom: 14 };
const MAX_BOUNDS = L.latLngBounds([50.99, 3.65], [51.12, 3.82]);

const COLORS = {
  terras: '#E5870A',
  restaurant: '#5C8FA8',
  event: '#FF6B4A',
};

type LayerFilter = 'terras' | 'restaurants' | 'events' | 'all';
type Category = 'terras' | 'restaurant' | 'event';

function createPinIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<div style="
      width:18px;height:18px;border-radius:50%;
      border:2px solid #fff;background:${color};
      box-shadow:0 2px 4px rgba(0,0,0,0.32);
      transition:transform 0.15s ease;
    "></div>`,
  });
}

const ICONS = {
  terras: createPinIcon(COLORS.terras),
  restaurant: createPinIcon(COLORS.restaurant),
  event: createPinIcon(COLORS.event),
};

interface PanelProps {
  terras: Terras | null;
  restaurant: Restaurant | null;
  event: Event | null;
  terrasIntensity: number;
  restaurantIntensity: number;
  eventIntensity: number;
  onClose: () => void;
}

function SelectedPanel({ terras, restaurant, event, terrasIntensity, restaurantIntensity, eventIntensity, onClose }: PanelProps) {
  const active = terras ?? restaurant ?? event;
  if (!active) return null;
  const title = terras?.name ?? restaurant?.name ?? event?.title ?? '';
  const subtitle = (terras ?? restaurant)?.address ?? event?.address ?? '';
  const intensity = terras ? terrasIntensity : restaurant ? restaurantIntensity : eventIntensity;
  const colour = intensityColor(intensity);
  const detailHref = terras
    ? `/terrasen/${terras.uuid}`
    : restaurant
      ? `/restaurants/${restaurant.uuid}`
      : event
        ? `/events/${event.uuid}`
        : '#';
  const tone = terras ? 'gold' : restaurant ? 'sky' : 'terra';

  return (
    <div className="absolute left-5 bottom-5 z-[1000] w-[360px] max-w-[90vw] rounded-2xl"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-float)' }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <Pill tone={tone} className="mb-2">
              {terras ? 'Terrace' : restaurant ? 'Restaurant' : 'Event'}
            </Pill>
            <h3 className="font-display font-semibold text-text-1" style={{ fontSize: '1.4rem' }}>{title}</h3>
            <p className="text-xs text-text-3 mt-1.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded text-text-3 hover:text-text-1" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-4 px-4 py-3.5 rounded-xl mb-4"
          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
        >
          <span className="font-display tabular-nums shrink-0" style={{ fontSize: '2.4rem', lineHeight: 1, color: colour }}>
            {intensity}<span style={{ fontSize: '1rem' }}>%</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-text-1" style={{ fontSize: '0.875rem' }}>{intensityLabel(intensity)}</p>
            <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: 'var(--color-track)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${intensity}%`, background: `linear-gradient(to right, ${colour}88, ${colour})` }} />
            </div>
          </div>
        </div>
        <a href={detailHref} className="block text-center text-sm font-semibold px-4 py-2.5 rounded-lg"
          style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', boxShadow: 'var(--shadow-amber)' }}>
          View details →
        </a>
      </div>
    </div>
  );
}

export default function MapPageSafari() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  const [layerFilter, setLayerFilter] = useState<LayerFilter>('all');
  const [selectedTerras, setSelectedTerras] = useState<Terras | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const { data: terrasen = [] } = useTerrasData();
  const { data: restaurants = [] } = useRestaurantsData();
  const { data: events = [] } = useEventsData();
  const terrasSunData = useTerrasSunData(selectedTerras?.uuid ?? null);
  const restaurantSunData = useRestaurantSunData(selectedRestaurant?.uuid ?? null);
  const eventSunData = useEventSunData(selectedEvent?.uuid ?? null);
  const location = useLocation();

  // Initialise the Leaflet map once.
  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, {
      center: [INITIAL.lat, INITIAL.lng],
      zoom: INITIAL.zoom,
      minZoom: 12,
      maxBounds: MAX_BOUNDS,
      maxBoundsViscosity: 0.85,
      preferCanvas: true,        // tile rendering on Canvas2D, no SVG cost
      zoomControl: false,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapRef.current = map;
    markerLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      markerLayerRef.current?.clearLayers();
      markerLayerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Re-render markers on data / filter change.
  const handlersRef = useRef({ setSelectedTerras, setSelectedRestaurant, setSelectedEvent });
  useEffect(() => {
    handlersRef.current = { setSelectedTerras, setSelectedRestaurant, setSelectedEvent };
  });

  useEffect(() => {
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const addMarker = (
      lng: number, lat: number, category: Category,
      onPick: () => void,
    ) => {
      const m = L.marker([lat, lng], { icon: ICONS[category] })
        .on('click', () => {
          onPick();
          map.flyTo([lat, lng], Math.max(map.getZoom(), 17), { duration: 0.9 });
        });
      m.addTo(layer);
    };

    if (layerFilter === 'terras' || layerFilter === 'all') {
      for (const t of terrasen) {
        const c = t.location?.coordinates;
        if (!c) continue;
        addMarker(c[0], c[1], 'terras', () => {
          handlersRef.current.setSelectedTerras(t);
          handlersRef.current.setSelectedRestaurant(null);
          handlersRef.current.setSelectedEvent(null);
        });
      }
    }
    if (layerFilter === 'restaurants' || layerFilter === 'all') {
      for (const r of restaurants) {
        const c = r.location?.coordinates;
        if (!c) continue;
        addMarker(c[0], c[1], 'restaurant', () => {
          handlersRef.current.setSelectedRestaurant(r);
          handlersRef.current.setSelectedTerras(null);
          handlersRef.current.setSelectedEvent(null);
        });
      }
    }
    if (layerFilter === 'events' || layerFilter === 'all') {
      for (const ev of events) {
        const c = ev.location?.coordinates;
        if (!c) continue;
        addMarker(c[0], c[1], 'event', () => {
          handlersRef.current.setSelectedEvent(ev);
          handlersRef.current.setSelectedTerras(null);
          handlersRef.current.setSelectedRestaurant(null);
        });
      }
    }
  }, [terrasen, restaurants, events, layerFilter]);

  // Deep-link from a detail page → focus that entity.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const state = location.state as { focusId?: string; type?: string } | null;
    if (!state?.focusId) return;
    const id = state.focusId;
    let coords: [number, number] | undefined;
    if (state.type === 'terras') {
      const t = terrasen.find((x) => x.uuid === id);
      if (t) { setSelectedTerras(t); coords = [t.location.coordinates[1], t.location.coordinates[0]]; }
    } else if (state.type === 'restaurant') {
      const r = restaurants.find((x) => x.uuid === id);
      if (r) { setSelectedRestaurant(r); coords = [r.location.coordinates[1], r.location.coordinates[0]]; }
    } else if (state.type === 'event') {
      const ev = events.find((x) => x.uuid === id);
      if (ev) { setSelectedEvent(ev); coords = [ev.location.coordinates[1], ev.location.coordinates[0]]; }
    }
    if (coords) map.flyTo(coords, 18, { duration: 1.2 });
  }, [location.state, terrasen, restaurants, events]);

  const focusTerras = (uuid: string) => {
    const t = terrasen.find((x) => x.uuid === uuid);
    if (!t || !mapRef.current) return;
    setSelectedTerras(t);
    setSelectedRestaurant(null);
    setSelectedEvent(null);
    const [lng, lat] = t.location.coordinates;
    mapRef.current.flyTo([lat, lng], Math.max(mapRef.current.getZoom(), 17), { duration: 0.9 });
  };

  const recenter = () => {
    mapRef.current?.flyTo([INITIAL.lat, INITIAL.lng], INITIAL.zoom, { duration: 1 });
  };

  const layerToggle = useMemo(() => (
    <div className="flex items-center gap-0.5 rounded-full p-1"
      style={{
        background: 'var(--color-map-overlay)',
        border: '1px solid var(--color-map-overlay-border)',
        backdropFilter: 'blur(20px)',
        boxShadow: 'var(--shadow-float)',
      }}
    >
      {(['all', 'terras', 'restaurants', 'events'] as LayerFilter[]).map((f) => (
        <button
          key={f}
          onClick={() => setLayerFilter(f)}
          className="text-[11px] font-semibold transition-all"
          style={{
            padding: '6px 13px',
            borderRadius: 999,
            color: layerFilter === f ? '#FFFFFF' : 'var(--color-text-2)',
            background: layerFilter === f ? 'var(--color-primary)' : 'transparent',
          }}
        >
          {f === 'all' ? 'All' : f === 'terras' ? 'Terraces' : f === 'restaurants' ? 'Food' : 'Events'}
        </button>
      ))}
    </div>
  ), [layerFilter]);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <div className="flex-1 relative overflow-hidden">
        <div ref={containerRef} style={{ position: 'absolute', inset: 0, background: 'var(--color-surface-2)' }} />

        <div className="hidden md:block absolute top-5 left-5 z-[1000] max-w-[260px]">
          <LiveStatePanel />
        </div>

        <div className="hidden md:flex absolute top-5 right-5 z-[1000] flex-col items-end gap-3">
          {layerToggle}
          <SunniestNowPanel onPick={focusTerras} />
        </div>

        <div className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
          {layerToggle}
        </div>

        <button
          onClick={recenter}
          className="absolute bottom-5 left-5 z-[1000] rounded-full"
          style={{
            width: 44, height: 44,
            background: 'var(--color-map-overlay)',
            border: '1px solid var(--color-map-overlay-border)',
            backdropFilter: 'blur(20px)',
            boxShadow: 'var(--shadow-float)',
            color: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Recenter on Ghent"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" /><line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" /><line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
          </svg>
        </button>

        <button
          className="md:hidden absolute bottom-5 right-5 z-[1001] w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #FFD075, #ED8A1F)',
            color: 'var(--color-on-primary)',
            boxShadow: 'var(--shadow-amber-lg)',
            border: '2px solid #FFFFFF',
          }}
          onClick={() => setTimelineOpen(true)}
          aria-label="Open sun timeline"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        </button>

        {timelineOpen && (
          <div className="md:hidden fixed inset-0 z-[1004]"
            style={{ background: 'rgba(26,22,17,0.55)', backdropFilter: 'blur(3px)' }}
            onClick={() => setTimelineOpen(false)}
          />
        )}
        <div
          className={`md:hidden fixed inset-y-0 right-0 z-[1005] w-32 flex flex-col transition-transform duration-300 ease-in-out ${
            timelineOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{
            background: 'var(--color-map-overlay)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid var(--color-map-overlay-border)',
            boxShadow: 'var(--shadow-float)',
          }}
        >
          <div className="flex justify-end px-2 pt-2">
            <button onClick={() => setTimelineOpen(false)} className="p-2" aria-label="Close timeline">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <SunTimeline orientation="vertical" />
        </div>

        <SelectedPanel
          terras={selectedTerras}
          restaurant={selectedRestaurant}
          event={selectedEvent}
          terrasIntensity={terrasSunData.intensity}
          restaurantIntensity={restaurantSunData.intensity}
          eventIntensity={eventSunData.intensity}
          onClose={() => { setSelectedTerras(null); setSelectedRestaurant(null); setSelectedEvent(null); }}
        />
      </div>

      <div className="hidden md:block">
        <SunTimeline orientation="horizontal" />
      </div>
    </div>
  );
}
