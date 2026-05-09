import { useState, useMemo } from 'react';
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

const PAGE_SIZE = 24;

type Kind = 'terraces' | 'restaurants' | 'events';

/* ─── Featured hero ────────────────────────────────── */

function FeaturedHero({ item }: { item: Terras & { '@id': string } }) {
  const colour = intensityColor(item.intensity);
  return (
    <Link
      to={`/terrasen/${uuidFromHydraId(item['@id'])}`}
      className="block fade-up"
    >
      <Card variant="surface" radius="2xl" padding="none" className="overflow-hidden card-hover">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left — visual */}
          <div
            className="relative flex items-center justify-center p-10 md:p-14 min-h-[260px]"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${colour}55, ${colour}11 60%, var(--color-surface-2))`,
            }}
          >
            {/* Big sun ring */}
            <svg width="180" height="180" viewBox="0 0 180 180" className="relative z-10">
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                const r = (deg * Math.PI) / 180;
                return (
                  <line
                    key={deg}
                    x1={90 + 64 * Math.cos(r)} y1={90 + 64 * Math.sin(r)}
                    x2={90 + 80 * Math.cos(r)} y2={90 + 80 * Math.sin(r)}
                    stroke={colour} strokeWidth="2" strokeLinecap="round" opacity="0.45"
                  />
                );
              })}
              <circle cx="90" cy="90" r="56" fill={colour} fillOpacity="0.12" stroke={colour} strokeWidth="2" />
              <circle cx="90" cy="90" r="40" fill={colour} fillOpacity="0.85" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="font-display tabular-nums" style={{
                fontSize: '3rem', lineHeight: 1, color: colour, letterSpacing: '-0.03em',
              }}>
                {item.intensity}<span style={{ fontSize: '1.25rem' }}>%</span>
              </p>
              <p className="eyebrow mt-1.5" style={{ color: 'var(--color-text-2)' }}>{intensityLabel(item.intensity)}</p>
            </div>
          </div>

          {/* Right — meta */}
          <div className="p-7 md:p-10 flex flex-col justify-center">
            <p className="eyebrow mb-3">Today's pick</p>
            <h2 className="font-display font-semibold text-text-1 leading-[1.05] text-fluid-3xl tracking-tight">
              {item.name}
            </h2>
            <p className="text-sm text-text-3 mt-3">{item.address}</p>
            {item.description && (
              <p className="text-text-2 leading-relaxed mt-5 text-fluid-base line-clamp-3">
                {item.description}
              </p>
            )}
            <span
              className="inline-flex items-center gap-2 mt-6 text-sm font-semibold"
              style={{ color: 'var(--color-primary)' }}
            >
              View details
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/* ─── Cards ────────────────────────────────────────── */

function IntensityBadge({ value, cloudCover }: { value: number; cloudCover?: number }) {
  const colour = intensityColor(value);
  const cloudy = cloudCover != null && cloudCover > 80;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-track)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: `linear-gradient(to right, ${colour}88, ${colour})` }}
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
    <Link to={`/terrasen/${uuidFromHydraId(item['@id'])}`} className="block">
      <Card variant="surface" radius="2xl" padding="lg" className="card-hover fade-up h-full">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-text-1 leading-tight" style={{ fontSize: '1.05rem' }}>
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
    <Link to={`/restaurants/${uuidFromHydraId(item['@id'])}`} className="block">
      <Card variant="surface" radius="2xl" padding="lg" className="card-hover fade-up h-full">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-text-1 leading-tight" style={{ fontSize: '1.05rem' }}>
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
    <Link to={`/events/${uuidFromHydraId(item['@id'])}`} className="block">
      <Card variant="surface" radius="2xl" padding="lg" className="card-hover fade-up h-full">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-text-1 leading-tight" style={{ fontSize: '1.05rem' }}>
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

/* ─── Compact horizontal mini-card for the strips ─── */

function MiniCard({ item }: { item: Terras & { '@id': string } }) {
  const colour = intensityColor(item.intensity);
  return (
    <Link
      to={`/terrasen/${uuidFromHydraId(item['@id'])}`}
      className="shrink-0"
      style={{ width: 220 }}
    >
      <Card variant="surface" radius="xl" padding="md" className="card-hover h-full">
        <div className="flex items-center justify-between mb-2.5">
          <Pill tone="gold" size="sm">Terrace</Pill>
          <span className="font-display tabular-nums" style={{ fontSize: '1.25rem', lineHeight: 1, color: colour }}>
            {item.intensity}<span style={{ fontSize: '0.75rem' }}>%</span>
          </span>
        </div>
        <p className="font-display font-semibold text-text-1 leading-snug" style={{ fontSize: '0.95rem' }}>
          {item.name}
        </p>
        <p className="text-xs text-text-3 mt-1 line-clamp-1">{item.address}</p>
      </Card>
    </Link>
  );
}

/* ─── Page ─────────────────────────────────────────── */

export default function SearchPage() {
  const [kind, setKind] = useState<Kind>('terraces');
  const [page, setPage] = useState(0);
  const { query, setQuery, sunnyOnly, setSunnyOnly, minIntensity, setMinIntensity, cuisine, setCuisine } = useFilters();

  function handleQuery(v: string) { setQuery(v); setPage(0); }

  // Top-3 sunny terraces for the editorial sections (always loaded)
  const editorial = useQuery({
    queryKey: ['discover-editorial'],
    queryFn: () => searchTerras({ sunnyOnly: true }),
    staleTime: 60_000,
  });
  const featured = useMemo(() => editorial.data?.['hydra:member']?.[0], [editorial.data]);
  const partial = useMemo(
    () => (editorial.data?.['hydra:member'] ?? [])
      .filter((t) => t.intensity >= 40 && t.intensity < 70)
      .slice(0, 8),
    [editorial.data],
  );

  const terrasQuery = useQuery({
    queryKey: ['discover-terrasen', query, sunnyOnly, minIntensity, page],
    queryFn: () => searchTerras({ q: query || undefined, sunnyOnly: sunnyOnly || undefined, minIntensity: minIntensity || undefined, limit: PAGE_SIZE, skip: page * PAGE_SIZE }),
    enabled: kind === 'terraces',
    placeholderData: (p) => p,
  });
  const restaurantQuery = useQuery({
    queryKey: ['discover-restaurants', query, cuisine, minIntensity, page],
    queryFn: () => searchRestaurants({ q: query || undefined, cuisine: cuisine || undefined, minIntensity: minIntensity || undefined, limit: PAGE_SIZE, skip: page * PAGE_SIZE }),
    enabled: kind === 'restaurants',
    placeholderData: (p) => p,
  });
  const eventQuery = useQuery({
    queryKey: ['discover-events', query, page],
    queryFn: () => searchEvents({ q: query || undefined, limit: PAGE_SIZE, skip: page * PAGE_SIZE }),
    enabled: kind === 'events',
    placeholderData: (p) => p,
  });

  const activeData = kind === 'terraces' ? terrasQuery.data : kind === 'restaurants' ? restaurantQuery.data : eventQuery.data;
  const isLoading = kind === 'terraces' ? terrasQuery.isLoading : kind === 'restaurants' ? restaurantQuery.isLoading : eventQuery.isLoading;
  const total = activeData?.['hydra:totalItems'] ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex-1 overflow-y-auto bg-atmospheric">
      <div className="max-w-screen-lg mx-auto px-5 sm:px-8 py-10 sm:py-14">

        {/* Editorial header */}
        <header className="mb-10 fade-up max-w-3xl">
          <p className="eyebrow mb-3">Discover</p>
          <h1 className="font-display font-semibold text-text-1 leading-[1.02] text-fluid-hero tracking-tight">
            Where the sun lands<br />
            <span style={{ color: 'var(--color-primary)' }}>in Ghent today</span>
          </h1>
          <p className="text-text-2 mt-4 text-fluid-lg max-w-prose leading-relaxed">
            A hand-curated look at the city's best terraces right now —
            ranked by real-time sun intensity, building shadows, and cloud cover.
          </p>
        </header>

        {/* FEATURED ──────────────────────────────────── */}
        {featured && (
          <section className="mb-12 fade-up fade-up-delay-1">
            <FeaturedHero item={featured as Terras & { '@id': string }} />
          </section>
        )}

        {/* PARTIAL SUN STRIP ─────────────────────────── */}
        {partial.length > 0 && (
          <section className="mb-12 fade-up fade-up-delay-2">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <p className="eyebrow mb-1">In partial sun now</p>
                <h2 className="font-display font-semibold text-text-1 text-fluid-xl">
                  Worth a chair if you're nearby
                </h2>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-5 sm:-mx-8 px-5 sm:px-8">
              {partial.map((t) => (
                <MiniCard key={t.uuid} item={t as Terras & { '@id': string }} />
              ))}
            </div>
          </section>
        )}

        <div className="editorial-rule mb-10" />

        {/* BROWSE ────────────────────────────────────── */}
        <section className="fade-up">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="eyebrow mb-1">Browse</p>
              <h2 className="font-display font-semibold text-text-1 text-fluid-2xl">
                The whole map, in a list
              </h2>
            </div>
          </div>

          {/* Kind filter chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            {(['terraces', 'restaurants', 'events'] as Kind[]).map((k) => {
              const active = kind === k;
              return (
                <button
                  key={k}
                  onClick={() => { setKind(k); setPage(0); }}
                  className="text-sm font-medium px-4 py-2 rounded-full transition-all min-h-[40px]"
                  style={active ? {
                    background: 'var(--color-primary)',
                    color: 'var(--color-on-primary)',
                    boxShadow: 'var(--shadow-amber)',
                  } : {
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-2)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              );
            })}

            <span className="hidden sm:inline-block w-px self-stretch mx-2" style={{ background: 'var(--color-border)' }} />

            {/* Search input */}
            <div className="relative flex-1 min-w-[200px]">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                style={{ color: 'var(--color-text-3)' }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                placeholder="Search by name or address…"
                value={query}
                onChange={(e) => handleQuery(e.target.value)}
                className="w-full rounded-full pl-9 pr-4 py-2 text-sm text-text-1 placeholder:text-text-3 transition-all min-h-[40px]"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              />
            </div>
          </div>

          {/* Secondary filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {kind === 'terraces' && (
              <button
                onClick={() => { setSunnyOnly(!sunnyOnly); setPage(0); }}
                className="flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-colors min-h-[36px]"
                style={{
                  background: sunnyOnly ? 'var(--color-primary-light)' : 'var(--color-surface)',
                  border: `1px solid ${sunnyOnly ? 'var(--color-primary-border)' : 'var(--color-border)'}`,
                  color: sunnyOnly ? 'var(--color-primary)' : 'var(--color-text-3)',
                }}
              >
                <span>☀</span> Sunny only
              </button>
            )}
            {kind === 'restaurants' && (
              <select
                value={cuisine}
                onChange={(e) => { setCuisine(e.target.value); setPage(0); }}
                className="px-3 py-2 rounded-full text-xs text-text-2 transition-colors min-h-[36px]"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <option value="">All cuisines</option>
                {['bar', 'belgian', 'burger', 'french', 'italian', 'asian', 'pizza', 'sushi', 'vegetarian', 'restaurant'].map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            )}
            {kind !== 'events' && (
              <div
                className="flex items-center gap-2.5 px-3 py-2 rounded-full min-h-[36px]"
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
              {total.toLocaleString()} {kind}{page > 0 && ` · page ${page + 1} of ${totalPages}`}
            </p>
          )}

          {/* Results */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl shimmer" style={{ animationDelay: `${i * 0.06}s` }} />
              ))}
            </div>
          )}
          {!isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {kind === 'terraces' && (terrasQuery.data?.['hydra:member'] ?? []).map((item) => (
                <TerrasCard key={item.uuid} item={item} />
              ))}
              {kind === 'restaurants' && (restaurantQuery.data?.['hydra:member'] ?? []).map((item) => (
                <RestaurantCard key={item.uuid} item={item} />
              ))}
              {kind === 'events' && (eventQuery.data?.['hydra:member'] ?? []).map((item) => (
                <EventCard key={item.uuid} item={item} />
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoading && total === 0 && (
            <Card variant="cream" padding="lg" radius="2xl" className="text-center">
              <p className="font-display text-text-1" style={{ fontSize: '1.25rem' }}>Nothing here yet</p>
              <p className="text-sm text-text-3 mt-2">Try clearing the filters or searching for something else.</p>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2.5 text-sm font-medium rounded-full disabled:opacity-40 transition-all hover:-translate-y-0.5 min-h-[44px]"
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
                className="px-4 py-2.5 text-sm font-medium rounded-full disabled:opacity-40 transition-all hover:-translate-y-0.5 min-h-[44px]"
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
        </section>

        <div className="h-12" />
      </div>
    </div>
  );
}
