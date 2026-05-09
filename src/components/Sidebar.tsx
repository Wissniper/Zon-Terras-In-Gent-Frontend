import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSelectedTime } from '../contexts/TimeContext';
import { useWeatherData } from '../hooks/useWeatherData';
import { searchTerras, uuidFromHydraId } from '../services/terrasService';
import { intensityColor, intensityLabel } from '../utils/intensity';

function useTheme() {
  const [dark, setDark] = useState(() =>
    document.documentElement.getAttribute('data-theme') === 'dark',
  );
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}

function SunMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id={`sb-sun-${size}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#FFD075" />
          <stop offset="100%" stopColor="#E5870A" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="5.2" fill={`url(#sb-sun-${size})`} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={12 + Math.cos(r) * 7.8}  y1={12 + Math.sin(r) * 7.8}
            x2={12 + Math.cos(r) * 10.5} y2={12 + Math.sin(r) * 10.5}
            stroke="#FFD9A8" strokeWidth="1.4" strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function WeatherCard() {
  const { data: weather, isLoading } = useWeatherData();

  if (isLoading) {
    return <div className="mx-3 h-24 rounded-2xl shimmer" />;
  }
  if (!weather) return null;

  const cloudLabel =
    weather.cloudCover < 20 ? 'Clear skies' :
    weather.cloudCover < 50 ? 'Partly cloudy' :
    weather.cloudCover < 80 ? 'Mostly cloudy' : 'Overcast';

  return (
    <div
      className="mx-3 rounded-2xl px-4 py-4"
      style={{
        background: 'linear-gradient(135deg, rgba(255,217,168,0.08), rgba(255,184,118,0.04))',
        border: '1px solid rgba(255,217,168,0.16)',
      }}
    >
      <p className="eyebrow mb-2.5" style={{ color: 'var(--color-sidebar-muted)' }}>
        Right now
      </p>
      <div className="flex items-end justify-between">
        <div>
          <span className="font-display tabular-nums" style={{
            fontSize: '2.6rem', lineHeight: 1, color: 'var(--color-sidebar-brand)',
            letterSpacing: '-0.03em',
          }}>
            {Math.round(weather.temperature)}°
          </span>
          <p className="text-xs mt-1.5" style={{ color: 'var(--color-sidebar-text)' }}>{cloudLabel}</p>
        </div>
        <div className="text-right space-y-1.5 pb-1">
          <div className="flex items-center gap-1.5 justify-end" style={{ color: 'var(--color-sidebar-muted)' }}>
            <span className="text-[11px]">Wind</span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--color-sidebar-accent)' }}>
              {Math.round(weather.windspeed)}
            </span>
            <span className="text-[10px]">km/h</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end" style={{ color: 'var(--color-sidebar-muted)' }}>
            <span className="text-[11px]">Cover</span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--color-sidebar-accent)' }}>
              {Math.round(weather.cloudCover)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopTerraces() {
  const { data, isLoading } = useQuery({
    queryKey: ['sidebar-top-terraces'],
    queryFn: () => searchTerras({ sunnyOnly: true }),
    staleTime: 5 * 60 * 1000,
  });

  const items = (data?.['hydra:member'] ?? []).slice(0, 6);

  return (
    <div className="mx-3 flex-1 min-h-0 flex flex-col">
      <p className="eyebrow mb-2.5 px-1" style={{ color: 'var(--color-sidebar-muted)' }}>
        Sunniest now
      </p>
      {isLoading && (
        <div className="space-y-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-xl shimmer" />
          ))}
        </div>
      )}
      {!isLoading && items.length === 0 && (
        <p className="text-xs px-1" style={{ color: 'var(--color-sidebar-muted)' }}>
          No sunny terraces right now.
        </p>
      )}
      <div className="space-y-0.5 overflow-y-auto flex-1 min-h-0 -mx-1 px-1">
        {items.map((t) => {
          const colour = intensityColor(t.intensity);
          return (
            <Link
              key={t.uuid}
              to={`/terrasen/${uuidFromHydraId(t['@id'])}`}
              className="flex items-center justify-between px-2.5 py-2.5 rounded-xl group transition-colors"
              style={{ color: 'inherit' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,217,168,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="min-w-0 mr-2">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--color-sidebar-text)' }}>
                  {t.name}
                </p>
                <p className="truncate mt-0.5" style={{ color: 'var(--color-sidebar-muted)', fontSize: 10 }}>
                  {intensityLabel(t.intensity)}
                </p>
              </div>
              <div
                className="text-[11px] font-bold tabular-nums shrink-0 px-2 py-0.5 rounded-md"
                style={{ color: colour, background: `${colour}1f` }}
              >
                {t.intensity}%
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { selectedTime } = useSelectedTime();
  const { dark, toggle } = useTheme();

  const formatted = new Date(selectedTime).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <aside
      className="shrink-0 w-60 h-full flex flex-col"
      style={{
        background: 'linear-gradient(180deg, var(--color-sidebar) 0%, var(--color-sidebar-surface) 100%)',
        borderRight: '1px solid var(--color-sidebar-border)',
      }}
    >
      {/* Brand */}
      <div className="flex flex-col items-center gap-3 px-5 pt-7 pb-6 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden absolute top-3 right-3 p-2 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
            style={{ color: 'var(--color-sidebar-muted)' }}
            aria-label="Close menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        <button
          onClick={toggle}
          className="absolute top-3 left-3 p-2 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
          style={{ color: 'var(--color-sidebar-muted)' }}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              {[0,45,90,135,180,225,270,315].map(deg => {
                const r = (deg*Math.PI)/180;
                return <line key={deg} x1={12+Math.cos(r)*7} y1={12+Math.sin(r)*7} x2={12+Math.cos(r)*9.5} y2={12+Math.sin(r)*9.5} />
              })}
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center sun-pulse"
          style={{
            background: 'rgba(255,217,168,0.10)',
            border: '1px solid rgba(255,217,168,0.20)',
          }}
        >
          <SunMark size={24} />
        </div>

        <div className="text-center">
          <p className="font-display font-semibold" style={{
            color: 'var(--color-sidebar-brand)',
            fontSize: '0.95rem', letterSpacing: '0.005em',
          }}>
            Sun Seeker
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-sidebar-muted)' }}>
            Ghent edition
          </p>
        </div>
      </div>

      <div className="mx-4 mb-3" style={{ height: '1px', background: 'rgba(255,217,168,0.10)' }} />

      {/* Nav */}
      <nav className="px-3 flex flex-col gap-0.5 mb-4">
        {[
          { to: '/',         end: true,  label: 'Map',      icon: <polygon points="3 11 12 2 21 11 21 22 15 22 15 15 9 15 9 22 3 22 3 11" /> },
          { to: '/discover', end: false, label: 'Discover', icon: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></> },
        ].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={({ isActive }) => isActive ? {
              color: 'var(--color-sidebar-brand)',
              background: 'rgba(255,217,168,0.13)',
              border: '1px solid rgba(255,217,168,0.18)',
            } : {
              color: 'var(--color-sidebar-muted)',
              border: '1px solid transparent',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {item.icon}
            </svg>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mx-4 mb-4" style={{ height: '1px', background: 'rgba(255,217,168,0.10)' }} />

      <WeatherCard />

      <div className="mx-4 my-4" style={{ height: '1px', background: 'rgba(255,217,168,0.10)' }} />

      <TopTerraces />

      {/* Footer time */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,217,168,0.10)' }}>
        <p className="eyebrow mb-1" style={{ color: 'var(--color-sidebar-muted)' }}>
          Selected time
        </p>
        <p className="text-xs font-semibold" style={{ color: 'var(--color-sidebar-accent)' }}>
          {formatted}
        </p>
      </div>
    </aside>
  );
}
