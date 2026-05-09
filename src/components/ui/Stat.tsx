import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: ReactNode;
  sub?: string;
  emphasis?: 'normal' | 'highlight';
}

/** Small labelled value used inside detail-page stat grids. */
export default function Stat({ label, value, sub, emphasis = 'normal' }: Props) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: emphasis === 'highlight' ? 'var(--color-primary-light)' : 'var(--color-surface-2)',
        border: emphasis === 'highlight' ? '1px solid var(--color-primary-border)' : '1px solid var(--color-border)',
      }}
    >
      <p className="eyebrow">{label}</p>
      <p className="font-display font-semibold text-text-1 mt-1.5" style={{ fontSize: '1.375rem', lineHeight: 1.1 }}>
        {value}
      </p>
      {sub && <p className="text-xs text-text-3 mt-1">{sub}</p>}
    </div>
  );
}
