import { useEffect, useRef } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';
import type { Map as MapboxMap, GeoJSONSource, MapMouseEvent } from 'mapbox-gl';
import type { Terras, Restaurant, Event } from '../../types';

type Category = 'terras' | 'restaurant' | 'event';
type LayerFilter = Category | 'restaurants' | 'events' | 'all';

interface Props {
  mapRef: React.RefObject<MapRef | null>;
  mapLoaded: boolean;
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

function makeDotImage(color: string, sizeLogical = 14, pixelRatio = 2) {
  const size = sizeLogical * pixelRatio;
  const pad = pixelRatio * 2;
  const total = size + pad * 2;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = total;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // soft drop-shadow baked into the bitmap (one offscreen, not per element)
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

  const img = ctx.getImageData(0, 0, total, total);
  return { width: total, height: total, data: img.data };
}

function ensureIcons(map: MapboxMap) {
  (Object.keys(ICON_IDS) as Category[]).forEach((cat) => {
    const id = ICON_IDS[cat];
    if (map.hasImage(id)) return;
    const img = makeDotImage(COLORS[cat]);
    if (img) map.addImage(id, img as any, { pixelRatio: 2 });
  });
}

interface Feature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: { uuid: string; name: string; category: Category };
}

function buildFeatures(
  terrasen: Terras[],
  restaurants: Restaurant[],
  events: Event[],
  layerFilter: LayerFilter,
): Feature[] {
  const features: Feature[] = [];
  if (layerFilter === 'terras' || layerFilter === 'all') {
    for (const t of terrasen) {
      const c = t.location?.coordinates;
      if (!c || c.length < 2) continue;
      features.push({
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
      features.push({
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
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c[0], c[1]] },
        properties: { uuid: ev.uuid, name: ev.title, category: 'event' },
      });
    }
  }
  return features;
}

function setupLayers(map: MapboxMap) {
  ensureIcons(map);

  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterMaxZoom: 16,
      clusterRadius: 42,
    });
  }

  if (!map.getLayer(LAYER_CLUSTER)) {
    map.addLayer({
      id: LAYER_CLUSTER,
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
  }

  if (!map.getLayer(LAYER_CLUSTER_COUNT)) {
    map.addLayer({
      id: LAYER_CLUSTER_COUNT,
      type: 'symbol',
      source: SOURCE_ID,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-size': 12,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      },
      paint: {
        'text-color': '#ffffff',
      },
    });
  }

  if (!map.getLayer(LAYER_POINT_HALO)) {
    map.addLayer({
      id: LAYER_POINT_HALO,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'uuid'], '__none__']],
      paint: {
        'circle-radius': 18,
        'circle-color': '#FFD075',
        'circle-opacity': 0.45,
        'circle-blur': 0.6,
      },
    });
  }

  if (!map.getLayer(LAYER_POINT)) {
    map.addLayer({
      id: LAYER_POINT,
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
  }

  if (!map.getLayer(LAYER_LABEL)) {
    map.addLayer({
      id: LAYER_LABEL,
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
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
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
  }
}

function teardownLayers(map: MapboxMap) {
  for (const id of [LAYER_LABEL, LAYER_POINT, LAYER_POINT_HALO, LAYER_CLUSTER_COUNT, LAYER_CLUSTER]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
}

/**
 * Renders all map markers as a clustered Mapbox **symbol layer** — every
 * point + cluster is drawn on the map's WebGL canvas in a single GPU pass.
 * Replaces hundreds of DOM-based <Marker> nodes (each with their own
 * compositor layers, drop-shadow filters, and backdrop-blurs).
 *
 * Behaviour matches the previous DOM markers:
 *   • Click on a cluster → eases to the cluster's expansion zoom.
 *   • Click on an individual point → invokes the matching select-handler.
 *   • Hover changes the cursor.
 *   • Labels fade in around zoom 17.
 */
export default function MapMarkersLayer({
  mapRef, mapLoaded, visible,
  terrasen, restaurants, events, layerFilter,
  selectedUuid,
  onSelectTerras, onSelectRestaurant, onSelectEvent,
}: Props) {
  // Stable handler bag so click listeners can reach the latest props/data.
  const propsRef = useRef({ terrasen, restaurants, events, onSelectTerras, onSelectRestaurant, onSelectEvent });
  useEffect(() => {
    propsRef.current = { terrasen, restaurants, events, onSelectTerras, onSelectRestaurant, onSelectEvent };
  });

  const setupDoneRef = useRef(false);

  // 1) Set up sources, layers, icons, and click/hover handlers.
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current.getMap() as MapboxMap;

    const ensure = () => {
      try {
        setupLayers(map);
        setupDoneRef.current = true;
      } catch (err) {
        // setStyle still in flight or layer conflict; retry on next style.load.
        console.warn('[MapMarkersLayer] setup failed', err);
      }
    };

    if (map.isStyleLoaded()) ensure();
    else map.once('style.load', ensure);

    const onPointClick = (e: MapMouseEvent & { features?: any[] }) => {
      const f = e.features?.[0];
      if (!f) return;
      const uuid = f.properties?.uuid as string | undefined;
      const category = f.properties?.category as Category | undefined;
      if (!uuid || !category) return;
      const p = propsRef.current;
      if (category === 'terras') {
        const t = p.terrasen.find((x) => x.uuid === uuid);
        if (t) p.onSelectTerras(t);
      } else if (category === 'restaurant') {
        const r = p.restaurants.find((x) => x.uuid === uuid);
        if (r) p.onSelectRestaurant(r);
      } else if (category === 'event') {
        const ev = p.events.find((x) => x.uuid === uuid);
        if (ev) p.onSelectEvent(ev);
      }
    };

    const onClusterClick = (e: MapMouseEvent & { features?: any[] }) => {
      const f = e.features?.[0];
      if (!f) return;
      const src = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      const clusterId = f.properties?.cluster_id;
      if (!src || clusterId == null) return;
      src.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom == null) return;
        const coords = (f.geometry as any).coordinates;
        map.easeTo({ center: coords, zoom });
      });
    };

    const onEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
    const onLeave = () => { map.getCanvas().style.cursor = ''; };

    map.on('click', LAYER_POINT, onPointClick);
    map.on('click', LAYER_CLUSTER, onClusterClick);
    map.on('mouseenter', LAYER_POINT, onEnter);
    map.on('mouseleave', LAYER_POINT, onLeave);
    map.on('mouseenter', LAYER_CLUSTER, onEnter);
    map.on('mouseleave', LAYER_CLUSTER, onLeave);

    return () => {
      map.off('click', LAYER_POINT, onPointClick);
      map.off('click', LAYER_CLUSTER, onClusterClick);
      map.off('mouseenter', LAYER_POINT, onEnter);
      map.off('mouseleave', LAYER_POINT, onLeave);
      map.off('mouseenter', LAYER_CLUSTER, onEnter);
      map.off('mouseleave', LAYER_CLUSTER, onLeave);
      try { teardownLayers(map); } catch { /* style already swapped */ }
      setupDoneRef.current = false;
    };
  }, [mapLoaded, mapRef]);

  // 2) Push fresh GeoJSON whenever data or filter changes.
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !setupDoneRef.current) return;
    const map = mapRef.current.getMap() as MapboxMap;
    const src = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (!src) return;
    const features = visible ? buildFeatures(terrasen, restaurants, events, layerFilter) : [];
    src.setData({ type: 'FeatureCollection', features });
  }, [mapLoaded, mapRef, visible, terrasen, restaurants, events, layerFilter]);

  // 3) Update the selected-marker halo via a layer filter (no re-source).
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !setupDoneRef.current) return;
    const map = mapRef.current.getMap() as MapboxMap;
    if (!map.getLayer(LAYER_POINT_HALO)) return;
    map.setFilter(LAYER_POINT_HALO, [
      'all',
      ['!', ['has', 'point_count']],
      ['==', ['get', 'uuid'], selectedUuid ?? '__none__'],
    ]);
  }, [mapLoaded, mapRef, selectedUuid]);

  return null;
}
