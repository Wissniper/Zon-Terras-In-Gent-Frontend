import { useEffect, useMemo, useRef, useState } from 'react';
import { Source, Layer, useMap } from 'react-map-gl/mapbox';
import type { LayerProps } from 'react-map-gl/mapbox';
import type { Map as MapboxMap, GeoJSONSource, MapMouseEvent } from 'mapbox-gl';
import type { Terras, Restaurant, Event } from '../../types';

type Category = 'terras' | 'restaurant' | 'event';
type LayerFilter = Category | 'restaurants' | 'events' | 'all';

interface Props {
  visible: boolean;
  terrasen: Terras[];
  restaurants: Restaurant[];
  events: Event[];
  layerFilter: LayerFilter;
  selectedUuid: string | null;
  onSelectTerras: (t: Terras) => void;
  onSelectRestaurant: (r: Restaurant) => void;
  onSelectEvent: (ev: Event) => void;
}

const SOURCE_ID = 'markers-src';
const LAYER_CLUSTER = 'markers-clusters';
const LAYER_CLUSTER_COUNT = 'markers-cluster-count';
const LAYER_POINT = 'markers-unclustered';
const LAYER_POINT_HALO = 'markers-unclustered-halo';
const LAYER_LABEL = 'markers-label';

const COLORS: Record<Category, string> = {
  terras: '#E5870A',
  restaurant: '#5C8FA8',
  event: '#FF6B4A',
};

const ICON_IDS: Record<Category, string> = {
  terras: 'icon-terras',
  restaurant: 'icon-restaurant',
  event: 'icon-event',
};

function addDotIcon(map: MapboxMap, id: string, color: string, sizeLogical = 14) {
  if (map.hasImage(id)) return;
  const pixelRatio = 2;
  const size = sizeLogical * pixelRatio;
  const pad = pixelRatio * 2;
  const total = size + pad * 2;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = total;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // soft drop-shadow
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.arc(total / 2, total / 2 + pixelRatio, size / 2, 0, Math.PI * 2);
  ctx.fill();
  // white ring
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(total / 2, total / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  // colored core
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(total / 2, total / 2, size / 2 - pixelRatio * 1.5, 0, Math.PI * 2);
  ctx.fill();

  const imageData = ctx.getImageData(0, 0, total, total);
  try { map.addImage(id, imageData, { pixelRatio }); }
  catch (err) { console.warn('[MapMarkersLayer] addImage failed', id, err); }
}

interface Bounds { n: number; s: number; e: number; w: number }

function inBounds(lng: number, lat: number, b: Bounds | null): boolean {
  if (!b) return true;
  return lng >= b.w && lng <= b.e && lat >= b.s && lat <= b.n;
}

interface PointFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: { uuid: string; name: string; category: Category };
}

function buildFeatures(
  terrasen: Terras[],
  restaurants: Restaurant[],
  events: Event[],
  layerFilter: LayerFilter,
  bounds: Bounds | null,
): PointFeature[] {
  const out: PointFeature[] = [];
  if (layerFilter === 'terras' || layerFilter === 'all') {
    for (const t of terrasen) {
      const c = t.location?.coordinates;
      if (!c || c.length < 2) continue;
      if (!inBounds(c[0], c[1], bounds)) continue;
      out.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c[0], c[1]] },
        properties: { uuid: t.uuid, name: t.name, category: 'terras' },
      });
    }
  }
  if (layerFilter === 'restaurants' || layerFilter === 'all') {
    for (const r of restaurants) {
      const c = r.location?.coordinates;
      if (!c || c.length < 2) continue;
      if (!inBounds(c[0], c[1], bounds)) continue;
      out.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c[0], c[1]] },
        properties: { uuid: r.uuid, name: r.name, category: 'restaurant' },
      });
    }
  }
  if (layerFilter === 'events' || layerFilter === 'all') {
    for (const ev of events) {
      const c = ev.location?.coordinates;
      if (!c || c.length < 2) continue;
      if (!inBounds(c[0], c[1], bounds)) continue;
      out.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c[0], c[1]] },
        properties: { uuid: ev.uuid, name: ev.title, category: 'event' },
      });
    }
  }
  return out;
}

const clusterCircleLayer = (id: string): LayerProps => ({
  id,
  type: 'circle',
  source: SOURCE_ID,
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': [
      'step', ['get', 'point_count'],
      '#FFB554', 5,
      '#ED8A1F', 25,
      '#B45F0A',
    ],
    'circle-radius': [
      'step', ['get', 'point_count'],
      14, 5,
      18, 25,
      24,
    ],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 0.94,
  },
});

const clusterCountLayer = (id: string): LayerProps => ({
  id,
  type: 'symbol',
  source: SOURCE_ID,
  filter: ['has', 'point_count'],
  layout: {
    'text-field': ['get', 'point_count_abbreviated'],
    'text-size': 12,
    'text-allow-overlap': true,
    'text-ignore-placement': true,
  },
  paint: { 'text-color': '#ffffff' },
});

const haloLayer = (id: string, selectedUuid: string | null): LayerProps => ({
  id,
  type: 'circle',
  source: SOURCE_ID,
  filter: [
    'all',
    ['!', ['has', 'point_count']],
    ['==', ['get', 'uuid'], selectedUuid ?? '__none__'],
  ],
  paint: {
    'circle-radius': 18,
    'circle-color': '#FFD075',
    'circle-opacity': 0.45,
    'circle-blur': 0.6,
  },
});

const pointLayer = (id: string): LayerProps => ({
  id,
  type: 'symbol',
  source: SOURCE_ID,
  filter: ['!', ['has', 'point_count']],
  layout: {
    'icon-image': [
      'match', ['get', 'category'],
      'terras', ICON_IDS.terras,
      'restaurant', ICON_IDS.restaurant,
      'event', ICON_IDS.event,
      ICON_IDS.terras,
    ],
    'icon-size': 1,
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
  },
});

const labelLayer = (id: string): LayerProps => ({
  id,
  type: 'symbol',
  source: SOURCE_ID,
  filter: ['!', ['has', 'point_count']],
  layout: {
    'text-field': ['get', 'name'],
    'text-size': 11,
    'text-offset': [0, 1.3],
    'text-anchor': 'top',
    'text-optional': true,
    'text-allow-overlap': false,
  },
  paint: {
    'text-color': '#2A1F0F',
    'text-halo-color': '#ffffff',
    'text-halo-width': 1.4,
    'text-opacity': [
      'interpolate', ['linear'], ['zoom'],
      16.6, 0,
      17.4, 1,
    ],
  },
});

/**
 * Renders all map markers as a clustered Mapbox **symbol layer** — every
 * point + cluster is drawn on the map's WebGL canvas in a single GPU pass.
 *
 * Implementation uses react-map-gl's declarative <Source> / <Layer> wrappers
 * which internally re-attach to Mapbox after every `style.load` event. That's
 * the canonical way to ensure runtime layers survive basemap config swaps,
 * style edits, and any other Mapbox lifecycle event — there is no manual
 * setup/teardown path that can race with the map's internal state.
 *
 * Click handling is a single map-level listener that uses `queryRenderedFeatures`
 * — also lifecycle-safe, since the map instance itself is stable.
 */
export default function MapMarkersLayer({
  visible,
  terrasen, restaurants, events, layerFilter,
  selectedUuid,
  onSelectTerras, onSelectRestaurant, onSelectEvent,
}: Props) {
  const { current: mapRef } = useMap();
  const [bounds, setBounds] = useState<Bounds | null>(null);

  // Stash the latest props so the single click-listener (mounted once) can
  // reach them without rebinding on every render.
  const handlersRef = useRef({ terrasen, restaurants, events, onSelectTerras, onSelectRestaurant, onSelectEvent });
  useEffect(() => {
    handlersRef.current = { terrasen, restaurants, events, onSelectTerras, onSelectRestaurant, onSelectEvent };
  });

  // Register marker icons. Reapply on every style.load so they survive
  // basemap config swaps that wipe the image registry.
  useEffect(() => {
    if (!mapRef) return;
    const map = mapRef.getMap() as MapboxMap;
    const apply = () => {
      for (const cat of Object.keys(ICON_IDS) as Category[]) {
        addDotIcon(map, ICON_IDS[cat], COLORS[cat]);
      }
    };
    if (map.isStyleLoaded()) apply();
    map.on('style.load', apply);
    return () => { map.off('style.load', apply); };
  }, [mapRef]);

  // Track the viewport (12% padding) so we only feed the GeoJSON source the
  // points that could plausibly be visible. Debounced 150ms so panning
  // doesn't trigger a supercluster rebuild on every frame.
  useEffect(() => {
    if (!mapRef) return;
    const map = mapRef.getMap() as MapboxMap;

    const compute = (): Bounds | null => {
      const b = map.getBounds();
      if (!b) return null;
      const ne = b.getNorthEast();
      const sw = b.getSouthWest();
      const latPad = (ne.lat - sw.lat) * 0.12;
      const lngPad = (ne.lng - sw.lng) * 0.12;
      return {
        n: ne.lat + latPad,
        s: sw.lat - latPad,
        e: ne.lng + lngPad,
        w: sw.lng - lngPad,
      };
    };

    setBounds(compute());

    let timer: number | null = null;
    const onMoveEnd = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        setBounds(compute());
      }, 150);
    };
    map.on('moveend', onMoveEnd);
    map.on('zoomend', onMoveEnd);
    return () => {
      map.off('moveend', onMoveEnd);
      map.off('zoomend', onMoveEnd);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [mapRef]);

  // Single map-level click listener that uses queryRenderedFeatures to find
  // a hit on either the cluster or unclustered-point layer. Because the
  // listener is attached to the map (not a layer), it can't be invalidated
  // when layers are recreated.
  useEffect(() => {
    if (!mapRef) return;
    const map = mapRef.getMap() as MapboxMap;

    const onClick = (e: MapMouseEvent) => {
      const hits = map.queryRenderedFeatures(e.point, {
        layers: [LAYER_POINT, LAYER_CLUSTER].filter((id) => map.getLayer(id)),
      });
      if (!hits.length) return;
      const f = hits[0];
      const layerId = f.layer?.id;
      if (layerId === LAYER_CLUSTER) {
        const src = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
        const clusterId = f.properties?.cluster_id;
        if (!src || clusterId == null) return;
        src.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom == null) return;
          const coords = (f.geometry as any).coordinates;
          map.easeTo({ center: coords, zoom });
        });
        return;
      }
      // unclustered point
      const uuid = f.properties?.uuid as string | undefined;
      const category = f.properties?.category as Category | undefined;
      if (!uuid || !category) return;
      const h = handlersRef.current;
      if (category === 'terras') {
        const t = h.terrasen.find((x) => x.uuid === uuid);
        if (t) h.onSelectTerras(t);
      } else if (category === 'restaurant') {
        const r = h.restaurants.find((x) => x.uuid === uuid);
        if (r) h.onSelectRestaurant(r);
      } else if (category === 'event') {
        const ev = h.events.find((x) => x.uuid === uuid);
        if (ev) h.onSelectEvent(ev);
      }
    };

    const onMove = (e: MapMouseEvent) => {
      const hits = map.queryRenderedFeatures(e.point, {
        layers: [LAYER_POINT, LAYER_CLUSTER].filter((id) => map.getLayer(id)),
      });
      map.getCanvas().style.cursor = hits.length ? 'pointer' : '';
    };

    map.on('click', onClick);
    map.on('mousemove', onMove);
    return () => {
      map.off('click', onClick);
      map.off('mousemove', onMove);
    };
  }, [mapRef]);

  const data = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: visible ? buildFeatures(terrasen, restaurants, events, layerFilter, bounds) : [],
  }), [visible, terrasen, restaurants, events, layerFilter, bounds]);

  return (
    <Source
      id={SOURCE_ID}
      type="geojson"
      data={data}
      cluster
      clusterMaxZoom={16}
      clusterRadius={42}
    >
      <Layer {...clusterCircleLayer(LAYER_CLUSTER)} />
      <Layer {...clusterCountLayer(LAYER_CLUSTER_COUNT)} />
      <Layer {...haloLayer(LAYER_POINT_HALO, selectedUuid)} />
      <Layer {...pointLayer(LAYER_POINT)} />
      <Layer {...labelLayer(LAYER_LABEL)} />
    </Source>
  );
}
