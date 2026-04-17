import { NavLink, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSelectedTime } from '../contexts/TimeContext';
import { useWeatherData } from '../hooks/useWeatherData';
import { searchTerras, uuidFromHydraId } from '../services/terrasService';

function SunIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function WeatherCard() {
  const { data: weather, isLoading } = useWeatherData();

  if (isLoading) {
    return <div className="h-20 rounded-xl bg-surface-2 animate-pulse mx-3" />;
  }
  if (!weather) return null;

  const cloudLabel =
    weather.cloudCover < 20 ? 'Clear' :
    weather.cloudCover < 50 ? 'Partly cloudy' :
    weather.cloudCover < 80 ? 'Mostly cloudy' : 'Overcast';

  return (
    <div className="mx-3 rounded-xl bg-surface-2 px-3.5 py-3">
      <p className="text-xs font-bold uppercase tracking-label text-text-3 mb-2">Weather</p>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-3xl font-light text-text-1" style={{ letterSpacing: '-0.02em' }}>
            {Math.round(weather.temperature)}°
          </span>
          <p className="text-xs text-text-3 mt-0.5">{cloudLabel}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-xs text-text-3">
            <span className="font-medium text-text-2">{Math.round(weather.windspeed)}</span> km/h
          </p>
          <p className="text-xs text-text-3">
            <span className="font-medium text-text-2">{Math.round(weather.cloudCover)}</span>% clouds
          </p>
        </div>
      </div>
    </div>
  );
}

function intensityColor(v: number) {
  return v >= 70 ? '#F5A623' : v >= 40 ? '#FBBF24' : '#9CA3AF';
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
      <p className="text-xs font-bold uppercase tracking-label text-text-3 mb-2 px-0.5">Top Sunny</p>
      {isLoading && (
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-surface-2 animate-pulse" />)}
        </div>
      )}
      {!isLoading && items.length === 0 && (
        <p className="text-xs text-text-3 px-0.5">No sunny terraces right now.</p>
      )}
      <div className="space-y-1 overflow-y-auto flex-1 min-h-0">
        {items.map((t) => (
          <Link
            key={t.uuid}
            to={`/terrasen/${uuidFromHydraId(t['@id'])}`}
            className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-surface-2 transition-colors group"
          >
            <div className="min-w-0 mr-2">
              <p className="text-xs font-medium text-text-1 truncate group-hover:text-primary transition-colors">{t.name}</p>
              <p className="text-xs text-text-3 truncate">{t.address}</p>
            </div>
            <span className="text-xs font-bold shrink-0 tabular-nums" style={{ color: intensityColor(t.intensity) }}>
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
    <aside className="shrink-0 w-56 h-full flex flex-col bg-surface border-r border-surface-3 shadow-soft">
      {/* Brand */}
      <div className="flex flex-col items-center gap-2 px-5 pt-7 pb-5 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-2 transition-colors text-text-3"
            aria-label="Close menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.15)' }}>
          <SunIcon size={22} color="#F5A623" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold tracking-tight text-text-1">Sun Seeker</p>
          <p className="text-xs text-text-3 mt-0.5">Ghent Edition</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="px-3 flex flex-col gap-1 mb-5">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive ? 'bg-primary-light text-primary' : 'text-text-2 hover:text-text-1 hover:bg-surface-2'
            }`
          }
          onClick={onClose}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 12 2 21 11 21 22 15 22 15 15 9 15 9 22 3 22 3 11" />
          </svg>
          Map
        </NavLink>
        <NavLink
          to="/search"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive ? 'bg-primary-light text-primary' : 'text-text-2 hover:text-text-1 hover:bg-surface-2'
            }`
          }
          onClick={onClose}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Search
        </NavLink>
      </nav>

      {/* Divider */}
      <div className="border-t border-surface-3 mb-4" />

      {/* Weather */}
      <WeatherCard />

      <div className="border-t border-surface-3 my-4" />

      {/* Top terraces */}
      <TopTerraces />

      {/* Time display */}
      <div className="px-4 py-4 border-t border-surface-3">
        <p className="text-xs text-text-3 font-medium uppercase tracking-label mb-1">Selected Time</p>
        <p className="text-xs font-semibold text-text-1">{formatted}</p>
      </div>
    </aside>
  );
}
