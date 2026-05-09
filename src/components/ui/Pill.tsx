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

/** Pill tones use CSS variables so they adapt with light/dark mode. */
const toneStyle: Record<Tone, CSSProperties> = {
  neutral: {
    color: 'var(--color-text-2)',
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
  },
  gold: {
    color: 'var(--color-primary)',
    background: 'var(--color-primary-light)',
    border: '1px solid var(--color-primary-border)',
  },
  terra: {
    color: 'var(--color-coral)',
    background: 'rgba(255,107,74,0.10)',
    border: '1px solid rgba(255,107,74,0.28)',
  },
  sky: {
    color: 'var(--color-sky)',
    background: 'var(--color-sky-light)',
    border: '1px solid rgba(74,138,171,0.28)',
  },
  sage: {
    color: 'var(--color-sage)',
    background: 'rgba(107,153,129,0.14)',
    border: '1px solid rgba(107,153,129,0.30)',
  },
  cream: {
    color: 'var(--color-text-2)',
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
  },
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
