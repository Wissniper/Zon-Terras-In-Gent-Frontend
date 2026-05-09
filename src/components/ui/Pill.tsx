import type { ReactNode, CSSProperties } from 'react';

type Tone = 'neutral' | 'gold' | 'terra' | 'sky' | 'sage' | 'cream';
type Size = 'sm' | 'md';

interface Props {
  children: ReactNode;
  tone?: Tone;
  size?: Size;
  className?: string;
  style?: CSSProperties;
}

const toneStyle: Record<Tone, CSSProperties> = {
  neutral: { color: 'var(--color-text-3)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' },
  gold:    { color: '#8A4F0A', background: 'rgba(229,135,10,0.16)', border: '1px solid rgba(229,135,10,0.30)' },
  terra:   { color: '#6B2A14', background: 'rgba(196,80,42,0.13)', border: '1px solid rgba(196,80,42,0.28)' },
  sky:     { color: '#2D5970', background: 'rgba(92,143,168,0.14)', border: '1px solid rgba(92,143,168,0.28)' },
  sage:    { color: '#4F6042', background: 'rgba(143,163,130,0.18)', border: '1px solid rgba(143,163,130,0.30)' },
  cream:   { color: 'var(--color-text-2)', background: 'var(--color-cream)', border: '1px solid var(--color-border)' },
};

/** Compact label used for category, day-delta, count chips. */
export default function Pill({ children, tone = 'neutral', size = 'sm', className = '', style }: Props) {
  const px = size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5';
  const fs = size === 'sm' ? 'text-[11px]' : 'text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg font-medium tracking-wide ${px} ${fs} ${className}`}
      style={{ lineHeight: 1.2, ...toneStyle[tone], ...style }}
    >
      {children}
    </span>
  );
}
