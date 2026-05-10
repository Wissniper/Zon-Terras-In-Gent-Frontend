import { intensityColor, intensityLabel } from '../../utils/intensity';
import { useSunniestTerrasen } from '../../hooks/useSunniestTerrasen';
import { useSelectedTime } from '../../contexts/TimeContext';

interface Props {
  onPick: (uuid: string) => void;
}

/**
 * Top-right floating leaderboard. Shows the 5 sunniest terraces at the
 * timeline's selectedTime. Title flips between "Sunniest right now" (live)
 * and "Sunniest at HH:MM" (scrubbed).
 */
export default function SunniestNowPanel({ onPick }: Props) {
  const { items, isLoading } = useSunniestTerrasen(5);
  const { selectedTime } = useSelectedTime();

  const selectedDate = new Date(selectedTime);
  const isLive = Math.abs(selectedDate.getTime() - Date.now()) < 5 * 60_000;
  const hhmm = selectedDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="rounded-2xl px-4 py-4 fade-up fade-up-delay-1 text-text-1"
      style={{
        background: 'var(--color-map-overlay)',
        border: '1px solid var(--color-map-overlay-border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: 'var(--shadow-float)',
        width: 264,
      }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <span className="eyebrow">{isLive ? 'Sunniest right now' : `Sunniest at ${hhmm}`}</span>
        <span className="text-[11px] tabular-nums text-text-3">{isLive ? 'live' : 'preview'}</span>
      </div>

      {isLoading && items.length === 0 && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 rounded-lg shimmer" />
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <p className="text-xs py-3 text-text-3">
          No terraces available right now.
        </p>
      )}

      <ol className="space-y-0.5">
        {items.map(({ terras: t, intensity }, i) => {
          const colour = intensityColor(intensity);
          return (
            <li key={t.uuid}>
              <button
                onClick={() => onPick(t.uuid)}
                className="w-full text-left flex items-center gap-3 px-2 py-2 rounded-lg transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span
                  className="font-display tabular-nums shrink-0"
                  style={{
                    width: 18,
                    fontSize: '0.95rem',
                    color: i === 0 ? 'var(--color-primary)' : 'var(--color-text-3)',
                  }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate text-text-1">
                    {t.name}
                  </p>
                  <p className="truncate text-text-3" style={{ fontSize: 10.5 }}>
                    {intensityLabel(intensity)}
                  </p>
                </div>
                <span
                  className="text-[11px] font-bold tabular-nums shrink-0 px-2 py-0.5 rounded-md"
                  style={{ color: colour, background: `${colour}24` }}
                >
                  {intensity}%
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {items.length > 0 && (
        <a
          href="/discover"
          className="block text-center text-[11px] font-semibold mt-3 pt-3 transition-colors"
          style={{
            color: 'var(--color-primary)',
            borderTop: '1px solid var(--color-border)',
            paddingTop: 12,
          }}
        >
          See all in Discover →
        </a>
      )}
    </div>
  );
}
