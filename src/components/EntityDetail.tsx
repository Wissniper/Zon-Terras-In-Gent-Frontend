import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import Card from './ui/Card';
import Pill from './ui/Pill';
import Stat from './ui/Stat';
import IntensityRing from './ui/IntensityRing';
import BackButton from './ui/BackButton';

type Kind = 'terras' | 'restaurant' | 'event';

export interface DetailLink {
  href: string;
  label: string;
  primary?: boolean;
  external?: boolean;
}

export interface DetailRow {
  label: string;
  value: ReactNode;
  href?: string;
}

interface SunSummary {
  altitudeDeg: number;
  azimuthDeg: number;
  goldenHourEvening?: { start: Date; end: Date };
  goldenHourMorning?: { start: Date; end: Date };
}

interface Props {
  kind: Kind;
  /** Loading flag from the parent's react-query. */
  isLoading: boolean;
  isError: boolean;
  /** Headline (terras name, restaurant name, event title). */
  title?: string;
  /** Address — sub-headline. */
  address?: string;
  /** Right-rail category pill (e.g. cuisine for restaurants). */
  category?: { label: string; tone: 'gold' | 'sky' | 'terra' | 'sage' };
  /** Optional descriptive paragraph. */
  description?: string;
  /** Sun intensity 0-100. Omit to skip the hero ring (e.g. for events without forecast). */
  intensity?: number;
  /** Live sun-position summary; rendered as a small stat strip below the ring. */
  sun?: SunSummary;
  /** Specific detail rows below the hero (phone, hours, takeaway, dates...). */
  rows?: DetailRow[];
  /** Action chips: "View on map", "Visit website", "OSM" etc. */
  links?: DetailLink[];
  /** Map deep-link state for the "View on map" button. */
  mapState?: { focusId: string; type: 'terras' | 'restaurant' | 'event' };
}

const kindMeta: Record<Kind, { fallbackTitle: string; notFound: string }> = {
  terras:     { fallbackTitle: 'Terrace',     notFound: 'Terrace not found.' },
  restaurant: { fallbackTitle: 'Restaurant',  notFound: 'Restaurant not found.' },
  event:      { fallbackTitle: 'Event',       notFound: 'Event not found.' },
};

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/**
 * One detail surface for terraces, restaurants and events.
 *
 * Layout:
 *   • Soft atmospheric backdrop (cream + warm radial glow).
 *   • Headline + address, with a category pill on the right.
 *   • Centred IntensityRing as the hero ("how sunny is it right now?").
 *   • Sun stat strip (altitude, golden hour) when available.
 *   • Optional description paragraph.
 *   • Detail rows (phone, hours, dates...).
 *   • Action chips at the bottom.
 *
 * Replaces TerrasDetailPage / RestaurantDetailPage / EventDetailPage which
 * were 95% the same component with diverging inline styles.
 */
export default function EntityDetail({
  kind, isLoading, isError, title, address, category, description,
  intensity, sun, rows, links, mapState,
}: Props) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex-1 bg-atmospheric flex items-center justify-center">
        <div
          className="w-9 h-9 rounded-full animate-spin"
          style={{ border: '3px solid var(--color-primary-light)', borderTopColor: 'var(--color-primary)' }}
        />
      </div>
    );
  }

  if (isError || !title) {
    return (
      <div className="flex-1 bg-atmospheric flex flex-col items-center justify-center text-center px-6">
        <p className="font-display text-fluid-xl text-text-1">{kindMeta[kind].notFound}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{ background: 'var(--color-primary)', color: '#fff' }}
        >
          Back to map
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-atmospheric">
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-6">

        <BackButton />

        {/* HERO ───────────────────────────────────────── */}
        <Card variant="surface" radius="2xl" padding="lg" className="fade-up mt-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display font-semibold text-text-1 text-fluid-3xl leading-[1.05] tracking-tight">
                {title}
              </h1>
              {address && (
                <p className="text-sm text-text-3 mt-2">{address}</p>
              )}
            </div>
            {category && (
              <Pill tone={category.tone} size="md" className="shrink-0 mt-1 capitalize">
                {category.label}
              </Pill>
            )}
          </div>

          {/* Intensity hero ring */}
          {intensity != null && (
            <div className="mt-8 flex flex-col items-center fade-up fade-up-delay-1">
              <IntensityRing value={intensity} size={220} caption="right now" />

              {/* Sun stat strip — only when we have the data */}
              {sun && (
                <div className="grid grid-cols-2 gap-2.5 w-full mt-7">
                  <Stat label="Sun altitude" value={`${Math.round(sun.altitudeDeg)}°`} />
                  <Stat label="Sun azimuth"  value={`${Math.round(sun.azimuthDeg)}°`} />
                  {sun.goldenHourMorning && (
                    <Stat
                      label="Morning gold"
                      value={`${fmtTime(sun.goldenHourMorning.start)}`}
                      sub={`until ${fmtTime(sun.goldenHourMorning.end)}`}
                      emphasis="highlight"
                    />
                  )}
                  {sun.goldenHourEvening && (
                    <Stat
                      label="Evening gold"
                      value={`${fmtTime(sun.goldenHourEvening.start)}`}
                      sub={`until ${fmtTime(sun.goldenHourEvening.end)}`}
                      emphasis="highlight"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-text-2 leading-relaxed mt-7 text-fluid-base">
              {description}
            </p>
          )}
        </Card>

        {/* DETAIL ROWS ─────────────────────────────────── */}
        {rows && rows.length > 0 && (
          <Card variant="surface" radius="2xl" padding="lg" className="fade-up fade-up-delay-2 mt-4">
            <p className="eyebrow mb-3">Details</p>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {rows.map((row, i) => (
                <div key={i} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                     style={{ borderTop: i === 0 ? 'none' : '1px solid var(--color-border)' }}>
                  <span className="eyebrow shrink-0 pt-0.5" style={{ minWidth: 80 }}>{row.label}</span>
                  {row.href ? (
                    <a
                      href={row.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-right break-words transition-colors"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {row.value}
                    </a>
                  ) : (
                    <span className="text-sm text-text-1 text-right break-words">{row.value}</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ACTION CHIPS ────────────────────────────────── */}
        {(mapState || (links && links.length > 0)) && (
          <div className="flex flex-wrap gap-2.5 mt-5 fade-up fade-up-delay-3">
            {mapState && (
              <button
                onClick={() => navigate('/', { state: mapState })}
                className="text-sm font-medium px-4 py-2.5 rounded-lg transition-all min-h-[44px] flex items-center gap-2"
                style={{
                  background: 'var(--color-primary)', color: '#fff',
                  boxShadow: 'var(--shadow-amber)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                Show on map
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </button>
            )}
            {links?.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target={l.external ? '_blank' : undefined}
                rel={l.external ? 'noopener noreferrer' : undefined}
                className="text-sm font-medium px-4 py-2.5 rounded-lg transition-colors min-h-[44px] flex items-center gap-2"
                style={l.primary ? {
                  background: 'var(--color-primary)', color: '#fff',
                  boxShadow: 'var(--shadow-amber)',
                } : {
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-2)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {l.label}
                {l.external && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                )}
              </a>
            ))}
          </div>
        )}

        <div className="h-10" />
      </div>
    </div>
  );
}
