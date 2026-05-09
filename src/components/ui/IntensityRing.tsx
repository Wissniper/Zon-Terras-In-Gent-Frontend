import { intensityColor, intensityLabel } from '../../utils/intensity';

interface Props {
  value: number;
  size?: number;
  caption?: string;
  /** Optional override label, defaults to intensityLabel(value). */
  label?: string;
}

/**
 * Circular sun intensity dial — the lifestyle hero.
 *
 * Renders a soft warm-light corona behind a thick gradient ring with the
 * percentage written across the centre in a serif display face. Replaces the
 * bare "71%" numeric on detail pages with something that actually communicates
 * how much sun the spot is getting.
 */
export default function IntensityRing({ value, size = 200, caption, label }: Props) {
  const safe = Math.max(0, Math.min(100, value));
  const colour = intensityColor(safe);
  const stroke = Math.round(size * 0.075);
  const r = size / 2 - stroke / 2 - 2;
  const c = 2 * Math.PI * r;
  const dash = (safe / 100) * c;
  const cx = size / 2;
  const cy = size / 2;

  // Soft halo glow when the spot is sunny — visually warmer at higher values.
  const haloOpacity = Math.min(0.35, 0.08 + (safe / 100) * 0.27);
  const haloSize = size * 0.7;

  return (
    <div className="relative inline-flex items-center justify-center select-none" style={{ width: size, height: size }}>
      {/* Ambient halo */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          width: haloSize, height: haloSize, borderRadius: '50%',
          background: `radial-gradient(circle, ${colour} 0%, transparent 70%)`,
          opacity: haloOpacity,
          filter: 'blur(20px)',
        }}
      />

      {/* Ring */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
        <defs>
          <linearGradient id={`ring-${size}-${safe}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={colour} stopOpacity="0.55" />
            <stop offset="100%" stopColor={colour} stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--color-track)"
          strokeWidth={stroke}
          opacity={0.55}
        />

        {/* Filled arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={`url(#ring-${size}-${safe})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: 'stroke-dasharray 0.7s ease' }}
        />
      </svg>

      {/* Centred number + caption */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p
          className="font-display tabular-nums"
          style={{ fontSize: size * 0.32, lineHeight: 1, color: colour, letterSpacing: '-0.03em' }}
        >
          {safe}<span style={{ fontSize: size * 0.13, marginLeft: 2 }}>%</span>
        </p>
        <p className="eyebrow mt-2" style={{ color: 'var(--color-text-2)' }}>
          {label ?? intensityLabel(safe)}
        </p>
        {caption && <p className="text-xs text-text-3 mt-1">{caption}</p>}
      </div>
    </div>
  );
}
