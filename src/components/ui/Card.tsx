import type { ReactNode, CSSProperties } from 'react';

type Variant = 'surface' | 'cream' | 'elevated' | 'glass';
type Padding = 'none' | 'sm' | 'md' | 'lg';
type Radius = 'lg' | 'xl' | '2xl';

interface Props {
  children: ReactNode;
  variant?: Variant;
  padding?: Padding;
  radius?: Radius;
  className?: string;
  style?: CSSProperties;
  as?: 'div' | 'article' | 'section' | 'aside';
  onClick?: () => void;
}

const variantStyle: Record<Variant, CSSProperties> = {
  surface:  { background: 'var(--color-surface)',   border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-soft)' },
  cream:    { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' },
  elevated: { background: 'var(--color-surface)',   border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-float)' },
  glass:    { background: 'var(--color-map-overlay)', border: '1px solid var(--color-map-overlay-border)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' },
};

const paddingClass: Record<Padding, string> = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-6',
};

const radiusClass: Record<Radius, string> = {
  lg:   'rounded-lg',
  xl:   'rounded-xl',
  '2xl':'rounded-2xl',
};

/**
 * Surface primitive used by every card on every page.
 *
 *   <Card variant="surface" padding="lg" radius="2xl">…</Card>
 *
 * The point is that the rest of the app stops authoring background / border /
 * shadow as inline style — those decisions live here and propagate through the
 * design tokens.
 */
export default function Card({
  children,
  variant = 'surface',
  padding = 'md',
  radius = 'xl',
  className = '',
  style,
  as: As = 'div',
  onClick,
}: Props) {
  return (
    <As
      onClick={onClick}
      className={`${paddingClass[padding]} ${radiusClass[radius]} ${className}`}
      style={{ ...variantStyle[variant], ...style }}
    >
      {children}
    </As>
  );
}
