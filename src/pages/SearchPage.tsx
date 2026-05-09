import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { searchTerras, uuidFromHydraId } from '../services/terrasService';
import { searchRestaurants } from '../services/restaurantService';
import { searchEvents } from '../services/eventService';
import { useFilters } from '../contexts/FilterContext';
import { intensityColor } from '../utils/intensity';
import type { Terras, Restaurant, Event } from '../types';

type Tab = 'terraces' | 'restaurants' | 'events';
const PAGE_SIZE = 20;

function IntensityBar({ value, cloudCover }: { value: number; cloudCover?: number }) {
  const color = intensityColor(value);
  const isCloudy = cloudCover !== undefined && cloudCover > 80;

  return (
    <div className="flex items-center gap-2.5 mt-3">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-track)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: `linear-gradient(to right, ${color}88, ${color})` }}
        />
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {isCloudy && (
          <span title={`Heavy clouds (${cloudCover}%)`} className="text-sm">☁️</span>
        )}
        <span className="text-xs font-semibold tabular-nums w-8 text-right" style={{ color }}>
          {value}%
        </span>
      </div>
    </div>
  );
}

function TerrasCard({ item }: { item: Terras & { '@id': string } }) {
  return (
    <Link
      to={`/terrasen/${uuidFromHydraId(item['@id'])}`}
      className="block px-4 py-4 bg-surface rounded-2xl card-hover fade-up"
      style={{ border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-text-1 leading-snug">{item.name}</h3>
          <p className="text-xs mt-1 text-text-3">{item.address}</p>
        </div>
        <span
          className="text-xs font-medium uppercase tracking-label text-text-3 shrink-0 mt-0.5 px-2 py-1 rounded-lg"
          style={{ background: 'var(--color-surface-2)' }}
        >
          Terrace
        </span>
      </div>
      <IntensityBar value={item.intensity} cloudCover={item.latestSunData?.rawCloudCover} />
    </Link>
  );
}

function RestaurantCard({ item }: { item: Restaurant & { '@id': string } }) {
  return (
    <Link
      to={`/restaurants/${uuidFromHydraId(item['@id'])}`}
      className="block px-4 py-4 bg-surface rounded-2xl card-hover fade-up"
      style={{ border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-text-1 leading-snug">{item.name}</h3>
          <p className="text-xs mt-1 text-text-3">{item.address}</p>
        </div>
        <span
          className="text-xs font-medium capitalize px-2 py-1 rounded-lg shrink-0 mt-0.5"
          style={{ color: 'var(--color-sky)', background: 'var(--color-sky-light)' }}
        >
          {item.cuisine}
        </span>
      </div>
      <IntensityBar value={item.intensity} cloudCover={item.latestSunData?.rawCloudCover} />
    </Link>
  );
}

function EventCard({ item }: { item: Event & { '@id': string } }) {
  const start = new Date(item.date_start);
  return (
    <Link
      to={`/events/${uuidFromHydraId(item['@id'])}`}
      className="block px-4 py-4 bg-surface rounded-2xl card-hover fade-up"
      style={{ border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-text-1 leading-snug">{item.title}</h3>
          <p className="text-xs mt-1 text-text-3">{item.address}</p>
        </div>
        <div
          className="text-center shrink-0 mt-0.5 px-2 py-1 rounded-lg"
          style={{ background: 'var(--color-primary-light)' }}
        >
          <p className="text-xs font-semibold tabular-nums" style={{ color: 'var(--color-primary)' }}>
            {start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>
      {item.description && (
        <p className="text-xs mt-2.5 line-clamp-2 text-text-2">{item.description}</p>
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
    queryFn: () => searchTerras({ q: query || undefined, sunnyOnly: sunnyOnly || undefined, minIntensity: minIntensity || undefined, limit: PAGE_SIZE, skip: page * PAGE_SIZE }),
    enabled: tab === 'terraces',
    placeholderData: (p) => p,
  });

  const restaurantQuery = useQuery({
    queryKey: ['search-restaurants', query, cuisine, minIntensity, page],
    queryFn: () => searchRestaurants({ q: query || undefined, cuisine: cuisine || undefined, minIntensity: minIntensity || undefined, limit: PAGE_SIZE, skip: page * PAGE_SIZE }),
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
      <div className="max-w-2xl mx-auto px-4 py-7">

        {/* Page heading */}
        <div className="mb-6">
          <h1 className="font-display text-fluid-2xl font-semibold text-text-1">Discover Ghent</h1>
          <p className="text-sm text-text-3 mt-1">Find the sunniest spots in the city</p>
        </div>

        {/* Search input */}
        <div className="relative mb-5">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ color: 'var(--color-text-3)' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search terraces, restaurants, events…"
            value={query}
            onChange={(e) => handleQuery(e.target.value)}
            className="w-full bg-surface rounded-2xl pl-11 pr-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:outline-none transition-all"
            style={{
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)',
            }}
            onFocus={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(229,135,10,0.16), 0 0 0 2px rgba(229,135,10,0.18)')}
            onBlur={e => (e.currentTarget.style.boxShadow = 'var(--shadow-card)')}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl p-1 mb-5" style={{ background: 'var(--color-surface-3)' }}>
          {(['terraces', 'restaurants', 'events'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTab(t)}
              className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-all"
              style={tab === t ? {
                background: 'var(--color-surface)',
                color: 'var(--color-text-1)',
                boxShadow: 'var(--shadow-card)',
              } : {
                color: 'var(--color-text-3)',
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          {tab === 'terraces' && (
            <label
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-colors min-h-[44px]"
              style={{
                background: sunnyOnly ? 'var(--color-primary-light)' : 'var(--color-surface)',
                border: `1px solid ${sunnyOnly ? 'var(--color-primary-border)' : 'var(--color-border)'}`,
                color: sunnyOnly ? 'var(--color-primary)' : 'var(--color-text-3)',
              }}
            >
              <input
                type="checkbox"
                checked={sunnyOnly}
                onChange={(e) => { setSunnyOnly(e.target.checked); setPage(0); }}
                className="accent-primary w-3.5 h-3.5"
              />
              <span className="font-medium">Sunny only ☀️</span>
            </label>
          )}
          {tab === 'restaurants' && (
            <select
              value={cuisine}
              onChange={(e) => { setCuisine(e.target.value); setPage(0); }}
              className="px-3 py-2.5 rounded-xl text-xs text-text-2 focus:outline-none transition-colors min-h-[44px]"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <option value="">All cuisines</option>
              {['bar', 'belgian', 'burger', 'french', 'italian', 'asian', 'pizza', 'sushi', 'vegetarian', 'restaurant'].map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          )}
          {tab !== 'events' && (
            <div
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl min-h-[44px]"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <span className="text-xs font-medium text-text-2">Min sun</span>
              <input
                type="range" min={0} max={100} step={10} value={minIntensity}
                onChange={(e) => { setMinIntensity(Number(e.target.value)); setPage(0); }}
                className="w-20 h-1 cursor-pointer accent-primary"
              />
              <span className="text-xs font-bold tabular-nums w-7" style={{ color: 'var(--color-primary)' }}>{minIntensity}%</span>
            </div>
          )}
        </div>

        {/* Count */}
        {!isLoading && (
          <p className="text-xs text-text-3 mb-4 font-medium">
            {total.toLocaleString()} result{total !== 1 ? 's' : ''}
            {page > 0 && ` — page ${page + 1} of ${totalPages}`}
          </p>
        )}

        {/* Skeletons */}
        {isLoading && (
          <div className="space-y-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl animate-pulse"
                style={{ background: 'var(--color-surface-2)', animationDelay: `${i * 0.05}s` }}
              />
            ))}
          </div>
        )}

        {/* Results */}
        {!isLoading && (
          <div className="space-y-2.5">
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
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2.5 text-sm font-medium rounded-xl bg-surface text-text-2 disabled:opacity-40 transition-all hover:-translate-y-0.5 min-h-[44px]"
              style={{ border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}
            >
              ← Previous
            </button>
            <span className="text-xs text-text-3 tabular-nums">{page + 1} / {totalPages}</span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2.5 text-sm font-medium rounded-xl bg-surface text-text-2 disabled:opacity-40 transition-all hover:-translate-y-0.5 min-h-[44px]"
              style={{ border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
