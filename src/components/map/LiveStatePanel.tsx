import { useEffect, useState } from 'react';
import { useSelectedTime } from '../../contexts/TimeContext';
import { useWeatherData } from '../../hooks/useWeatherData';
import { useSunPosition } from '../../hooks/useSunPosition';

/**
 * Top-left floating panel — current time, weather, sun position.
 *
 * The surface follows the active theme via --color-map-overlay; the text
 * uses --color-text-* tokens so it inverts cleanly between light and dark.
 */
export default function LiveStatePanel() {
  const { selectedTime } = useSelectedTime();
  const { data: weather } = useWeatherData();
  const sun = useSunPosition();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const selected = new Date(selectedTime);
  const isLive = Math.abs(selected.getTime() - now.getTime()) < 5 * 60 * 1000;

  const time = selected.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const day  = selected.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

  const sky =
    !weather ? '' :
    weather.cloudCover < 20 ? 'Clear skies'  :
    weather.cloudCover < 50 ? 'Partly cloudy' :
    weather.cloudCover < 80 ? 'Mostly cloudy' : 'Overcast';

  const altDeg = sun ? Math.round((sun.altitude * 180) / Math.PI) : null;
  const azDeg  = sun ? ((sun.azimuth * 180) / Math.PI + 360) % 360 : null;
  const compass = azDeg == null ? null
    : azDeg < 22.5  ? 'N'
    : azDeg < 67.5  ? 'NE'
    : azDeg < 112.5 ? 'E'
    : azDeg < 157.5 ? 'SE'
    : azDeg < 202.5 ? 'S'
    : azDeg < 247.5 ? 'SW'
    : azDeg < 292.5 ? 'W'
    : azDeg < 337.5 ? 'NW' : 'N';

  return (
    <div
      className="rounded-2xl px-5 py-4 fade-up text-text-1"
      style={{
        background: 'var(--color-map-overlay)',
        border: '1px solid var(--color-map-overlay-border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: 'var(--shadow-float)',
        minWidth: 240,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: isLive ? '#7DCB95' : 'var(--color-primary)',
            animation: isLive ? 'sun-pulse 2s ease-in-out infinite' : undefined,
          }}
        />
        <span className="eyebrow">
          {isLive ? 'In Ghent now' : 'Selected time'}
        </span>
      </div>

      <p
        className="font-display tabular-nums"
        style={{
          fontSize: '1.65rem',
          lineHeight: 1,
          letterSpacing: '-0.02em',
          color: 'var(--color-primary)',
        }}
      >
        {time}
      </p>
      <p className="text-xs mt-1 text-text-2">{day}</p>

      <div className="my-3" style={{ height: 1, background: 'var(--color-border)' }} />

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {weather && (
          <>
            <div className="col-span-2 flex items-baseline gap-2">
              <span
                className="font-display tabular-nums text-text-1"
                style={{ fontSize: '1.4rem', lineHeight: 1, letterSpacing: '-0.02em' }}
              >
                {Math.round(weather.temperature)}°
              </span>
              <span className="text-text-2" style={{ fontSize: '0.75rem' }}>{sky}</span>
            </div>
            <div className="flex items-center gap-1 text-text-3">
              <span>Wind</span>
              <span className="font-semibold tabular-nums text-text-1">
                {Math.round(weather.windspeed)}
              </span>
              <span style={{ fontSize: 10 }}>km/h</span>
            </div>
            <div className="flex items-center gap-1 text-text-3">
              <span>Cloud</span>
              <span className="font-semibold tabular-nums text-text-1">
                {Math.round(weather.cloudCover)}%
              </span>
            </div>
          </>
        )}
        {altDeg != null && (
          <div className="col-span-2 flex items-center gap-2 text-xs text-text-3">
            <span>Sun</span>
            <span className="font-semibold tabular-nums" style={{ color: 'var(--color-primary)' }}>
              {altDeg}° in {compass}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
