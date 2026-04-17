import { useWeatherData } from '../hooks/useWeatherData';

export function WeatherWidget() {
  const { data: weather, isError } = useWeatherData();

  if (isError || !weather) return null;

  const cloudLabel =
    weather.cloudCover < 20 ? 'Clear' :
    weather.cloudCover < 50 ? 'Partly cloudy' :
    weather.cloudCover < 80 ? 'Mostly cloudy' : 'Overcast';

  return (
    <div className="bg-surface rounded-2xl shadow-soft p-4 w-52">
      <p className="text-xs font-bold uppercase tracking-label text-text-2 mb-3">
        Atmosphere
      </p>

      <div className="flex items-end gap-1 mb-1">
        <span className="font-light text-text-1" style={{ fontSize: '3rem', lineHeight: 1, letterSpacing: '-0.02em' }}>
          {Math.round(weather.temperature)}
        </span>
        <span className="text-xl text-text-2 mb-2">°C</span>
      </div>
      <p className="text-xs text-text-2 mb-4">{cloudLabel}</p>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-3">Wind</span>
          <span className="text-xs font-semibold text-text-1 tabular-nums">{Math.round(weather.windspeed)} km/h</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-3">Cloud cover</span>
          <span className="text-xs font-semibold text-text-1 tabular-nums">{Math.round(weather.cloudCover)}%</span>
        </div>
      </div>
    </div>
  );
}
