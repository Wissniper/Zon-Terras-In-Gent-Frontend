import { useState, useRef, useEffect, useMemo } from 'react';
import Map from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import type { Map as MapboxMap } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocation } from 'react-router-dom';
import { useTerrasData } from '../hooks/useTerrasData';
import { useRestaurantsData } from '../hooks/useRestaurantsData';
import { useEventsData } from '../hooks/useEventsData';
import { useSunPosition } from '../hooks/useSunPosition';
import { useTerrasSunData } from '../hooks/useTerrasSunData';
import { useRestaurantSunData } from '../hooks/useRestaurantSunData';
import { useEventSunData } from '../hooks/useEventSunData';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { useMapLoadingState } from '../hooks/useMapLoadingState';
import { intensityColor, intensityLabel } from '../utils/intensity';
import AtmosphericLighting from '../components/AtmosphericLighting';
import SunTimeline from '../components/SunTimeline';
import LiveStatePanel from '../components/map/LiveStatePanel';
import SunniestNowPanel from '../components/map/SunniestNowPanel';
import MapSkeleton from '../components/map/MapSkeleton';
import MapMarkersLayer from '../components/map/MapMarkersLayer';
import Pill from '../components/ui/Pill';
import type { Terras, Restaurant, Event } from '../types';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

type LayerFilter = 'terras' | 'restaurants' | 'events' | 'all';

const INITIAL_VIEW = {
  longitude: 3.7174,
  latitude: 51.0543,
  zoom: 14,
  pitch: 50,
  bearing: -17,
};

// Marker palette — only the event tone is still used by the "Nearby events"
// badge in the bottom sheet. All map-pin SVGs were retired in favour of the
// GPU-rendered MapMarkersLayer.
const MARKER = {
  event: '#FF6B4A',
};

/* ─── Layer toggle ────────────────────────────────── */

function LayerToggle({ value, onChange }: { value: LayerFilter; onChange: (v: LayerFilter) => void }) {
  const items: { f: LayerFilter; label: string }[] = [
    { f: 'all',         label: 'All' },
    { f: 'terras',      label: 'Terraces' },
    { f: 'restaurants', label: 'Food' },
    { f: 'events',      label: 'Events' },
  ];
  return (
    <div
      className="flex items-center gap-0.5 rounded-full p-1"
      style={{
        background: 'var(--color-map-overlay)',
        border: '1px solid var(--color-map-overlay-border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: 'var(--shadow-float)',
      }}
    >
      {items.map(({ f, label }) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className="text-[11px] font-semibold tracking-wide transition-all"
          style={{
            padding: '6px 13px',
            borderRadius: 999,
            color: value === f ? '#FFFFFF' : 'var(--color-text-2)',
            background: value === f ? 'var(--color-primary)' : 'transparent',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────── */

export default function MapPage() {
  const mapRef = useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectedTerras, setSelectedTerras] = useState<Terras | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [layerFilter, setLayerFilter] = useState<LayerFilter>('all');
  const caps = useDeviceCapabilities();
  const loadingState = useMapLoadingState(mapRef, mapLoaded);

  // Three queries fire in parallel from mount — TanStack Query schedules them
  // concurrently, so the dataset stream fully overlaps Mapbox's style/tile load.
  const { data: terrasen = [] } = useTerrasData();
  const { data: restaurants = [] } = useRestaurantsData();
  const { data: events = [] } = useEventsData();

  // Markers are visible the moment the map fires its first idle. They cluster
  // automatically when zoomed out and split apart as the user zooms in.
  // Off-screen points are filtered out by MapMarkersLayer's viewport-bounds
  // culling, so the GeoJSON source only ever holds visible-region features.
  const showMarkers = loadingState.ready;
  const selectedUuid =
    selectedTerras?.uuid ?? selectedRestaurant?.uuid ?? selectedEvent?.uuid ?? null;
  const sunPosition = useSunPosition();
  const terrasSunData = useTerrasSunData(selectedTerras?.uuid ?? null);
  const restaurantSunData = useRestaurantSunData(selectedRestaurant?.uuid ?? null);
  const eventSunData = useEventSunData(selectedEvent?.uuid ?? null);
  const location = useLocation();

  // Deep-link from a detail page → focus that entity on the map.
  useEffect(() => {
    const state = location.state as { focusId?: string; type?: string } | null;
    if (!state?.focusId || !mapLoaded) return;
    const { focusId, type } = state;

    let item: { location: { coordinates: [number, number] } } | undefined;
    if (type === 'terras') {
      const found = terrasen.find((t) => t.uuid === focusId);
      if (found) { setSelectedTerras(found); item = found; }
    } else if (type === 'restaurant') {
      const found = restaurants.find((r) => r.uuid === focusId);
      if (found) { setSelectedRestaurant(found); item = found; }
    } else if (type === 'event') {
      const found = events.find((e) => e.uuid === focusId);
      if (found) { setSelectedEvent(found); item = found; }
    }
    if (item && mapRef.current) {
      const [lng, lat] = item.location.coordinates;
      mapRef.current.flyTo({ center: [lng, lat], zoom: 17, duration: 1200 });
    }
  }, [mapLoaded, location.state, terrasen, restaurants, events]);

  const flyToCoords = (coords: [number, number]) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: coords, zoom: 17, duration: 900, essential: true });
  };

  const selectTerras = (t: Terras) => {
    setSelectedTerras(t);
    setSelectedRestaurant(null);
    setSelectedEvent(null);
    flyToCoords(t.location.coordinates as [number, number]);
  };
  const selectRestaurant = (r: Restaurant) => {
    setSelectedRestaurant(r);
    setSelectedTerras(null);
    setSelectedEvent(null);
    flyToCoords(r.location.coordinates as [number, number]);
  };
  const selectEvent = (ev: Event) => {
    setSelectedEvent(ev);
    setSelectedTerras(null);
    setSelectedRestaurant(null);
    flyToCoords(ev.location.coordinates as [number, number]);
  };

  const focusTerras = (uuid: string) => {
    const t = terrasen.find((x) => x.uuid === uuid);
    if (t) selectTerras(t);
  };

  const recenterMap = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [INITIAL_VIEW.longitude, INITIAL_VIEW.latitude],
      zoom: INITIAL_VIEW.zoom,
      pitch: INITIAL_VIEW.pitch,
      bearing: INITIAL_VIEW.bearing,
      duration: 1000,
      essential: true,
    });
  };

  // Events within ~500m of the selected terras (Pythagoras on lng/lat is fine for tiny radius).
  const nearbyEvents = useMemo(() => {
    if (!selectedTerras || events.length === 0) return [];
    const [tLng, tLat] = selectedTerras.location.coordinates;
    return events
      .map((ev) => {
        const [eLng, eLat] = ev.location.coordinates;
        const d = Math.sqrt((tLng - eLng) ** 2 + (tLat - eLat) ** 2);
        return { ev, d };
      })
      .filter(({ d }) => d < 0.005)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
      .map(({ ev }) => ev);
  }, [selectedTerras, events]);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <div className="flex-1 relative overflow-hidden">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={INITIAL_VIEW}
          style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
          mapLib={mapboxgl}
          mapStyle="mapbox://styles/mapbox/standard"
          antialias={caps.antialias}
          fadeDuration={caps.fadeDurationMs}
          maxPitch={caps.isLowEnd ? 60 : 75}
          renderWorldCopies={false}
          preserveDrawingBuffer={false}
          onLoad={() => {
            const map = mapRef.current?.getMap() as MapboxMap;
            map.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
            setMapLoaded(true);
          }}
          maxBounds={[3.65, 50.99, 3.82, 51.12]}
          minZoom={12}
        >
          <AtmosphericLighting
            mapRef={mapRef}
            sunPosition={sunPosition}
            mapLoaded={mapLoaded}
            enableShadows={caps.enableShadows}
          />

          <MapMarkersLayer
            visible={showMarkers}
            terrasen={terrasen}
            restaurants={restaurants}
            events={events}
            layerFilter={layerFilter}
            selectedUuid={selectedUuid}
            onSelectTerras={selectTerras}
            onSelectRestaurant={selectRestaurant}
            onSelectEvent={selectEvent}
          />

        </Map>

        {/* Lightweight loading curtain — visible only until Mapbox fires
            its first `idle` event. Pure CSS, no SVG animations. */}
        <MapSkeleton visible={!mapLoaded || !loadingState.ready} />

        {/* ── Floating panels ─────────────────────────── */}

        {/* Top-left: live state */}
        <div className="hidden md:block absolute top-5 left-5 z-10 max-w-[260px]">
          <LiveStatePanel />
        </div>

        {/* Top-right: layer toggle on top, leaderboard below */}
        <div className="hidden md:flex absolute top-5 right-5 z-10 flex-col items-end gap-3">
          <LayerToggle value={layerFilter} onChange={setLayerFilter} />
          <SunniestNowPanel onPick={focusTerras} />
        </div>

        {/* Mobile-only: compact layer toggle pinned top */}
        <div className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 z-10">
          <LayerToggle value={layerFilter} onChange={setLayerFilter} />
        </div>

        {/* Recenter map button — bottom-left */}
        <button
          onClick={recenterMap}
          className="absolute bottom-5 left-5 z-10 rounded-full transition-all active:scale-95 hover:scale-105"
          style={{
            width: 44,
            height: 44,
            background: 'var(--color-map-overlay)',
            border: '1px solid var(--color-map-overlay-border)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: 'var(--shadow-float)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Recenter map on Ghent"
          title="Recenter on Ghent"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
          </svg>
        </button>

        {/* Mobile timeline FAB */}
        <button
          className="md:hidden absolute bottom-5 right-5 z-20 w-14 h-14 rounded-full flex items-center justify-center transition-transform active:scale-95"
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
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>

        {/* Mobile timeline drawer */}
        {timelineOpen && (
          <div
            className="md:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(26,22,17,0.55)', backdropFilter: 'blur(3px)' }}
            onClick={() => setTimelineOpen(false)}
          />
        )}
        <div
          className={`md:hidden fixed inset-y-0 right-0 z-50 w-32 flex flex-col transition-transform duration-300 ease-in-out ${
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
            <button
              onClick={() => setTimelineOpen(false)}
              className="p-2 rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center"
              style={{ color: 'var(--color-text-2)' }}
              aria-label="Close timeline"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <SunTimeline orientation="vertical" />
        </div>

        {/* Selected entity panel */}
        <SelectedPanel
          terras={selectedTerras}
          restaurant={selectedRestaurant}
          event={selectedEvent}
          terrasIntensity={terrasSunData.intensity}
          restaurantIntensity={restaurantSunData.intensity}
          eventIntensity={eventSunData.intensity}
          nearbyEvents={nearbyEvents}
          onPickEvent={selectEvent}
          onClose={() => {
            setSelectedTerras(null); setSelectedRestaurant(null); setSelectedEvent(null);
          }}
        />
      </div>

      {/* Desktop timeline — load-bearing bottom panel */}
      <div className="hidden md:block">
        <SunTimeline orientation="horizontal" />
      </div>
    </div>
  );
}

/* ─── Selected entity panel (bottom-sheet on mobile) ─ */

interface SelectedProps {
  terras: Terras | null;
  restaurant: Restaurant | null;
  event: Event | null;
  terrasIntensity: number;
  restaurantIntensity: number;
  eventIntensity: number;
  nearbyEvents: Event[];
  onPickEvent: (ev: Event) => void;
  onClose: () => void;
}

function SelectedPanel(props: SelectedProps) {
  const { terras, restaurant, event, nearbyEvents, onPickEvent } = props;
  const active = terras ?? restaurant ?? event;
  if (!active) return null;

  let title: string;
  let subtitle: string;
  let intensity: number;
  let categoryPill: { label: string; tone: 'gold' | 'sky' | 'terra' };
  let detailHref: string | undefined;
  let externalHref: string | undefined;
  let externalLabel = 'Visit website';

  if (terras) {
    title = terras.name;
    subtitle = terras.address;
    intensity = props.terrasIntensity;
    categoryPill = { label: 'Terrace', tone: 'gold' };
    detailHref = `/terrasen/${terras.uuid}`;
    externalHref = terras.url ?? undefined;
  } else if (restaurant) {
    title = restaurant.name;
    subtitle = `${restaurant.cuisine ? restaurant.cuisine + ' · ' : ''}${restaurant.address}`;
    intensity = props.restaurantIntensity;
    categoryPill = { label: restaurant.cuisine ?? 'Restaurant', tone: 'sky' };
    detailHref = `/restaurants/${restaurant.uuid}`;
    externalHref = restaurant.website ?? undefined;
  } else if (event) {
    title = event.title;
    subtitle = event.address;
    intensity = props.eventIntensity;
    categoryPill = { label: 'Event', tone: 'terra' };
    detailHref = `/events/${event.uuid}`;
    externalHref = event.url ?? undefined;
    externalLabel = 'More info';
  } else {
    return null;
  }

  const colour = intensityColor(intensity);

  return (
    <div className="fade-up fixed left-0 right-0 bottom-0 md:absolute md:left-5 md:right-auto md:bottom-5 md:top-auto md:w-[360px] z-30">
      <div
        className="rounded-t-3xl md:rounded-2xl"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-float)',
        }}
      >
        {/* Mobile pull handle */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border)' }} />
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <Pill tone={categoryPill.tone} className="capitalize mb-2">
                {categoryPill.label}
              </Pill>
              <h3 className="font-display font-semibold text-text-1 leading-tight" style={{ fontSize: '1.4rem' }}>
                {title}
              </h3>
              <p className="text-xs text-text-3 mt-1.5">{subtitle}</p>
            </div>
            <button
              onClick={props.onClose}
              className="p-2 rounded-lg shrink-0 -mt-1 -mr-1 transition-colors hover:bg-surface-2 text-text-3 hover:text-text-1"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div
            className="flex items-center gap-4 px-4 py-3.5 rounded-xl mb-4"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
          >
            <span className="font-display tabular-nums shrink-0" style={{
              fontSize: '2.4rem', lineHeight: 1, color: colour, letterSpacing: '-0.03em',
            }}>
              {intensity}<span style={{ fontSize: '1rem' }}>%</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text-1" style={{ fontSize: '0.875rem' }}>
                {intensityLabel(intensity)}
              </p>
              <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: 'var(--color-track)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${intensity}%`, background: `linear-gradient(to right, ${colour}88, ${colour})` }}
                />
              </div>
            </div>
          </div>

          {terras && nearbyEvents.length > 0 && (
            <div className="mb-4">
              <p
                className="mb-2"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-3)',
                }}
              >
                Nearby events
              </p>
              <div className="flex flex-col gap-1.5">
                {nearbyEvents.map((ev) => (
                  <button
                    key={ev.uuid}
                    onClick={() => onPickEvent(ev)}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors"
                    style={{
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <span
                      className="shrink-0 inline-flex items-center justify-center"
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: MARKER.event,
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      ★
                    </span>
                    <span
                      className="text-text-1 truncate flex-1"
                      style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25 }}
                    >
                      {ev.title}
                    </span>
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                      style={{ color: 'var(--color-text-3)' }}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2.5">
            <a
              href={detailHref}
              className="flex-1 text-center text-sm font-semibold px-4 py-2.5 rounded-lg transition-all min-h-[44px] inline-flex items-center justify-center"
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                boxShadow: 'var(--shadow-amber)',
              }}
            >
              View details →
            </a>
            {externalHref && (
              <a
                href={externalHref}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium px-4 py-2.5 rounded-lg transition-colors min-h-[44px] inline-flex items-center"
                style={{
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text-2)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {externalLabel}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
