import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { searchTerras, uuidFromHydraId } from '../services/terrasService';
import { searchRestaurants } from '../services/restaurantService';
import { searchEvents } from '../services/eventService';
import { useFilters } from '../contexts/FilterContext';
import type { Terras, Restaurant, Event } from '../types';

type Tab = 'terraces' | 'restaurants' | 'events';
const PAGE_SIZE = 20;

function intensityColor(v: number) {
  return v >= 70 ? '#D97706' : v >= 40 ? '#F5A623' : '#9CA3AF';
}

function IntensityBar({ value }: { value: number }) {
  const color = intensityColor(value);
  return (
    <div className="flex items-center gap-2 mt-2.5">
      <div className="flex-1 h-1 rounded-full bg-surface-3 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold tabular-nums w-8 text-right" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

function TerrasCard({ item }: { item: Terras & { '@id': string } }) {
  return (
    <Link
      to={`/terrasen/${uuidFromHydraId(item['@id'])}`}
      className="block px-4 py-3.5 bg-surface rounded-xl shadow-soft hover:shadow-float transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-text-1 leading-snug">{item.name}</h3>
          <p className="text-xs text-text-3 mt-0.5">{item.address}</p>
        </div>
        <span className="text-xs font-bold uppercase tracking-label text-text-3 shrink-0 mt-0.5">
          Terrace
        </span>
      </div>
      <IntensityBar value={item.intensity} />
    </Link>
  );
}

function RestaurantCard({ item }: { item: Restaurant & { '@id': string } }) {
  return (
    <Link
      to={`/restaurants/${uuidFromHydraId(item['@id'])}`}
      className="block px-4 py-3.5 bg-surface rounded-xl shadow-soft hover:shadow-float transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-text-1 leading-snug">{item.name}</h3>
          <p className="text-xs text-text-3 mt-0.5">{item.address}</p>
        </div>
        <span
          className="text-xs font-bold uppercase tracking-label shrink-0 mt-0.5 capitalize"
          style={{ color: '#75D1FF' }}
        >
          {item.cuisine}
        </span>
      </div>
      <IntensityBar value={item.intensity} />
    </Link>
  );
}

function EventCard({ item }: { item: Event & { '@id': string } }) {
  const start = new Date(item.date_start);
  return (
    <Link
      to={`/events/${uuidFromHydraId(item['@id'])}`}
      className="block px-4 py-3.5 bg-surface rounded-xl shadow-soft hover:shadow-float transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-text-1 leading-snug">{item.title}</h3>
          <p className="text-xs text-text-3 mt-0.5">{item.address}</p>
        </div>
        <span className="text-xs font-semibold text-text-3 shrink-0 mt-0.5 tabular-nums">
          {start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      </div>
      {item.description && (
        <p className="text-xs text-text-2 mt-1.5 line-clamp-2">{item.description}</p>
      )}
    </Link>
  );
}

export default function SearchPage() {
  const [tab, setTab] = useState<Tab>('terraces');
  const [page, setPage] = useState(0);
  const { query, setQuery, sunnyOnly, setSunnyOnly, minIntensity, setMinIntensity, cuisine, setCuisine } = useFilters();

  function handleTab(t: Tab) { setTab(t); setPage(0); }
  function handleQuery(v: string) { setQuery(v); setPage(0); }

  const terrasQuery = useQuery({
    queryKey: ['search-terrasen', query, sunnyOnly, minIntensity, page],
    queryFn: () => searchTerras({
      q: query || undefined,
      sunnyOnly: sunnyOnly || undefined,
      minIntensity: minIntensity || undefined,
      limit: PAGE_SIZE,
      skip: page * PAGE_SIZE,
    }),
    enabled: tab === 'terraces',
    placeholderData: (p) => p,
  });

  const restaurantQuery = useQuery({
    queryKey: ['search-restaurants', query, cuisine, minIntensity, page],
    queryFn: () => searchRestaurants({
      q: query || undefined,
      cuisine: cuisine || undefined,
      minIntensity: minIntensity || undefined,
      limit: PAGE_SIZE,
      skip: page * PAGE_SIZE,
    }),
    enabled: tab === 'restaurants',
    placeholderData: (p) => p,
  });

  const eventQuery = useQuery({
    queryKey: ['search-events', query, page],
    queryFn: () => searchEvents({ q: query || undefined, limit: PAGE_SIZE, skip: page * PAGE_SIZE }),
    enabled: tab === 'events',
    placeholderData: (p) => p,
  });

  const activeData = tab === 'terraces' ? terrasQuery.data : tab === 'restaurants' ? restaurantQuery.data : eventQuery.data;
  const isLoading = tab === 'terraces' ? terrasQuery.isLoading : tab === 'restaurants' ? restaurantQuery.isLoading : eventQuery.isLoading;
  const total = activeData?.['hydra:totalItems'] ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex-1 overflow-y-auto bg-bg">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Search */}
        <div className="relative mb-4">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search terraces, restaurants, events…"
            value={query}
            onChange={(e) => handleQuery(e.target.value)}
            className="w-full bg-surface rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-1 placeholder:text-text-3 shadow-soft focus:outline-none focus:ring-2 transition-all"
            style={{ '--tw-ring-color': 'rgba(245,166,35,0.3)' } as React.CSSProperties}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-2 rounded-xl p-1 mb-4">
          {(['terraces', 'restaurants', 'events'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTab(t)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
                tab === t
                  ? 'bg-surface text-text-1 shadow-soft'
                  : 'text-text-2 hover:text-text-1'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tab === 'terraces' && (
            <label className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg shadow-soft text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={sunnyOnly}
                onChange={(e) => { setSunnyOnly(e.target.checked); setPage(0); }}
                className="accent-primary"
              />
              <span className="text-text-2 font-medium">Sunny only</span>
            </label>
          )}
          {tab === 'restaurants' && (
            <select
              value={cuisine}
              onChange={(e) => { setCuisine(e.target.value); setPage(0); }}
              className="px-3 py-1.5 bg-surface rounded-lg shadow-soft text-xs text-text-2 focus:outline-none"
            >
              <option value="">All cuisines</option>
              {['bar', 'belgian', 'burger', 'french', 'italian', 'asian', 'pizza', 'sushi', 'vegetarian', 'restaurant'].map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          )}
          {tab !== 'events' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg shadow-soft">
              <span className="text-xs text-text-2 font-medium">Min sun</span>
              <input
                type="range" min={0} max={100} step={10} value={minIntensity}
                onChange={(e) => { setMinIntensity(Number(e.target.value)); setPage(0); }}
                className="w-20 h-1 cursor-pointer accent-primary"
              />
              <span className="text-xs font-bold tabular-nums w-7" style={{ color: '#F5A623' }}>{minIntensity}%</span>
            </div>
          )}
        </div>

        {/* Count */}
        {!isLoading && (
          <p className="text-xs text-text-3 mb-3 font-medium">
            {total.toLocaleString()} result{total !== 1 ? 's' : ''}
            {page > 0 && ` — page ${page + 1} of ${totalPages}`}
          </p>
        )}

        {/* Skeletons */}
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-surface animate-pulse shadow-soft" />
            ))}
          </div>
        )}

        {/* Results */}
        {!isLoading && (
          <div className="space-y-2">
            {tab === 'terraces' && (terrasQuery.data?.['hydra:member'] ?? []).map((item) => (
              <TerrasCard key={item.uuid} item={item} />
            ))}
            {tab === 'restaurants' && (restaurantQuery.data?.['hydra:member'] ?? []).map((item) => (
              <RestaurantCard key={item.uuid} item={item} />
            ))}
            {tab === 'events' && (eventQuery.data?.['hydra:member'] ?? []).map((item) => (
              <EventCard key={item.uuid} item={item} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-surface shadow-soft text-text-2 disabled:opacity-40 hover:text-text-1 transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-text-3 tabular-nums">{page + 1} / {totalPages}</span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-surface shadow-soft text-text-2 disabled:opacity-40 hover:text-text-1 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
