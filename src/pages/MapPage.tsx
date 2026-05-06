import { useState, useMemo, useRef, useEffect } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import type { MapRef, MarkerEvent } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import type { Map as MapboxMap } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocation } from 'react-router-dom';
import { useSelectedTime } from '../contexts/TimeContext';
import { useWeatherData } from '../hooks/useWeatherData';
import { useTerrasData } from '../hooks/useTerrasData';
import { useRestaurantsData } from '../hooks/useRestaurantsData';
import { useEventsData } from '../hooks/useEventsData';
import { useSunPosition } from '../hooks/useSunPosition';
import { intensityColor } from '../utils/intensity';
import type { Terras, Restaurant, Event } from '../types';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

type LayerFilter = 'terras' | 'restaurants' | 'events' | 'all';

const INITIAL_VIEW = {
  longitude: 3.7174,
  latitude: 51.0543,
  zoom: 14,
  pitch: 45,
  bearing: -17,
};

/* Marker shape colors – all from the palette */
const MARKER_COLORS = {
  terras:     '#F5AC32', /* gold  */
  restaurant: '#6DC2E8', /* sky   */
  event:      '#C4502A', /* terra */
};

const TOTAL_MINUTES = 48 * 60 - 1;

function skyIntensity(hour: number): number {
  if (hour < 5.5 || hour > 21.5) return 0;
  const peak = 13;
  const halfSpan = 8;
  return Math.max(0, Math.round(100 - ((hour - peak) / halfSpan) ** 2 * 100));
}

function SunTimeline() {
  const { selectedTime, setSelectedTime } = useSelectedTime();
  const { data: weather } = useWeatherData();

  const todayMidnight = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const selected = new Date(selectedTime);
  const selectedMinutes = Math.round(
    Math.min(TOTAL_MINUTES, Math.max(0, (selected.getTime() - todayMidnight) / 60000))
  );

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const minutes = Number(e.target.value);
    setSelectedTime(new Date(todayMidnight + minutes * 60000).toISOString());
  }

  const cloudFactor = (100 - (weather?.cloudCover ?? 0)) / 100;
  const gradient = useMemo(() => {
    const stops: string[] = [];
    for (let m = 0; m <= TOTAL_MINUTES; m += 60) {
      const h = (m / 60) % 24;
      const sky = skyIntensity(h) * cloudFactor;
      const pct = ((m / TOTAL_MINUTES) * 100).toFixed(1);
      const color = sky > 60 ? '#F5AC32' : sky > 30 ? '#F5DFA0' : sky > 5 ? '#D4C4A8' : '#2A2018';
      stops.push(`${color} ${pct}%`);
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
  }, [cloudFactor]);

  const selectedDate = new Date(todayMidnight + selectedMinutes * 60000);
  const displayTime = selectedDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const displayDay = selectedMinutes < 1440 ? 'Today' : 'Tomorrow';

  const marks = useMemo(() => {
    const result: { label: string; pct: number; isDayBoundary: boolean }[] = [];
    for (let m = 0; m <= TOTAL_MINUTES; m += 180) {
      const h = (m / 60) % 24;
      const day = m < 1440 ? 0 : 1;
      if (m === 0 || m === 1440 || m % 360 === 0) {
        result.push({
          label: day === 0 && m === 0 ? 'Today' : day === 1 && m === 1440 ? 'Tomorrow' : `${String(h).padStart(2, '0')}:00`,
          pct: (m / TOTAL_MINUTES) * 100,
          isDayBoundary: m === 0 || m === 1440,
        });
      } else {
        result.push({
          label: `${String(h).padStart(2, '0')}:00`,
          pct: (m / TOTAL_MINUTES) * 100,
          isDayBoundary: false,
        });
      }
    }
    return result;
  }, []);

  const thumbPct = (selectedMinutes / TOTAL_MINUTES) * 100;

  return (
    <div className="shrink-0 px-6 py-4" style={{ background: 'var(--color-sidebar)', borderTop: '1px solid var(--color-sidebar-border)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-label" style={{ color: 'var(--color-sidebar-accent)' }}>
          Sun Timeline
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--color-sidebar-accent)' }}>{displayDay}</span>
          <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--color-sidebar-brand)' }}>{displayTime}</span>
        </div>
      </div>

      <div className="relative">
        <div
          className="absolute inset-y-0 left-0 right-0 my-auto rounded-full pointer-events-none"
          style={{ height: 8, background: gradient, top: '50%', transform: 'translateY(-50%)', opacity: 0.7 }}
        />
        <div
          className="absolute my-auto rounded-l-full pointer-events-none"
          style={{
            height: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            left: 0,
            width: `${thumbPct}%`,
            background: 'linear-gradient(to right, #7A5010, #E5870A)',
            opacity: 0.9,
          }}
        />
        <input
          type="range"
          min={0}
          max={TOTAL_MINUTES}
          step={15}
          value={selectedMinutes}
          onChange={onChange}
          className="sun-slider relative"
          style={{ background: 'transparent' }}
        />
      </div>

      <div className="relative mt-2" style={{ height: 16 }}>
        {marks.map((m) => (
          <span
            key={m.pct}
            className="absolute text-center pointer-events-none"
            style={{
              left: `${m.pct}%`,
              transform: 'translateX(-50%)',
              fontSize: m.isDayBoundary ? 10 : 9,
              fontWeight: m.isDayBoundary ? 700 : 500,
              color: m.isDayBoundary ? 'var(--color-sidebar-brand)' : 'var(--color-sidebar-accent)',
              lineHeight: 1,
            }}
          >
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function SunTimelineVertical() {
  const { selectedTime, setSelectedTime } = useSelectedTime();
  const { data: weather } = useWeatherData();

  const todayMidnight = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const selected = new Date(selectedTime);
  const selectedMinutes = Math.round(
    Math.min(TOTAL_MINUTES, Math.max(0, (selected.getTime() - todayMidnight) / 60000))
  );

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const minutes = Number(e.target.value);
    setSelectedTime(new Date(todayMidnight + minutes * 60000).toISOString());
  }

  const cloudFactor = (100 - (weather?.cloudCover ?? 0)) / 100;
  const gradient = useMemo(() => {
    const stops: string[] = [];
    for (let m = 0; m <= TOTAL_MINUTES; m += 60) {
      const h = (m / 60) % 24;
      const sky = skyIntensity(h) * cloudFactor;
      const pct = ((m / TOTAL_MINUTES) * 100).toFixed(1);
      const color = sky > 60 ? '#F5AC32' : sky > 30 ? '#F5DFA0' : sky > 5 ? '#D4C4A8' : '#2A2018';
      stops.push(`${color} ${pct}%`);
    }
    return `linear-gradient(to bottom, ${stops.join(', ')})`;
  }, [cloudFactor]);

  const marks = useMemo(() => {
    const result: { label: string; pct: number; isDayBoundary: boolean }[] = [];
    for (let m = 0; m <= TOTAL_MINUTES; m += 180) {
      const h = (m / 60) % 24;
      const day = m < 1440 ? 0 : 1;
      if (m === 0 || m === 1440 || m % 360 === 0) {
        result.push({
          label: day === 0 && m === 0 ? 'Today' : day === 1 && m === 1440 ? 'Tmrw' : `${String(h).padStart(2, '0')}:00`,
          pct: (m / TOTAL_MINUTES) * 100,
          isDayBoundary: m === 0 || m === 1440,
        });
      } else {
        result.push({
          label: `${String(h).padStart(2, '0')}:00`,
          pct: (m / TOTAL_MINUTES) * 100,
          isDayBoundary: false,
        });
      }
    }
    return result;
  }, []);

  const thumbPct = (selectedMinutes / TOTAL_MINUTES) * 100;

  return (
    <div className="flex flex-1 min-h-0 px-2 py-3 gap-1 select-none" style={{ background: 'var(--color-sidebar)' }}>
      <div className="relative flex justify-center w-7 flex-shrink-0 self-stretch">
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 6, top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', background: gradient, opacity: 0.7 }}
        />
        <div
          className="absolute rounded-t-full pointer-events-none"
          style={{
            width: 6, top: 0, height: `${thumbPct}%`,
            left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(to bottom, #7A5010, #E5870A)', opacity: 0.9,
          }}
        />
        <input
          type="range"
          min={0}
          max={TOTAL_MINUTES}
          step={15}
          value={selectedMinutes}
          onChange={onChange}
          className="sun-slider absolute"
          style={{
            height: 28,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%) rotate(-90deg)',
            background: 'transparent', cursor: 'pointer',
            width: 'calc(100vh - 80px)',
          }}
        />
      </div>

      <div className="relative flex-1 self-stretch">
        {marks.map((m) => (
          <span
            key={m.pct}
            className="absolute pointer-events-none leading-none left-1"
            style={{
              top: `${m.pct}%`,
              transform: 'translateY(-50%)',
              fontSize: m.isDayBoundary ? 9 : 8,
              fontWeight: m.isDayBoundary ? 700 : 500,
              color: m.isDayBoundary ? 'var(--color-sidebar-brand)' : 'var(--color-sidebar-accent)',
            }}
          >
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div
      className="rounded-2xl p-4 w-44"
      style={{ background: 'var(--color-map-overlay)', border: '1px solid var(--color-map-overlay-border)', backdropFilter: 'blur(12px)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-label mb-3" style={{ color: 'var(--color-sidebar-brand)' }}>
        Sun Intensity
      </p>
      <div
        className="h-2 rounded-full mb-2"
        style={{ background: 'linear-gradient(to right, #3A2A18, #F5DFA0, #E5870A)' }}
      />
      <div className="flex justify-between text-xs mb-4" style={{ color: 'var(--color-sidebar-accent)' }}>
        <span>Shade</span>
        <span>Full sun</span>
      </div>
      <div className="space-y-2 mb-4">
        {[
          { color: '#E5870A', label: '70%+  Full sun' },
          { color: '#F5AC32', label: '40%+  Partial' },
          { color: '#9B8570', label: 'Below 40%' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-sidebar-text)' }}>{label}</span>
          </div>
        ))}
      </div>
      <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
        <p className="text-xs font-semibold uppercase tracking-label mb-2" style={{ color: 'var(--color-sidebar-brand)' }}>
          Markers
        </p>
        <div className="space-y-1.5">
          {[
            { icon: '☀', color: MARKER_COLORS.terras,     label: 'Terraces' },
            { icon: '🍴', color: MARKER_COLORS.restaurant, label: 'Restaurants' },
            { icon: '★',  color: MARKER_COLORS.event,      label: 'Events' },
          ].map(({ icon, color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span style={{ fontSize: 12, color, lineHeight: 1 }}>{icon}</span>
              <span className="text-xs font-medium" style={{ color: 'var(--color-sidebar-text)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { focusId?: string; type?: string } | null;
    if (!state?.focusId || !mapLoaded) return;
    const { focusId, type } = state;

    let item: { location: { coordinates: [number, number] } } | undefined;
    if (type === 'terras') {
      const found = terrasen.find(t => t.uuid === focusId);
      if (found) { setSelectedTerras(found); item = found; }
    } else if (type === 'restaurant') {
      const found = restaurants.find(r => r.uuid === focusId);
      if (found) { setSelectedRestaurant(found); item = found; }
    } else if (type === 'event') {
      const found = events.find(e => e.uuid === focusId);
      if (found) { setSelectedEvent(found); item = found; }
    }

    if (item && mapRef.current) {
      const [lng, lat] = item.location.coordinates;
      mapRef.current.flyTo({ center: [lng, lat], zoom: 17, duration: 1200 });
    }
  }, [mapLoaded, location.state, terrasen, restaurants, events]);

  useEffect(() => {
    if (!mapLoaded || !sunPosition || !mapRef.current) return;

    const map = mapRef.current.getMap() as MapboxMap;
    const compassDeg = ((sunPosition.azimuth * 180) / Math.PI + 180) % 360;
    const altitudeDeg = (sunPosition.altitude * 180) / Math.PI;
    const polarDeg = 90 - altitudeDeg;

    if (sunPosition.altitude > 0) {
      map.setLights([
        {
          id: 'sun',
          type: 'directional',
          properties: {
            direction: [compassDeg, polarDeg],
            color: 'white',
            intensity: Math.min(1, 0.4 + (altitudeDeg / 90) * 0.8),
            'cast-shadows': true,
            'shadow-intensity': 1,
          },
        },
        {
          id: 'ambient',
          type: 'ambient',
          properties: { color: 'white', intensity: 0.2 },
        },
      ]);
    } else {
      map.setLights([
        { id: 'ambient', type: 'ambient', properties: { color: '#1a2744', intensity: 0.4 } },
      ]);
    }
  }, [sunPosition, mapLoaded]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
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
          {/* Terrace markers — gold sun */}
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <svg width="26" height="26" viewBox="0 0 26 26" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }}>
                    {[0, 60, 120, 180, 240, 300].map(deg => {
                      const r = (deg * Math.PI) / 180;
                      return <line key={deg} x1={13 + 7.5 * Math.cos(r)} y1={13 + 7.5 * Math.sin(r)} x2={13 + 11 * Math.cos(r)} y2={13 + 11 * Math.sin(r)} stroke={MARKER_COLORS.terras} strokeWidth="1.8" strokeLinecap="round" />;
                    })}
                    <circle cx="13" cy="13" r="5.5" fill={MARKER_COLORS.terras} stroke="white" strokeWidth="1.5" />
                  </svg>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.65)', padding: '2px 6px', borderRadius: 8, whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.4 }}>
                    {t.name}
                  </span>
                </div>
              </Marker>
            ))}

          {selectedTerras && (
            <Popup
              longitude={selectedTerras.location.coordinates[0]}
              latitude={selectedTerras.location.coordinates[1]}
              anchor="bottom"
              onClose={() => setSelectedTerras(null)}
              closeOnClick={false}
              offset={10}
            >
              <div style={{ padding: '12px 14px', minWidth: 180 }}>
                <p style={{ fontWeight: 700, color: 'var(--color-sidebar-text, #fff)', marginBottom: 3, fontSize: 14, lineHeight: 1.3 }}>
                  {selectedTerras.name}
                </p>
                <p style={{ color: 'var(--color-sidebar-muted)', fontSize: 11, marginBottom: 8, lineHeight: 1.4 }}>
                  {selectedTerras.address}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: selectedTerras.url ? 10 : 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--color-sidebar-muted)' }}>Sun exposure</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: intensityColor(selectedTerras.intensity), background: `${intensityColor(selectedTerras.intensity)}22`, padding: '2px 8px', borderRadius: 6 }}>
                    ☀ {selectedTerras.intensity}%
                  </span>
                </div>
                {selectedTerras.url && (
                  <a
                    href={selectedTerras.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--color-sidebar-brand)', background: 'rgba(229,135,10,0.15)', border: '1px solid rgba(229,135,10,0.3)', borderRadius: 6, padding: '5px 0', textDecoration: 'none' }}
                  >
                    Visit website →
                  </a>
                )}
              </div>
            </Popup>
          )}

          {/* Restaurant markers — sky blue fork & knife badge */}
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <svg width="22" height="24" viewBox="0 0 22 24" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }}>
                    <rect x="0.75" y="0.75" width="20.5" height="22.5" rx="6" fill={MARKER_COLORS.restaurant} stroke="white" strokeWidth="1.5" />
                    {/* fork */}
                    <line x1="7.5" y1="5" x2="7.5" y2="9" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
                    <line x1="10" y1="5" x2="10" y2="9" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
                    <path d="M7.5 9 Q8.75 11 8.75 12.5 L8.75 19" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" />
                    {/* knife */}
                    <path d="M14.5 5 L14.5 8.5 Q15.5 9.5 14.5 10.5 L14.5 19" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" />
                  </svg>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.65)', padding: '2px 6px', borderRadius: 8, whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.4 }}>
                    {r.name}
                  </span>
                </div>
              </Marker>
            ))}

          {selectedRestaurant && (
            <Popup
              longitude={selectedRestaurant.location.coordinates[0]}
              latitude={selectedRestaurant.location.coordinates[1]}
              anchor="bottom"
              onClose={() => setSelectedRestaurant(null)}
              closeOnClick={false}
              offset={10}
            >
              <div style={{ padding: '12px 14px', minWidth: 180 }}>
                <p style={{ fontWeight: 700, color: 'var(--color-sidebar-text, #fff)', marginBottom: 2, fontSize: 14, lineHeight: 1.3 }}>
                  {selectedRestaurant.name}
                </p>
                <p style={{ color: MARKER_COLORS.restaurant, fontSize: 11, fontWeight: 600, marginBottom: 3, textTransform: 'capitalize' }}>
                  {selectedRestaurant.cuisine}
                </p>
                <p style={{ color: 'var(--color-sidebar-muted)', fontSize: 11, marginBottom: 8, lineHeight: 1.4 }}>
                  {selectedRestaurant.address}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: selectedRestaurant.website ? 10 : 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--color-sidebar-muted)' }}>Sun exposure</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: intensityColor(selectedRestaurant.intensity), background: `${intensityColor(selectedRestaurant.intensity)}22`, padding: '2px 8px', borderRadius: 6 }}>
                    ☀ {selectedRestaurant.intensity}%
                  </span>
                </div>
                {selectedRestaurant.website && (
                  <a
                    href={selectedRestaurant.website}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 600, color: MARKER_COLORS.restaurant, background: `${MARKER_COLORS.restaurant}22`, border: `1px solid ${MARKER_COLORS.restaurant}44`, borderRadius: 6, padding: '5px 0', textDecoration: 'none' }}
                  >
                    Visit website →
                  </a>
                )}
              </div>
            </Popup>
          )}

          {/* Event markers — terra red star */}
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }}>
                    <polygon
                      points="12,2 14.4,8.8 21.5,9 16.3,13.6 18.4,20.5 12,16.9 5.6,20.5 7.7,13.6 2.5,9 9.6,8.8"
                      fill={MARKER_COLORS.event}
                      stroke="white"
                      strokeWidth="1.3"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.65)', padding: '2px 6px', borderRadius: 8, whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.4 }}>
                    {ev.title}
                  </span>
                </div>
              </Marker>
            ))}

          {selectedEvent && (
            <Popup
              longitude={selectedEvent.location.coordinates[0]}
              latitude={selectedEvent.location.coordinates[1]}
              anchor="bottom"
              onClose={() => setSelectedEvent(null)}
              closeOnClick={false}
              offset={10}
            >
              <div style={{ padding: '12px 14px', minWidth: 180 }}>
                <p style={{ fontWeight: 700, color: 'var(--color-sidebar-text, #fff)', marginBottom: 3, fontSize: 14, lineHeight: 1.3 }}>
                  {selectedEvent.title}
                </p>
                <p style={{ color: 'var(--color-sidebar-muted)', fontSize: 11, marginBottom: 8, lineHeight: 1.4 }}>
                  {selectedEvent.address}
                </p>
                {selectedEvent.intensity != null && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: selectedEvent.url ? 10 : 0 }}>
                    <span style={{ fontSize: 11, color: 'var(--color-sidebar-muted)' }}>Sun exposure</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: intensityColor(selectedEvent.intensity), background: `${intensityColor(selectedEvent.intensity)}22`, padding: '2px 8px', borderRadius: 6 }}>
                      ☀ {selectedEvent.intensity}%
                    </span>
                  </div>
                )}
                {selectedEvent.url && (
                  <a
                    href={selectedEvent.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 600, color: MARKER_COLORS.event, background: `${MARKER_COLORS.event}22`, border: `1px solid ${MARKER_COLORS.event}44`, borderRadius: 6, padding: '5px 0', textDecoration: 'none' }}
                  >
                    More info →
                  </a>
                )}
              </div>
            </Popup>
          )}
        </Map>

        {/* Legend — desktop right */}
        <div className="absolute top-4 right-4 z-10 hidden md:block fade-up fade-up-delay-1">
          <Legend />
        </div>

        {/* Layer toggle — bottom left */}
        <div
          className="absolute bottom-4 left-4 z-10 flex rounded-xl overflow-hidden"
          style={{ background: 'var(--color-map-overlay)', border: '1px solid var(--color-map-overlay-border)', backdropFilter: 'blur(12px)' }}
        >
          {(['all', 'terras', 'restaurants', 'events'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setLayerFilter(f)}
              style={{
                padding: '8px 10px',
                fontSize: 11,
                fontWeight: layerFilter === f ? 700 : 500,
                color: layerFilter === f ? 'var(--color-sidebar-brand)' : 'var(--color-sidebar-text)',
                background: layerFilter === f ? 'rgba(229,135,10,0.2)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                textTransform: 'capitalize',
                minHeight: 44,
              }}
            >
              {f === 'all' ? 'All' : f === 'terras' ? 'Terraces' : f === 'restaurants' ? 'Restaurants' : 'Events'}
            </button>
          ))}
        </div>

        {/* Mobile timeline toggle */}
        <button
          className="md:hidden absolute bottom-4 right-4 z-20 w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #E5870A, #C46010)', color: '#FFF', boxShadow: 'var(--shadow-amber)' }}
          onClick={() => setTimelineOpen(true)}
          aria-label="Open sun timeline"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>

        {/* Mobile timeline overlay */}
        {timelineOpen && (
          <div
            className="md:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(13,9,5,0.5)', backdropFilter: 'blur(2px)' }}
            onClick={() => setTimelineOpen(false)}
          />
        )}
        <div
          className={`md:hidden fixed inset-y-0 right-0 z-50 w-28 flex flex-col transition-transform duration-300 ease-in-out ${
            timelineOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ background: 'var(--color-sidebar)', borderLeft: '1px solid var(--color-sidebar-border)', boxShadow: 'var(--shadow-float)' }}
        >
          <div className="flex justify-end px-2 pt-2">
            <button
              onClick={() => setTimelineOpen(false)}
              className="p-2 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              style={{ color: 'var(--color-sidebar-muted)' }}
              aria-label="Close timeline"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <SunTimelineVertical />
        </div>
      </div>

      {/* Timeline bar — desktop */}
      <div className="hidden md:block">
        <SunTimeline />
      </div>
    </div>
  );
}
