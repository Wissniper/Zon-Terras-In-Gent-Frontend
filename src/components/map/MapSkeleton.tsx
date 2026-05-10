import { useEffect, useState } from 'react';

interface Props {
  visible: boolean;
  progress?: number;
}

const FADE_OUT_MS = 500;

export default function MapSkeleton({ visible, progress }: Props) {
  // `mounted` controls DOM presence (delayed unmount); `opacity` drives the CSS fade.
  const [mounted, setMounted] = useState(visible);
  const [opacity, setOpacity] = useState(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Allow one frame so the element is in the DOM at opacity 0 before we transition to 1.
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
      className="map-skeleton"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 5,
        pointerEvents: visible ? 'auto' : 'none',
        opacity,
        transition: `opacity ${FADE_OUT_MS}ms ease-out`,
        background: 'var(--color-bg)',
        overflow: 'hidden',
      }}
      aria-hidden={!visible}
      aria-label="Map loading"
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(135deg, rgba(255,181,84,0.04) 0%, rgba(92,143,168,0.04) 100%)',
        }}
      />

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0 }}
        role="presentation"
      >
        <defs>
          <linearGradient id="skel-shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            <animate attributeName="x1" from="-100%" to="100%" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="x2" from="0%" to="200%" dur="1.6s" repeatCount="indefinite" />
          </linearGradient>
          <pattern id="skel-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="var(--color-border)" strokeWidth="0.6" opacity="0.5" />
          </pattern>
        </defs>

        <rect width="800" height="600" fill="url(#skel-grid)" />

        {[
          { x: 80, y: 110, w: 180, h: 70 },
          { x: 320, y: 90, w: 140, h: 90 },
          { x: 540, y: 130, w: 200, h: 60 },
          { x: 100, y: 250, w: 110, h: 130 },
          { x: 260, y: 230, w: 90, h: 110 },
          { x: 410, y: 260, w: 160, h: 120 },
          { x: 620, y: 240, w: 110, h: 140 },
          { x: 130, y: 430, w: 220, h: 90 },
          { x: 400, y: 420, w: 130, h: 110 },
          { x: 580, y: 440, w: 170, h: 80 },
        ].map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx="4"
            fill="var(--color-surface-2)"
            opacity="0.55"
            stroke="var(--color-border)"
            strokeWidth="1"
          />
        ))}

        <path
          d="M 0 380 Q 200 360 400 390 T 800 400"
          stroke="var(--color-primary)"
          strokeWidth="2"
          fill="none"
          opacity="0.18"
        />

        <rect width="800" height="600" fill="url(#skel-shimmer)" />
      </svg>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: 'var(--color-text-2)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 18px',
            borderRadius: 999,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-soft)',
            fontSize: 12.5,
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--color-primary)',
              boxShadow: '0 0 0 0 var(--color-primary)',
              animation: 'skel-pulse 1.4s ease-out infinite',
            }}
          />
          Loading map…
          {typeof progress === 'number' && (
            <span style={{ color: 'var(--color-text-3)', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(progress)}%
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes skel-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(229,135,10,0.55); }
          70%  { box-shadow: 0 0 0 12px rgba(229,135,10,0); }
          100% { box-shadow: 0 0 0 0 rgba(229,135,10,0); }
        }
      `}</style>
    </div>
  );
}
