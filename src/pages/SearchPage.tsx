import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { searchTerras, uuidFromHydraId } from '../services/terrasService';
import { searchRestaurants } from '../services/restaurantService';
import { searchEvents } from '../services/eventService';
import { useFilters } from '../contexts/FilterContext';
import { intensityColor, intensityLabel } from '../utils/intensity';
import Card from '../components/ui/Card';
import Pill from '../components/ui/Pill';
import type { Terras, Restaurant, Event } from '../types';

type Tab = 'terraces' | 'restaurants' | 'events';
const PAGE_SIZE = 20;

function IntensityBadge({ value, cloudCover }: { value: number; cloudCover?: number }) {
  const colour = intensityColor(value);
  const cloudy = cloudCover != null && cloudCover > 80;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-track)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${value}%`,
            background: `linear-gradient(to right, ${colour}88, ${colour})`,
          }}
        />
      </div>
      <div className="shrink-0 flex items-center gap-1">
        {cloudy && <span title={`Heavy clouds (${cloudCover}%)`} className="text-xs">☁</span>}
        <span className="text-xs font-bold tabular-nums w-9 text-right" style={{ color: colour }}>
          {value}%
        </span>
      </div>
    </div>
  );
}

function TerrasCard({ item }: { item: Terras & { '@id': string } }) {
  return (
    <Link to={`/terrasen/${uuidFromHydraId(item['@id'])}`} className="block group">
      <Card variant="surface" radius="2xl" padding="lg" className="card-hover fade-up h-full">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-text-1 leading-tight" style={{ fontSize: '1.125rem' }}>
              {item.name}
            </h3>
            <p className="text-xs mt-1.5 text-text-3">{item.address}</p>
          </div>
          <Pill tone="gold">Terrace</Pill>
        </div>
        <p className="eyebrow mb-2">{intensityLabel(item.intensity)}</p>
        <IntensityBadge value={item.intensity} cloudCover={item.latestSunData?.rawCloudCover} />
      </Card>
    </Link>
  );
}

function RestaurantCard({ item }: { item: Restaurant & { '@id': string } }) {
  return (
    <Link to={`/restaurants/${uuidFromHydraId(item['@id'])}`} className="block group">
      <Card variant="surface" radius="2xl" padding="lg" className="card-hover fade-up h-full">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-text-1 leading-tight" style={{ fontSize: '1.125rem' }}>
              {item.name}
            </h3>
            <p className="text-xs mt-1.5 text-text-3">{item.address}</p>
          </div>
          <Pill tone="sky" className="capitalize">{item.cuisine}</Pill>
        </div>
        <p className="eyebrow mb-2">{intensityLabel(item.intensity)}</p>
        <IntensityBadge value={item.intensity} cloudCover={item.latestSunData?.rawCloudCover} />
      </Card>
    </Link>
  );
}

function EventCard({ item }: { item: Event & { '@id': string } }) {
  const start = new Date(item.date_start);
  return (
    <Link to={`/events/${uuidFromHydraId(item['@id'])}`} className="block group">
      <Card variant="surface" radius="2xl" padding="lg" className="card-hover fade-up h-full">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-text-1 leading-tight" style={{ fontSize: '1.125rem' }}>
              {item.title}
            </h3>
            <p className="text-xs mt-1.5 text-text-3">{item.address}</p>
          </div>
          <Pill tone="terra" className="tabular-nums">
            {start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </Pill>
        </div>
        {item.description && (
          <p className="text-sm text-text-2 line-clamp-2 leading-relaxed">{item.description}</p>
        )}
      </Card>
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
    <div className="flex-1 overflow-y-auto bg-atmospheric">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8">

        {/* Editorial heading */}
        <header className="mb-8 fade-up">
          <p className="eyebrow mb-2">Discover</p>
          <h1 className="font-display font-semibold text-text-1 leading-[1.05] text-fluid-3xl tracking-tight">
            Where the sun lands<br />
            <span style={{ color: 'var(--color-primary)' }}>in Ghent today</span>
          </h1>
          <p className="text-text-2 mt-3 text-fluid-base max-w-prose">
            Browse the city's terraces, restaurants and events, ranked by how much sun
            they're catching right now.
          </p>
        </header>

        {/* Search bar */}
        <div className="relative mb-5 fade-up fade-up-delay-1">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ color: 'var(--color-text-3)' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search by name, address, cuisine…"
            value={query}
            onChange={(e) => handleQuery(e.target.value)}
            className="w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm text-text-1 placeholder:text-text-3 transition-shadow"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-card)',
            }}
          />
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 rounded-2xl p-1 mb-5 fade-up fade-up-delay-1"
          style={{ background: 'var(--color-surface-2)' }}
        >
          {(['terraces', 'restaurants', 'events'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTab(t)}
              className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all min-h-[44px]"
              style={tab === t ? {
                background: 'var(--color-surface)',
                color: 'var(--color-text-1)',
                boxShadow: 'var(--shadow-card)',
              } : {
                color: 'var(--color-text-3)',
                background: 'transparent',
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6 fade-up fade-up-delay-2">
          {tab === 'terraces' && (
            <button
              onClick={() => { setSunnyOnly(!sunnyOnly); setPage(0); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors min-h-[40px]"
              style={{
                background: sunnyOnly ? 'var(--color-primary-light)' : 'var(--color-surface)',
                border: `1px solid ${sunnyOnly ? 'var(--color-primary-border)' : 'var(--color-border)'}`,
                color: sunnyOnly ? 'var(--color-primary)' : 'var(--color-text-3)',
              }}
            >
              <span>☀</span> Sunny only
            </button>
          )}
          {tab === 'restaurants' && (
            <select
              value={cuisine}
              onChange={(e) => { setCuisine(e.target.value); setPage(0); }}
              className="px-3 py-2 rounded-xl text-xs text-text-2 transition-colors min-h-[40px]"
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
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl min-h-[40px]"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <span className="text-xs font-medium text-text-2">Min sun</span>
              <input
                type="range" min={0} max={100} step={10} value={minIntensity}
                onChange={(e) => { setMinIntensity(Number(e.target.value)); setPage(0); }}
                className="w-24 h-1 cursor-pointer accent-primary"
              />
              <span className="text-xs font-bold tabular-nums w-9 text-right" style={{ color: 'var(--color-primary)' }}>{minIntensity}%</span>
            </div>
          )}
        </div>

        {/* Count */}
        {!isLoading && (
          <p className="text-xs text-text-3 mb-4 font-medium">
            {total.toLocaleString()} {tab}{page > 0 && ` · page ${page + 1} of ${totalPages}`}
          </p>
        )}

        {/* Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl shimmer" style={{ animationDelay: `${i * 0.06}s` }} />
            ))}
          </div>
        )}

        {/* Results */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        {/* Empty */}
        {!isLoading && total === 0 && (
          <Card variant="cream" padding="lg" radius="2xl" className="text-center fade-up">
            <p className="font-display text-text-1" style={{ fontSize: '1.25rem' }}>Nothing here yet</p>
            <p className="text-sm text-text-3 mt-2">Try clearing the filters or searching for something else.</p>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2.5 text-sm font-medium rounded-xl disabled:opacity-40 transition-all hover:-translate-y-0.5 min-h-[44px]"
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-2)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              ← Previous
            </button>
            <span className="text-xs text-text-3 tabular-nums">{page + 1} / {totalPages}</span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2.5 text-sm font-medium rounded-xl disabled:opacity-40 transition-all hover:-translate-y-0.5 min-h-[44px]"
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-2)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              Next →
            </button>
          </div>
        )}

        <div className="h-10" />
      </div>
    </div>
  );
}
