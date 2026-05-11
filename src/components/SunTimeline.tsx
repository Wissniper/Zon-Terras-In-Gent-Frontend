import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { useSelectedTime } from '../contexts/TimeContext';
import { useWeatherData } from '../hooks/useWeatherData';

type Orientation = 'horizontal' | 'vertical';

const HOURS = 48;
const SPAN_MS = HOURS * 60 * 60 * 1000;
const STEP_MS = 15 * 60 * 1000;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Sky brightness at a given hour-of-day, 0-100.
 * Peaks ~13:00, fades to 0 outside 5:30-21:30.
 */
function skyAt(hour: number): number {
  if (hour < 5.5 || hour > 21.5) return 0;
  return Math.max(0, Math.round(100 - ((hour - 13) / 8) ** 2 * 100));
}

/**
 * Map an hour's sky-light value to a sky colour.
 * Walks: night → dawn → daylight → dusk → night.
 */
function colorForHour(hour: number, sky: number, cloudFactor: number): string {
  const adj = sky * cloudFactor;
  if (hour >= 5.5 && hour <= 8 && adj > 5)   return '#FFD9A8';      // dawn
  if (hour >= 19 && hour <= 21.5 && adj > 5) return '#E8855A';      // dusk
  if (adj > 60) return '#FBE4D5';                                   // bright noon
  if (adj > 30) return '#F5D5C3';                                   // gentle day
  if (adj > 5)  return '#8B7758';                                   // grey day / haze
  return '#1A0F08';                                                 // night
}

function useTrackGradient(anchorMs: number, orientation: Orientation): string {
  const { data: weather } = useWeatherData();
  const cloudFactor = (100 - (weather?.cloudCover ?? 0)) / 100;

  return useMemo(() => {
    const dir = orientation === 'horizontal' ? 'to right' : 'to bottom';
    const stops: string[] = [];
    const STEPS = 48;
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const ms = anchorMs + t * SPAN_MS;
      const d = new Date(ms);
      const h = d.getHours() + d.getMinutes() / 60;
      stops.push(`${colorForHour(h, skyAt(h), cloudFactor)} ${(t * 100).toFixed(2)}%`);
    }
    return `linear-gradient(${dir}, ${stops.join(', ')})`;
  }, [anchorMs, orientation, cloudFactor]);
}

/**
 * Compact label for an inner tick — short enough to never overflow.
 * Uses absolute "HH:00" so the slider always reads as a real clock.
 */
function compactLabel(target: Date): string {
  const hh = String(target.getHours()).padStart(2, '0');
  return `${hh}:00`;
}

interface Props {
  orientation?: Orientation;
}

export default function SunTimeline({ orientation = 'horizontal' }: Props) {
  const { selectedTime, setSelectedTime } = useSelectedTime();

  // Anchor = current hour, refreshed every minute.
  const [anchorMs, setAnchorMs] = useState(() => {
    const d = new Date(); d.setMinutes(0, 0, 0); return d.getTime();
  });
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date(); d.setMinutes(0, 0, 0);
      setAnchorMs((prev) => (d.getTime() !== prev ? d.getTime() : prev));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const trackGradient = useTrackGradient(anchorMs, orientation);
  const selectedMs = new Date(selectedTime).getTime();
  const baseFraction = clamp((selectedMs - anchorMs) / SPAN_MS, 0, 1);
  // While dragging, the thumb is driven by `dragFraction` so the pointer feels
  // glued to the cursor without committing to TimeContext on every snap —
  // every commit invalidates downstream sun/leaderboard/search queries.
  // We commit exactly once on pointer up.
  const [dragFraction, setDragFraction] = useState<number | null>(null);
  const fraction = dragFraction ?? baseFraction;

  // Auto-tick when the user is "live" — i.e. the selected time is within a
  // few minutes of real wall-clock time. Without this the displayed clock
  // freezes at the value it had when the page loaded (or when "Now" was last
  // pressed) and only updates on refresh.
  // Snap to the minute and skip the update when the rounded value hasn't
  // changed — every change to selectedTime invalidates downstream queries
  // (useSunPosition, useTerrasSunData, etc.), so per-second precision would
  // refetch the backend every tick.
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      if (Math.abs(now - new Date(selectedTime).getTime()) < 5 * 60_000) {
        const rounded = new Date(Math.floor(now / 60_000) * 60_000).toISOString();
        if (rounded !== selectedTime) setSelectedTime(rounded);
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [selectedTime, setSelectedTime]);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  const fractionFromEvent = useCallback((cx: number, cy: number) => {
    const el = trackRef.current; if (!el) return 0;
    const r = el.getBoundingClientRect();
    return orientation === 'horizontal'
      ? clamp((cx - r.left) / Math.max(1, r.width), 0, 1)
      : clamp((cy - r.top)  / Math.max(1, r.height), 0, 1);
  }, [orientation]);

  const applyFraction = useCallback((f: number) => {
    const raw = anchorMs + f * SPAN_MS;
    const snapped = Math.round(raw / STEP_MS) * STEP_MS;
    setSelectedTime(new Date(snapped).toISOString());
  }, [anchorMs, setSelectedTime]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true; setDragging(true);
    setDragFraction(fractionFromEvent(e.clientX, e.clientY));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    setDragFraction(fractionFromEvent(e.clientX, e.clientY));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (draggingRef.current) {
      // Commit the final position once — read fraction straight from the
      // event so we don't depend on the latest setDragFraction having flushed.
      applyFraction(fractionFromEvent(e.clientX, e.clientY));
    }
    draggingRef.current = false; setDragging(false);
    setDragFraction(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const fwd = orientation === 'horizontal'
      ? (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0)
      : (e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0);
    if (!fwd) return;
    e.preventDefault();
    const stepMs = e.shiftKey ? STEP_MS * 4 : STEP_MS;
    applyFraction(clamp((selectedMs - anchorMs + fwd * stepMs) / SPAN_MS, 0, 1));
  };

  // Five fixed ticks: 0h Now · 12h HH:00 · 24h Tomorrow · 36h HH:00 · 48h +2d
  // Inner ticks use absolute clock time, day-rollover ticks use plain words.
  // Edge ticks (0h, 48h) align to the rail edge so labels never overflow.
  const ticks = useMemo(() => {
    return [0, 12, 24, 36, 48].map((hOffset) => {
      const ts = new Date(anchorMs + hOffset * 60 * 60 * 1000);
      let label: string;
      if (hOffset === 0)       label = 'Now';
      else if (hOffset === 24) label = 'Tomorrow';
      else if (hOffset === 48) label = '+2 days';
      else                     label = compactLabel(ts);

      const align: 'start' | 'center' | 'end' =
        hOffset === 0 ? 'start' : hOffset === 48 ? 'end' : 'center';

      return {
        pct: (hOffset / HOURS) * 100,
        label,
        major: hOffset % 24 === 0,
        align,
      };
    });
  }, [anchorMs]);

  // Headline mirrors the thumb: during drag it follows the pointer (snapped to
  // STEP_MS) so the user sees the time they'll land on, then sticks to the
  // committed value once they release.
  const displayMs = dragFraction !== null
    ? Math.round((anchorMs + dragFraction * SPAN_MS) / STEP_MS) * STEP_MS
    : selectedMs;
  const displayDate = new Date(displayMs);
  const displayTime = displayDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const dayDelta = Math.floor(
    (new Date(displayMs).setHours(0, 0, 0, 0) - new Date(anchorMs).setHours(0, 0, 0, 0)) / 86_400_000
  );
  const dayLabel = dayDelta === 0 ? 'Today' : dayDelta === 1 ? 'Tomorrow' : `+${dayDelta}d`;

  const onNow = () => setSelectedTime(new Date(Date.now()).toISOString());

  // ── HORIZONTAL ─────────────────────────────────────
  if (orientation === 'horizontal') {
    return (
      <div className="px-5 sm:px-7 py-5 select-none" style={{
        background: 'var(--color-map-overlay)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--color-map-overlay-border)',
      }}>
        <div className="max-w-screen-2xl mx-auto">
          {/* Headline strip */}
          <div className="flex items-baseline justify-between gap-4 mb-4">
            <div>
              <p className="eyebrow" style={{ color: 'var(--color-text-3)' }}>Sun timeline</p>
              <p className="font-display tabular-nums mt-1" style={{
                fontSize: '1.25rem', lineHeight: 1, color: 'var(--color-primary)',
                letterSpacing: '-0.01em',
              }}>
                {dayLabel} <span className="text-text-3" style={{ color: 'var(--color-text-2)' }}>·</span> {displayTime}
              </p>
            </div>
            <button
              onClick={onNow}
              className="text-xs font-semibold tracking-wide uppercase px-3 py-1.5 rounded-full transition-all"
              style={{
                color: 'var(--color-primary)',
                background: 'var(--color-primary-light)',
                border: '1px solid var(--color-primary-border)',
              }}
            >
              Now
            </button>
          </div>

          {/* Track */}
          <div
            ref={trackRef}
            role="slider"
            aria-label="Time of day"
            aria-valuemin={0}
            aria-valuemax={HOURS}
            aria-valuenow={Math.round(fraction * HOURS)}
            aria-valuetext={`${dayLabel} ${displayTime}`}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
            className="relative outline-none"
            style={{ height: 32, cursor: dragging ? 'grabbing' : 'pointer', touchAction: 'none' }}
          >
            <div
              className="absolute left-0 right-0 rounded-full"
              style={{
                top: '50%', transform: 'translateY(-50%)',
                height: 10, background: trackGradient,
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
              }}
            />
            {/* Glow trail to selected */}
            <div
              className="absolute rounded-full"
              style={{
                top: '50%', transform: 'translateY(-50%)',
                left: 0, width: `${fraction * 100}%`, height: 10,
                background: 'linear-gradient(to right, rgba(255,181,84,0), rgba(255,181,84,0.35))',
                pointerEvents: 'none',
              }}
            />
            {ticks.map((t) => (
              <div
                key={t.pct}
                className="absolute pointer-events-none"
                style={{
                  left: `${t.pct}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 2, height: t.major ? 18 : 10,
                  background: 'var(--color-text-3)',
                  borderRadius: 999,
                }}
              />
            ))}
            {/* Thumb */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${fraction * 100}%`,
                top: '50%',
                transform: `translate(-50%, -50%) scale(${dragging ? 1.18 : 1})`,
                transition: dragging ? 'transform 0.08s' : 'transform 0.2s',
                width: 26, height: 26, borderRadius: '50%',
                background: 'radial-gradient(circle at 33% 33%, #FFD075, #ED8A1F 70%)',
                border: '2.5px solid #FFFFFF',
                boxShadow: dragging
                  ? '0 6px 26px rgba(237,138,31,0.6), 0 0 0 8px rgba(237,138,31,0.18)'
                  : '0 3px 14px rgba(237,138,31,0.45)',
              }}
            />
          </div>

          {/* Tick labels — first/last clamp to the rail edge so they can't overflow */}
          <div className="relative mt-3" style={{ height: 16 }}>
            {ticks.map((t) => {
              const transform =
                t.align === 'start' ? 'translateX(0)' :
                t.align === 'end'   ? 'translateX(-100%)' :
                                      'translateX(-50%)';
              return (
              <span
                key={t.pct}
                className="absolute pointer-events-none"
                style={{
                  left: `${t.pct}%`,
                  transform,
                  fontSize: t.major ? 10.5 : 10,
                  fontWeight: t.major ? 600 : 500,
                  color: t.major ? 'var(--color-primary)' : 'var(--color-text-2)',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                }}
              >
                {t.label}
              </span>);
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── VERTICAL (mobile drawer) ───────────────────────
  return (
    <div className="flex flex-1 min-h-0 px-3 py-4 gap-3 select-none relative" style={{ background: 'var(--color-map-overlay)' }}>
      <button
        onClick={onNow}
        className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full transition-all z-10"
        style={{
          color: 'var(--color-primary)',
          background: 'rgba(237,138,31,0.18)',
          border: '1px solid rgba(237,138,31,0.32)',
        }}
      >
        Now
      </button>
      <div className="absolute" style={{ top: 38, right: 12, textAlign: 'right' }}>
        <p className="text-[10px] font-medium" style={{ color: 'var(--color-text-3)' }}>{dayLabel}</p>
        <p className="font-display tabular-nums" style={{
          fontSize: '0.95rem', lineHeight: 1.1, color: 'var(--color-primary)',
        }}>{displayTime}</p>
      </div>

      <div
        ref={trackRef}
        role="slider"
        aria-label="Time of day"
        aria-valuemin={0}
        aria-valuemax={HOURS}
        aria-valuenow={Math.round(fraction * HOURS)}
        aria-valuetext={`${dayLabel} ${displayTime}`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="relative outline-none mt-24 mb-3"
        style={{ width: 32, flexShrink: 0, cursor: dragging ? 'grabbing' : 'pointer', touchAction: 'none' }}
      >
        <div
          className="absolute rounded-full"
          style={{
            left: '50%', transform: 'translateX(-50%)',
            top: 0, bottom: 0, width: 10,
            background: trackGradient,
            boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.3)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            left: '50%', transform: 'translateX(-50%)',
            top: 0, height: `${fraction * 100}%`, width: 10,
            background: 'linear-gradient(to bottom, rgba(255,181,84,0), rgba(255,181,84,0.4))',
            pointerEvents: 'none',
          }}
        />
        {ticks.map((t) => (
          <div
            key={t.pct}
            className="absolute pointer-events-none"
            style={{
              top: `${t.pct}%`,
              left: '50%',
              transform: 'translate(-50%, -50%)',
              height: 2, width: t.major ? 18 : 10,
              background: 'var(--color-text-3)',
              borderRadius: 999,
            }}
          />
        ))}
        <div
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: `${fraction * 100}%`,
            transform: `translate(-50%, -50%) scale(${dragging ? 1.18 : 1})`,
            transition: dragging ? 'transform 0.08s' : 'transform 0.2s',
            width: 26, height: 26, borderRadius: '50%',
            background: 'radial-gradient(circle at 33% 33%, #FFD075, #ED8A1F 70%)',
            border: '2.5px solid #FFFFFF',
            boxShadow: dragging
              ? '0 6px 26px rgba(237,138,31,0.6), 0 0 0 8px rgba(237,138,31,0.18)'
              : '0 3px 14px rgba(237,138,31,0.45)',
          }}
        />
      </div>

      <div className="relative flex-1 mt-24 mb-3">
        {ticks.map((t) => {
          const transform =
            t.align === 'start' ? 'translateY(0)' :
            t.align === 'end'   ? 'translateY(-100%)' :
                                  'translateY(-50%)';
          return (
            <span
              key={t.pct}
              className="absolute pointer-events-none leading-tight"
              style={{
                top: `${t.pct}%`,
                left: 4,
                transform,
                fontSize: t.major ? 10 : 9.5,
                fontWeight: t.major ? 600 : 500,
                color: t.major ? 'var(--color-primary)' : 'var(--color-text-2)',
                maxWidth: '90%',
              }}
            >
              {t.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
