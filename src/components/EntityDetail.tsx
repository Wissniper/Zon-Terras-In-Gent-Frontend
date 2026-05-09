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
  /** When the spot first crosses 40% intensity today, if any. */
  bestTimeStart?: Date;
  /** When intensity drops back below 40% today, if any. */
  bestTimeEnd?: Date;
}

interface Props {
  kind: Kind;
  isLoading: boolean;
  isError: boolean;
  title?: string;
  address?: string;
  category?: { label: string; tone: 'gold' | 'sky' | 'terra' | 'sage' };
  description?: string;
  intensity?: number;
  sun?: SunSummary;
  rows?: DetailRow[];
  links?: DetailLink[];
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
 * Build the editorial "When to go" sentence from the available sun data.
 * Falls back to a generic line when we don't have intensity-vs-time data.
 */
function whenToGoLine(sun: SunSummary | undefined, intensity: number | undefined): string | null {
  if (!sun) return null;
  if (sun.bestTimeStart && sun.bestTimeEnd) {
    return `Catch the sun here from ${fmtTime(sun.bestTimeStart)} to ${fmtTime(sun.bestTimeEnd)} today.`;
  }
  if (sun.goldenHourEvening) {
    return `Golden hour lands at ${fmtTime(sun.goldenHourEvening.start)} — stay through to ${fmtTime(sun.goldenHourEvening.end)}.`;
  }
  if (intensity != null) {
    if (intensity >= 70) return 'Full sun right now — pull up a chair.';
    if (intensity >= 40) return 'Partial sun right now. Comfortable for a quick coffee.';
    if (intensity >= 1)  return 'Mostly shaded right now. Better light later in the day.';
    return 'In shadow right now. The sun is below the horizon or fully blocked.';
  }
  return null;
}

/**
 * One detail surface for terraces, restaurants and events.
 *
 * Layout:
 *   • Soft atmospheric backdrop.
 *   • Headline + address, with a category pill on the right.
 *   • Single-line editorial answer ("Catch the sun here from 16:00 to 19:30").
 *   • Centred intensity ring.
 *   • Optional sun stat strip (altitude, azimuth, golden hour).
 *   • Optional descriptive paragraph.
 *   • Optional detail rows (phone, hours, dates).
 *   • Action chips at the bottom.
 *
 * Replaces the three near-identical detail pages with one config-driven view.
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
          style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
        >
          Back to map
        </button>
      </div>
    );
  }

  const editorialLine = whenToGoLine(sun, intensity);

  return (
    <div className="flex-1 overflow-y-auto bg-atmospheric">
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-8">
        <BackButton />

        {/* HERO ───────────────────────────────────────── */}
        <article className="mt-3 fade-up">
          {category && (
            <Pill tone={category.tone} className="capitalize mb-4">
              {category.label}
            </Pill>
          )}

          <h1 className="font-display font-semibold text-text-1 leading-[1.02] text-fluid-hero tracking-tight">
            {title}
          </h1>

          {address && (
            <p className="text-text-3 mt-3 text-fluid-base">{address}</p>
          )}

          {/* Editorial answer line */}
          {editorialLine && (
            <p
              className="font-display text-text-1 mt-7 leading-snug fade-up fade-up-delay-1"
              style={{ fontSize: '1.4rem', maxWidth: '32ch' }}
            >
              {editorialLine}
            </p>
          )}

          {/* Intensity ring */}
          {intensity != null && (
            <div className="mt-9 flex flex-col items-center fade-up fade-up-delay-2">
              <IntensityRing value={intensity} size={220} caption="right now" />

              {sun && (
                <div className="grid grid-cols-2 gap-2.5 w-full mt-7">
                  <Stat label="Sun altitude" value={`${Math.round(sun.altitudeDeg)}°`} />
                  <Stat label="Sun azimuth"  value={`${Math.round(sun.azimuthDeg)}°`} />
                  {sun.goldenHourMorning && (
                    <Stat
                      label="Morning gold"
                      value={fmtTime(sun.goldenHourMorning.start)}
                      sub={`until ${fmtTime(sun.goldenHourMorning.end)}`}
                      emphasis="highlight"
                    />
                  )}
                  {sun.goldenHourEvening && (
                    <Stat
                      label="Evening gold"
                      value={fmtTime(sun.goldenHourEvening.start)}
                      sub={`until ${fmtTime(sun.goldenHourEvening.end)}`}
                      emphasis="highlight"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {description && (
            <>
              <div className="editorial-rule my-9" />
              <p className="text-text-2 leading-relaxed text-fluid-lg max-w-prose">
                {description}
              </p>
            </>
          )}
        </article>

        {/* DETAIL ROWS ─────────────────────────────────── */}
        {rows && rows.length > 0 && (
          <section className="mt-10 fade-up fade-up-delay-3">
            <p className="eyebrow mb-3">Details</p>
            <Card variant="surface" radius="2xl" padding="lg">
              <div>
                {rows.map((row, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    style={i === 0 ? undefined : { borderTop: '1px solid var(--color-border)' }}
                  >
                    <span className="eyebrow shrink-0 pt-0.5" style={{ minWidth: 90 }}>{row.label}</span>
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
          </section>
        )}

        {/* ACTIONS ─────────────────────────────────────── */}
        {(mapState || (links && links.length > 0)) && (
          <div className="flex flex-wrap gap-2.5 mt-8 fade-up fade-up-delay-3">
            {mapState && (
              <button
                onClick={() => navigate('/', { state: mapState })}
                className="text-sm font-semibold px-5 py-3 rounded-full transition-all min-h-[44px] inline-flex items-center gap-2"
                style={{
                  background: 'var(--color-primary)', color: 'var(--color-on-primary)',
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
                className="text-sm font-medium px-5 py-3 rounded-full transition-colors min-h-[44px] inline-flex items-center gap-2"
                style={l.primary ? {
                  background: 'var(--color-primary)', color: 'var(--color-on-primary)',
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

        <div className="h-14" />
      </div>
    </div>
  );
}
