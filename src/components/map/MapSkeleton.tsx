import { useEffect, useState } from 'react';

interface Props {
  visible: boolean;
}

const FADE_OUT_MS = 350;

/**
 * Lightweight loading curtain shown only while the Mapbox style + first
 * batch of tiles are still loading. Pure CSS — no SVG <animate>, no
 * intervals, no layout-thrashing keyframes during the heavy initial paint.
 */
export default function MapSkeleton({ visible }: Props) {
  const [mounted, setMounted] = useState(visible);
  const [opacity, setOpacity] = useState(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setOpacity(1));
      return () => cancelAnimationFrame(raf);
    }
    setOpacity(0);
    const t = window.setTimeout(() => setMounted(false), FADE_OUT_MS);
    return () => window.clearTimeout(t);
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 5,
        pointerEvents: 'none',
        opacity,
        transition: `opacity ${FADE_OUT_MS}ms ease-out`,
        background: 'var(--color-bg)',
      }}
      aria-hidden={!visible}
      aria-label="Map loading"
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 16px',
          borderRadius: 999,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-soft)',
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--color-text-2)',
          letterSpacing: '0.02em',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--color-primary)',
            animation: 'sun-pulse 1.6s ease-in-out infinite',
          }}
        />
        Loading map…
      </div>
    </div>
  );
}
