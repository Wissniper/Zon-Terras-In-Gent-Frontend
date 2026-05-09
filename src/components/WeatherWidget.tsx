import { useWeatherData } from '../hooks/useWeatherData';
import Card from './ui/Card';

export function WeatherWidget() {
  const { data: weather, isError } = useWeatherData();
  if (isError || !weather) return null;

  const cloudLabel =
    weather.cloudCover < 20 ? 'Clear' :
    weather.cloudCover < 50 ? 'Partly cloudy' :
    weather.cloudCover < 80 ? 'Mostly cloudy' : 'Overcast';

  return (
    <Card variant="surface" radius="2xl" padding="lg" className="w-56">
      <p className="eyebrow mb-3">Atmosphere</p>

      <div className="flex items-end gap-1 mb-2">
        <span
          className="font-display tabular-nums"
          style={{ fontSize: '3.4rem', lineHeight: 1, color: 'var(--color-text-1)', letterSpacing: '-0.03em' }}
        >
          {Math.round(weather.temperature)}
        </span>
        <span className="text-2xl text-text-3 mb-1.5 font-display">°C</span>
      </div>
      <p className="text-sm text-text-2 mb-4">{cloudLabel}</p>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-3">Wind</span>
          <span className="text-xs font-semibold text-text-1 tabular-nums">{Math.round(weather.windspeed)} km/h</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-3">Cloud cover</span>
          <span className="text-xs font-semibold text-text-1 tabular-nums">{Math.round(weather.cloudCover)}%</span>
        </div>
      </div>
    </Card>
  );
}
