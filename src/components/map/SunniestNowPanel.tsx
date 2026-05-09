import { useQuery } from '@tanstack/react-query';
import { searchTerras } from '../../services/terrasService';
import { intensityColor, intensityLabel } from '../../utils/intensity';
import type { Terras } from '../../types';

interface Props {
  onPick: (uuid: string) => void;
}

/**
 * Top-right floating leaderboard. Shows the 5 sunniest terraces right now and
 * lets the user click through to focus one on the map.
 *
 * On the map this is the "where do I go" answer at a glance.
 */
export default function SunniestNowPanel({ onPick }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['sunniest-now'],
    queryFn: () => searchTerras({ sunnyOnly: true }),
    staleTime: 60_000,
  });

  const items: (Terras & { '@id': string })[] = (data?.['hydra:member'] ?? []).slice(0, 5);

  return (
    <div
      className="rounded-2xl px-4 py-4 fade-up fade-up-delay-1"
      style={{
        background: 'var(--color-map-overlay)',
        border: '1px solid var(--color-map-overlay-border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        color: '#F5EFE3',
        boxShadow: 'var(--shadow-float)',
        width: 264,
      }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <span className="eyebrow" style={{ color: 'rgba(245,239,227,0.65)' }}>
          Sunniest right now
        </span>
        <span className="text-[11px] tabular-nums" style={{ color: 'rgba(245,239,227,0.55)' }}>
          live
        </span>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <p className="text-xs py-3" style={{ color: 'rgba(245,239,227,0.65)' }}>
          No fully sunny terraces right now.
        </p>
      )}

      <ol className="space-y-0.5">
        {items.map((t, i) => {
          const colour = intensityColor(t.intensity);
          return (
            <li key={t.uuid}>
              <button
                onClick={() => onPick(t.uuid)}
                className="w-full text-left group flex items-center gap-3 px-2 py-2 rounded-lg transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span
                  className="font-display tabular-nums shrink-0"
                  style={{ width: 18, fontSize: '0.95rem', color: i === 0 ? '#FFD9A8' : 'rgba(245,239,227,0.55)' }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate" style={{ color: '#F5EFE3' }}>
                    {t.name}
                  </p>
                  <p className="truncate" style={{ color: 'rgba(245,239,227,0.55)', fontSize: 10.5 }}>
                    {intensityLabel(t.intensity)}
                  </p>
                </div>
                <span
                  className="text-[11px] font-bold tabular-nums shrink-0 px-2 py-0.5 rounded-md"
                  style={{ color: colour, background: `${colour}24` }}
                >
                  {t.intensity}%
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {items.length > 0 && (
        <a
          href="/discover"
          className="block text-center text-[11px] font-medium mt-3 pt-3 transition-colors"
          style={{
            color: 'rgba(255,217,168,0.85)',
            borderTop: '1px solid rgba(255,255,255,0.10)',
            paddingTop: 12,
          }}
        >
          See all in Discover →
        </a>
      )}

    </div>
  );
}
