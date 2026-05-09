import { useState, useRef, useEffect } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import type { MapRef, MarkerEvent } from 'react-map-gl/mapbox';
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
import { intensityColor, intensityLabel } from '../utils/intensity';
import AtmosphericLighting from '../components/AtmosphericLighting';
import SunTimeline from '../components/SunTimeline';
import LiveStatePanel from '../components/map/LiveStatePanel';
import SunniestNowPanel from '../components/map/SunniestNowPanel';
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

const MARKER = {
  terras:     '#E5870A',
  restaurant: '#5C8FA8',
  event:      '#FF6B4A',
};

/* ─── Markers ─────────────────────────────────────── */

function TerrasMarkerSvg() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" style={{ filter: 'drop-shadow(0 2px 4px rgba(26,22,17,0.55))' }}>
      <defs>
        <radialGradient id="t-sun" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFD075" />
          <stop offset="100%" stopColor="#E5870A" />
        </radialGradient>
      </defs>
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const r = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={14 + 8 * Math.cos(r)}  y1={14 + 8 * Math.sin(r)}
            x2={14 + 12 * Math.cos(r)} y2={14 + 12 * Math.sin(r)}
            stroke="#FFB554" strokeWidth="2" strokeLinecap="round"
          />
        );
      })}
      <circle cx="14" cy="14" r="6" fill="url(#t-sun)" stroke="white" strokeWidth="1.6" />
    </svg>
  );
}

function RestaurantMarkerSvg() {
  return (
    <svg width="24" height="26" viewBox="0 0 24 26" style={{ filter: 'drop-shadow(0 2px 4px rgba(26,22,17,0.55))' }}>
      <rect x="1" y="1" width="22" height="24" rx="7" fill={MARKER.restaurant} stroke="white" strokeWidth="1.6" />
      <line x1="8.5" y1="6" x2="8.5" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11"  y1="6" x2="11"  y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8.5 10 Q9.75 12 9.75 13.5 L9.75 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M15.5 6 L15.5 9.5 Q16.5 10.5 15.5 11.5 L15.5 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function EventMarkerSvg() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" style={{ filter: 'drop-shadow(0 2px 4px rgba(26,22,17,0.55))' }}>
      <polygon
        points="13,2 15.6,9.5 23.5,9.7 17.3,14.7 19.5,22 13,17.8 6.5,22 8.7,14.7 2.5,9.7 10.4,9.5"
        fill={MARKER.event} stroke="white" strokeWidth="1.4" strokeLinejoin="round"
      />
    </svg>
  );
}

function MarkerLabel({ children }: { children: string }) {
  return (
    <span
      className="font-medium truncate max-w-[110px] text-text-1"
      style={{
        marginTop: 4,
        fontSize: 10.5,
        fontWeight: 600,
        background: 'var(--color-map-overlay)',
        border: '1px solid var(--color-map-overlay-border)',
        padding: '2px 7px',
        borderRadius: 999,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        lineHeight: 1.4,
        letterSpacing: '0.01em',
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
      }}
    >
      {children}
    </span>
  );
}

/* ─── Map popup ───────────────────────────────────── */

interface PopupBodyProps {
  title: string;
  subtitle?: string;
  intensity: number;
  ctaHref?: string;
  ctaLabel?: string;
}

function PopupBody({ title, subtitle, intensity, ctaHref, ctaLabel = 'Visit website' }: PopupBodyProps) {
  const colour = intensityColor(intensity);
  return (
    <div style={{ padding: '14px 16px 14px', minWidth: 220 }}>
      <p className="font-display font-semibold text-text-1" style={{ fontSize: 16, lineHeight: 1.2, marginBottom: 2 }}>
        {title}
      </p>
      {subtitle && (
        <p className="text-text-3" style={{ fontSize: 11.5, marginBottom: 12, lineHeight: 1.4 }}>
          {subtitle}
        </p>
      )}
      <div
        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl mb-3"
        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
      >
        <div>
          <p className="eyebrow" style={{ fontSize: 9 }}>Sun now</p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-1)' }}>
            {intensityLabel(intensity)}
          </p>
        </div>
        <span className="font-display tabular-nums" style={{
          fontSize: 24, lineHeight: 1, color: colour, letterSpacing: '-0.02em',
        }}>
          {intensity}<span style={{ fontSize: 13 }}>%</span>
        </span>
      </div>
      {ctaHref && (
        <a
          href={ctaHref}
          target="_blank"
          rel="noreferrer"
          className="block text-center text-xs font-semibold rounded-lg transition-colors"
          style={{
            color: 'var(--color-on-primary)',
            background: 'var(--color-primary)',
            padding: '8px 0',
            textDecoration: 'none',
          }}
        >
          {ctaLabel} →
        </a>
      )}
    </div>
  );
}

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
  const { data: terrasen = [] } = useTerrasData();
  const { data: restaurants = [] } = useRestaurantsData();
  const { data: events = [] } = useEventsData();
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

  const focusTerras = (uuid: string) => {
    const t = terrasen.find((x) => x.uuid === uuid);
    if (!t) return;
    setSelectedTerras(t);
    setSelectedRestaurant(null);
    setSelectedEvent(null);
    if (mapRef.current) {
      const [lng, lat] = t.location.coordinates;
      mapRef.current.flyTo({ center: [lng, lat], zoom: 17, duration: 1000 });
    }
  };

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
          onLoad={() => {
            const map = mapRef.current?.getMap() as MapboxMap;
            map.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
            setMapLoaded(true);
          }}
          maxBounds={[3.65, 50.99, 3.82, 51.12]}
          minZoom={12}
        >
          <AtmosphericLighting mapRef={mapRef} sunPosition={sunPosition} mapLoaded={mapLoaded} />

          {/* Terraces */}
          {(layerFilter === 'terras' || layerFilter === 'all') &&
            terrasen.map((t) => (
              <Marker
                key={t.uuid}
                longitude={t.location.coordinates[0]}
                latitude={t.location.coordinates[1]}
                anchor="center"
                onClick={(e: MarkerEvent<MouseEvent>) => {
                  e.originalEvent.stopPropagation();
                  setSelectedTerras(t);
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                  <TerrasMarkerSvg />
                  <MarkerLabel>{t.name}</MarkerLabel>
                </div>
              </Marker>
            ))}

          {selectedTerras && (
            <Popup
              longitude={selectedTerras.location.coordinates[0]}
              latitude={selectedTerras.location.coordinates[1]}
              anchor="bottom"
              offset={12}
              onClose={() => setSelectedTerras(null)}
              closeOnClick={false}
            >
              <PopupBody
                title={selectedTerras.name}
                subtitle={selectedTerras.address}
                intensity={terrasSunData.intensity}
                ctaHref={selectedTerras.url}
              />
            </Popup>
          )}

          {/* Restaurants */}
          {(layerFilter === 'restaurants' || layerFilter === 'all') &&
            restaurants.map((r) => (
              <Marker
                key={r.uuid}
                longitude={r.location.coordinates[0]}
                latitude={r.location.coordinates[1]}
                anchor="center"
                onClick={(e: MarkerEvent<MouseEvent>) => {
                  e.originalEvent.stopPropagation();
                  setSelectedRestaurant(r);
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                  <RestaurantMarkerSvg />
                  <MarkerLabel>{r.name}</MarkerLabel>
                </div>
              </Marker>
            ))}

          {selectedRestaurant && (
            <Popup
              longitude={selectedRestaurant.location.coordinates[0]}
              latitude={selectedRestaurant.location.coordinates[1]}
              anchor="bottom"
              offset={12}
              onClose={() => setSelectedRestaurant(null)}
              closeOnClick={false}
            >
              <PopupBody
                title={selectedRestaurant.name}
                subtitle={`${selectedRestaurant.cuisine ? selectedRestaurant.cuisine + ' · ' : ''}${selectedRestaurant.address}`}
                intensity={restaurantSunData.intensity}
                ctaHref={selectedRestaurant.website}
              />
            </Popup>
          )}

          {/* Events */}
          {(layerFilter === 'events' || layerFilter === 'all') &&
            events.map((ev) => (
              <Marker
                key={ev.uuid}
                longitude={ev.location.coordinates[0]}
                latitude={ev.location.coordinates[1]}
                anchor="center"
                onClick={(e: MarkerEvent<MouseEvent>) => {
                  e.originalEvent.stopPropagation();
                  setSelectedEvent(ev);
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                  <EventMarkerSvg />
                  <MarkerLabel>{ev.title}</MarkerLabel>
                </div>
              </Marker>
            ))}

          {selectedEvent && (
            <Popup
              longitude={selectedEvent.location.coordinates[0]}
              latitude={selectedEvent.location.coordinates[1]}
              anchor="bottom"
              offset={12}
              onClose={() => setSelectedEvent(null)}
              closeOnClick={false}
            >
              <PopupBody
                title={selectedEvent.title}
                subtitle={selectedEvent.address}
                intensity={eventSunData.intensity}
                ctaHref={selectedEvent.url}
                ctaLabel="More information"
              />
            </Popup>
          )}
        </Map>

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
  onClose: () => void;
}

function SelectedPanel(props: SelectedProps) {
  const { terras, restaurant, event } = props;
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
