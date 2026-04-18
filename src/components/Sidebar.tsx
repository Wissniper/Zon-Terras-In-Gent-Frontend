import { NavLink, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSelectedTime } from '../contexts/TimeContext';
import { useWeatherData } from '../hooks/useWeatherData';
import { searchTerras, uuidFromHydraId } from '../services/terrasService';

function SunIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.5" stroke="#E5870A" strokeWidth="1.8" fill="rgba(229,135,10,0.15)" />
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const r = Math.PI * deg / 180;
        const x1 = 12 + Math.cos(r) * 6.5;
        const y1 = 12 + Math.sin(r) * 6.5;
        const x2 = 12 + Math.cos(r) * 8.5;
        const y2 = 12 + Math.sin(r) * 8.5;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E5870A" strokeWidth="1.8" />;
      })}
    </svg>
  );
}

function WeatherCard() {
  const { data: weather, isLoading } = useWeatherData();

  if (isLoading) {
    return <div className="h-20 rounded-xl mx-3 animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />;
  }
  if (!weather) return null;

  const cloudLabel =
    weather.cloudCover < 20 ? 'Clear skies' :
    weather.cloudCover < 50 ? 'Partly cloudy' :
    weather.cloudCover < 80 ? 'Mostly cloudy' : 'Overcast';

  return (
    <div className="mx-3 rounded-xl px-4 py-3.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-xs font-medium uppercase tracking-label mb-2.5" style={{ color: '#7A6048', letterSpacing: '0.12em' }}>
        Ghent Weather
      </p>
      <div className="flex items-end justify-between">
        <div>
          <span className="font-display" style={{ fontSize: '2.4rem', lineHeight: 1, color: '#F5AC32', letterSpacing: '-0.02em' }}>
            {Math.round(weather.temperature)}°
          </span>
          <p className="text-xs mt-1" style={{ color: '#9B8570' }}>{cloudLabel}</p>
        </div>
        <div className="text-right space-y-1 pb-1">
          <p className="text-xs" style={{ color: '#7A6048' }}>
            <span className="font-medium" style={{ color: '#C9A880' }}>{Math.round(weather.windspeed)}</span> km/h
          </p>
          <p className="text-xs" style={{ color: '#7A6048' }}>
            <span className="font-medium" style={{ color: '#C9A880' }}>{Math.round(weather.cloudCover)}</span>% clouds
          </p>
        </div>
      </div>
    </div>
  );
}

function intensityColor(v: number) {
  return v >= 70 ? '#E5870A' : v >= 40 ? '#F5AC32' : '#7A6048';
}

function TopTerraces() {
  const { data, isLoading } = useQuery({
    queryKey: ['sidebar-top-terraces'],
    queryFn: () => searchTerras({ sunnyOnly: true }),
    staleTime: 5 * 60 * 1000,
  });

  const items = data?.['hydra:member'] ?? [];

  return (
    <div className="mx-3 flex-1 min-h-0 flex flex-col">
      <p className="text-xs font-medium uppercase tracking-label mb-2 px-0.5" style={{ color: '#7A6048', letterSpacing: '0.12em' }}>
        Top Sunny
      </p>
      {isLoading && (
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-11 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
          ))}
        </div>
      )}
      {!isLoading && items.length === 0 && (
        <p className="text-xs px-0.5" style={{ color: '#7A6048' }}>No sunny terraces right now.</p>
      )}
      <div className="space-y-0.5 overflow-y-auto flex-1 min-h-0">
        {items.map((t) => (
          <Link
            key={t.uuid}
            to={`/terrasen/${uuidFromHydraId(t['@id'])}`}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group"
            style={{ color: 'inherit' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="min-w-0 mr-2">
              <p className="text-xs font-medium truncate transition-colors" style={{ color: '#D4B896' }}>
                {t.name}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ color: '#7A6048', fontSize: '10px' }}>{t.address}</p>
            </div>
            <span className="text-xs font-semibold shrink-0 tabular-nums" style={{ color: intensityColor(t.intensity) }}>
              {t.intensity}%
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { selectedTime } = useSelectedTime();

  const formatted = new Date(selectedTime).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <aside
      className="shrink-0 w-56 h-full flex flex-col"
      style={{ background: '#150F08', borderRight: '1px solid #2E1E0A' }}
    >
      {/* Brand */}
      <div className="flex flex-col items-center gap-3 px-5 pt-8 pb-6 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
            style={{ color: '#7A6048' }}
            aria-label="Close menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center sun-pulse"
          style={{ background: 'rgba(229,135,10,0.14)', border: '1px solid rgba(229,135,10,0.25)' }}
        >
          <SunIcon size={22} />
        </div>

        <div className="text-center">
          <p className="font-display text-sm font-semibold" style={{ color: '#E8C98A', letterSpacing: '0.01em' }}>
            Sun Seeker
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#7A6048' }}>Ghent Edition</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 mb-4" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

      {/* Nav links */}
      <nav className="px-3 flex flex-col gap-0.5 mb-5">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'active-nav' : ''}`
          }
          style={({ isActive }) => ({
            color: isActive ? '#F5AC32' : '#9B8570',
            background: isActive ? 'rgba(229,135,10,0.15)' : 'transparent',
          })}
          onClick={onClose}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 12 2 21 11 21 22 15 22 15 15 9 15 9 22 3 22 3 11" />
          </svg>
          Map
        </NavLink>
        <NavLink
          to="/search"
          className={() =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors`
          }
          style={({ isActive }) => ({
            color: isActive ? '#F5AC32' : '#9B8570',
            background: isActive ? 'rgba(229,135,10,0.15)' : 'transparent',
          })}
          onClick={onClose}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Search
        </NavLink>
      </nav>

      {/* Divider */}
      <div className="mx-4 mb-4" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

      {/* Weather */}
      <WeatherCard />

      <div className="mx-4 my-4" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

      {/* Top terraces */}
      <TopTerraces />

      {/* Time display */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs font-medium uppercase tracking-label mb-1" style={{ color: '#7A6048', letterSpacing: '0.12em' }}>
          Selected Time
        </p>
        <p className="text-xs font-semibold" style={{ color: '#C9A880' }}>{formatted}</p>
      </div>
    </aside>
  );
}
