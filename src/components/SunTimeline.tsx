import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { useSelectedTime } from '../contexts/TimeContext';
import { useWeatherData } from '../hooks/useWeatherData';

type Orientation = 'horizontal' | 'vertical';

const HOURS = 48;
const SPAN_MS = HOURS * 60 * 60 * 1000;
const STEP_MS = 15 * 60 * 1000; // 15-minute snap

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Sky brightness across one day, peaking ~13:00. 0..100.
function skyAt(hour: number): number {
  if (hour < 5.5 || hour > 21.5) return 0;
  return Math.max(0, Math.round(100 - ((hour - 13) / 8) ** 2 * 100));
}

function colorForSky(sky: number): string {
  if (sky > 60) return '#F5AC32';
  if (sky > 30) return '#F5DFA0';
  if (sky > 5)  return '#6E5A40';
  return '#1F1810';
}

// Build "to right" (or "to bottom") gradient sampled from anchorMs across SPAN_MS,
// modulated by current cloud factor so overcast days darken the bar.
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
      const h = (new Date(ms).getHours() + new Date(ms).getMinutes() / 60);
      const sky = skyAt(h) * cloudFactor;
      stops.push(`${colorForSky(sky)} ${(t * 100).toFixed(2)}%`);
    }
    return `linear-gradient(${dir}, ${stops.join(', ')})`;
  }, [anchorMs, orientation, cloudFactor]);
}

interface Props {
  orientation?: Orientation;
}

/**
 * Sun-position scrubber. Anchored at the current hour and spans 48h forward.
 *
 * Implementation note: built on raw pointer events instead of <input type="range">.
 * The native input (especially when CSS-rotated for the vertical layout) inverted
 * touch direction on mobile — the fill grew the opposite way the thumb dragged.
 * Owning the pointer math here keeps fill, thumb, and value perfectly in sync on
 * any device or orientation.
 */
export default function SunTimeline({ orientation = 'horizontal' }: Props) {
  const { selectedTime, setSelectedTime } = useSelectedTime();

  // Re-anchor every minute so "Now" tracks real time even if the page is left open.
  const [anchorMs, setAnchorMs] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return d.getTime();
  });
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      d.setMinutes(0, 0, 0);
      setAnchorMs((prev) => (d.getTime() !== prev ? d.getTime() : prev));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const trackGradient = useTrackGradient(anchorMs, orientation);

  // Selected time → fraction within [0, 1] across the 48h window.
  const selectedMs = new Date(selectedTime).getTime();
  const fraction = clamp((selectedMs - anchorMs) / SPAN_MS, 0, 1);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  const fractionFromEvent = useCallback(
    (clientX: number, clientY: number): number => {
      const el = trackRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      if (orientation === 'horizontal') {
        return clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
      }
      return clamp((clientY - rect.top) / Math.max(1, rect.height), 0, 1);
    },
    [orientation],
  );

  const applyFraction = useCallback(
    (f: number) => {
      const raw = anchorMs + f * SPAN_MS;
      const snapped = Math.round(raw / STEP_MS) * STEP_MS;
      setSelectedTime(new Date(snapped).toISOString());
    },
    [anchorMs, setSelectedTime],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    setDragging(true);
    applyFraction(fractionFromEvent(e.clientX, e.clientY));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    applyFraction(fractionFromEvent(e.clientX, e.clientY));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // Keyboard accessibility: arrow keys nudge by 15 min, shift = 1h.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const fwd = orientation === 'horizontal'
      ? (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0)
      : (e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0);
    if (!fwd) return;
    e.preventDefault();
    const stepMs = e.shiftKey ? STEP_MS * 4 : STEP_MS;
    applyFraction(clamp((selectedMs - anchorMs + fwd * stepMs) / SPAN_MS, 0, 1));
  };

  // Major ticks every 12 hours: 0h, 12h, 24h, 36h, 48h.
  const ticks = useMemo(() => {
    return [0, 12, 24, 36, 48].map((hOffset) => {
      const ts = new Date(anchorMs + hOffset * 60 * 60 * 1000);
      const hh = String(ts.getHours()).padStart(2, '0');
      const dayOffset = Math.floor(hOffset / 24);
      let label: string;
      if (hOffset === 0) label = 'Now';
      else if (hOffset === 24) label = 'Tomorrow';
      else if (hOffset === 48) label = `+2d`;
      else label = `${hh}:00`;
      return {
        pct: (hOffset / HOURS) * 100,
        label,
        major: hOffset === 0 || hOffset % 24 === 0,
        dayOffset,
      };
    });
  }, [anchorMs]);

  // Time display
  const selectedDate = new Date(selectedMs);
  const displayTime = selectedDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const dayDelta = Math.floor((selectedMs - anchorMs) / (24 * 60 * 60 * 1000));
  const displayDay =
    dayDelta === 0 ? 'Today' : dayDelta === 1 ? 'Tomorrow' : `+${dayDelta}d`;

  const onNow = () => {
    const now = Date.now();
    setSelectedTime(new Date(now).toISOString());
  };

  if (orientation === 'horizontal') {
    return (
      <div
        className="shrink-0 px-6 py-4 select-none"
        style={{ background: 'var(--color-sidebar)', borderTop: '1px solid var(--color-sidebar-border)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-label" style={{ color: 'var(--color-sidebar-accent)' }}>
            Sun Timeline
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onNow}
              className="transition-colors"
              style={{
                fontSize: 10, fontWeight: 700, color: 'var(--color-sidebar-brand)',
                background: 'rgba(229,135,10,0.15)', border: '1px solid rgba(229,135,10,0.4)',
                borderRadius: 6, padding: '3px 8px', cursor: 'pointer', lineHeight: 1.4,
              }}
            >
              Now
            </button>
            <span className="text-xs font-medium" style={{ color: 'var(--color-sidebar-accent)' }}>{displayDay}</span>
            <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--color-sidebar-brand)' }}>
              {displayTime}
            </span>
          </div>
        </div>

        {/* Track + thumb (one element captures all pointer events) */}
        <div
          ref={trackRef}
          role="slider"
          aria-label="Time of day"
          aria-valuemin={0}
          aria-valuemax={HOURS}
          aria-valuenow={Math.round(fraction * HOURS)}
          aria-valuetext={`${displayDay} ${displayTime}`}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          className="relative outline-none"
          style={{
            height: 30,
            cursor: dragging ? 'grabbing' : 'pointer',
            touchAction: 'none', // prevents scroll-jacking on touch
          }}
        >
          {/* Track — sky gradient, vertically centered */}
          <div
            className="absolute left-0 right-0 rounded-full"
            style={{
              top: '50%', transform: 'translateY(-50%)',
              height: 8, background: trackGradient,
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.25)',
            }}
          />
          {/* Subtle "now → selected" accent */}
          <div
            className="absolute rounded-full"
            style={{
              top: '50%', transform: 'translateY(-50%)',
              left: 0, width: `${fraction * 100}%`, height: 8,
              background: 'linear-gradient(to right, rgba(245,172,50,0.0), rgba(245,172,50,0.35))',
              pointerEvents: 'none',
            }}
          />
          {/* Tick markers */}
          {ticks.map((t) => (
            <div
              key={t.pct}
              className="absolute pointer-events-none"
              style={{
                left: `${t.pct}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 2, height: t.major ? 14 : 8,
                background: t.major ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)',
                borderRadius: 1,
              }}
            />
          ))}
          {/* Thumb */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${fraction * 100}%`,
              top: '50%',
              transform: `translate(-50%, -50%) scale(${dragging ? 1.15 : 1})`,
              transition: dragging ? 'transform 0.08s' : 'transform 0.18s',
              width: 22, height: 22, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #FFD37A, #E5870A)',
              border: '2.5px solid #FFFFFF',
              boxShadow: dragging
                ? '0 4px 18px rgba(229,135,10,0.7), 0 0 0 6px rgba(229,135,10,0.15)'
                : '0 2px 10px rgba(229,135,10,0.45)',
            }}
          />
        </div>

        {/* Tick labels */}
        <div className="relative mt-2" style={{ height: 14 }}>
          {ticks.map((t) => (
            <span
              key={t.pct}
              className="absolute pointer-events-none tabular-nums"
              style={{
                left: `${t.pct}%`,
                transform: 'translateX(-50%)',
                fontSize: t.major ? 10 : 9,
                fontWeight: t.major ? 700 : 500,
                color: t.major ? 'var(--color-sidebar-brand)' : 'var(--color-sidebar-accent)',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ── Vertical (mobile drawer) ────────────────────────────────────────────
  return (
    <div className="flex flex-1 min-h-0 px-2 py-3 gap-2 select-none" style={{ background: 'var(--color-sidebar)', position: 'relative' }}>
      <button
        onClick={onNow}
        style={{
          position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 700,
          color: 'var(--color-sidebar-brand)', background: 'rgba(229,135,10,0.15)',
          border: '1px solid rgba(229,135,10,0.4)', borderRadius: 6, padding: '3px 7px',
          cursor: 'pointer', lineHeight: 1.4, zIndex: 10,
        }}
      >
        Now
      </button>
      <div className="absolute" style={{ top: 38, right: 8, textAlign: 'right' }}>
        <p className="text-[10px] font-medium" style={{ color: 'var(--color-sidebar-accent)' }}>{displayDay}</p>
        <p className="text-sm font-semibold tabular-nums" style={{ color: 'var(--color-sidebar-brand)' }}>{displayTime}</p>
      </div>

      {/* Vertical track */}
      <div
        ref={trackRef}
        role="slider"
        aria-label="Time of day"
        aria-valuemin={0}
        aria-valuemax={HOURS}
        aria-valuenow={Math.round(fraction * HOURS)}
        aria-valuetext={`${displayDay} ${displayTime}`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="relative outline-none mt-20 mb-2"
        style={{
          width: 30,
          flexShrink: 0,
          cursor: dragging ? 'grabbing' : 'pointer',
          touchAction: 'none',
        }}
      >
        {/* Track */}
        <div
          className="absolute rounded-full"
          style={{
            left: '50%', transform: 'translateX(-50%)',
            top: 0, bottom: 0, width: 8,
            background: trackGradient,
            boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.25)',
          }}
        />
        {/* "now → selected" accent */}
        <div
          className="absolute rounded-full"
          style={{
            left: '50%', transform: 'translateX(-50%)',
            top: 0, height: `${fraction * 100}%`, width: 8,
            background: 'linear-gradient(to bottom, rgba(245,172,50,0.0), rgba(245,172,50,0.35))',
            pointerEvents: 'none',
          }}
        />
        {/* Tick markers */}
        {ticks.map((t) => (
          <div
            key={t.pct}
            className="absolute pointer-events-none"
            style={{
              top: `${t.pct}%`,
              left: '50%',
              transform: 'translate(-50%, -50%)',
              height: 2, width: t.major ? 14 : 8,
              background: t.major ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)',
              borderRadius: 1,
            }}
          />
        ))}
        {/* Thumb */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: `${fraction * 100}%`,
            transform: `translate(-50%, -50%) scale(${dragging ? 1.15 : 1})`,
            transition: dragging ? 'transform 0.08s' : 'transform 0.18s',
            width: 22, height: 22, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #FFD37A, #E5870A)',
            border: '2.5px solid #FFFFFF',
            boxShadow: dragging
              ? '0 4px 18px rgba(229,135,10,0.7), 0 0 0 6px rgba(229,135,10,0.15)'
              : '0 2px 10px rgba(229,135,10,0.45)',
          }}
        />
      </div>

      {/* Tick labels alongside vertical track */}
      <div className="relative flex-1 mt-20 mb-2">
        {ticks.map((t) => (
          <span
            key={t.pct}
            className="absolute pointer-events-none leading-none tabular-nums"
            style={{
              top: `${t.pct}%`,
              left: 4,
              transform: 'translateY(-50%)',
              fontSize: t.major ? 10 : 9,
              fontWeight: t.major ? 700 : 500,
              color: t.major ? 'var(--color-sidebar-brand)' : 'var(--color-sidebar-accent)',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}
