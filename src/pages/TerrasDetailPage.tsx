import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTerrasById } from '../services/terrasService';
import { fetchSunForTerras } from '../services/sunService';
import { intensityColor } from '../utils/intensity';
import { useSelectedTime } from '../contexts/TimeContext';

function SunStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl p-3.5" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
      <p className="text-xs font-medium uppercase tracking-label text-text-3" style={{ letterSpacing: '0.10em' }}>{label}</p>
      <p className="font-display text-lg font-semibold text-text-1 mt-1">{value}</p>
      {sub && <p className="text-xs text-text-3 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function TerrasDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedTime } = useSelectedTime();

  const { data: terras, isLoading, isError } = useQuery({
    queryKey: ['terras', id],
    queryFn: () => getTerrasById(id!),
    enabled: !!id,
  });

  const { data: sunResponse } = useQuery({
    queryKey: ['sun-terras', id, selectedTime],
    queryFn: () => fetchSunForTerras(id!, selectedTime),
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center bg-bg">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (isError || !terras) return (
    <div className="flex-1 flex items-center justify-center bg-bg">
      <p className="text-sm text-text-2">Terrace not found.</p>
    </div>
  );

  const [lng, lat] = terras.location.coordinates;
  const sun = sunResponse?.sunData;
  const color = intensityColor(terras.intensity);
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.004},${lat - 0.003},${lng + 0.004},${lat + 0.003}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className="flex-1 overflow-y-auto bg-bg">
      <div className="max-w-xl mx-auto px-4 py-7 space-y-4">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-text-3 hover:text-text-2 transition-colors py-1 min-h-[44px]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        {/* Header card */}
        <div className="bg-surface rounded-3xl p-6 fade-up" style={{ border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-soft)' }}>
          <div className="flex items-start justify-between gap-3 mb-1">
            <h1 className="font-display text-fluid-2xl font-semibold text-text-1 leading-tight">{terras.name}</h1>
            <span
              className="text-xs font-medium uppercase tracking-label text-text-3 shrink-0 mt-1 px-2 py-1 rounded-lg"
              style={{ background: 'var(--color-surface-2)' }}
            >
              Terrace
            </span>
          </div>
          <p className="text-sm text-text-3 mb-6">{terras.address}</p>

          {/* Intensity hero */}
          <div className="mb-6 p-4 rounded-2xl" style={{ background: `${color}0D`, border: `1px solid ${color}30` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-label text-text-3" style={{ letterSpacing: '0.10em' }}>Sun Intensity</p>
              <span
                className="font-display tabular-nums"
                style={{ fontSize: '3rem', lineHeight: 1, color, letterSpacing: '-0.03em' }}
              >
                {terras.intensity}<span className="text-xl">%</span>
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-track)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${terras.intensity}%`, background: `linear-gradient(to right, ${color}88, ${color})` }}
              />
            </div>
          </div>

          {terras.description && (
            <p className="text-sm text-text-2 mb-5 leading-relaxed">{terras.description}</p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/', { state: { focusId: id, type: 'terras' } })}
              className="text-xs font-medium px-4 py-2.5 rounded-lg transition-colors min-h-[44px] flex items-center"
              style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: '1px solid var(--color-primary-border)' }}
            >
              View on 3D map ↗
            </button>
            {terras.url && (
              <a
                href={terras.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium px-4 py-2.5 rounded-lg transition-colors text-text-3 min-h-[44px] flex items-center"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
              >
                Visit website ↗
              </a>
            )}
            {terras.osmUri && (
              <a
                href={terras.osmUri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium px-4 py-2.5 rounded-lg transition-colors text-text-3 min-h-[44px] flex items-center"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
              >
                OpenStreetMap ↗
              </a>
            )}
          </div>
        </div>

        {/* Sun data */}
        {sun && (
          <div className="bg-surface rounded-3xl p-6 fade-up fade-up-delay-1" style={{ border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-soft)' }}>
            <p className="text-xs font-medium uppercase tracking-label text-text-3 mb-4" style={{ letterSpacing: '0.10em' }}>Sun Data</p>
            <div className="grid grid-cols-2 gap-2.5">
              <SunStat label="Altitude" value={`${Math.round((sun.altitude * 180) / Math.PI)}°`} />
              <SunStat label="Azimuth" value={`${Math.round((sun.azimuth * 180) / Math.PI)}°`} />
              {sun.goldenHour && (
                <>
                  <SunStat
                    label="Morning golden"
                    value={new Date(sun.goldenHour.dawnStart).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    sub={`until ${new Date(sun.goldenHour.dawnEnd).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
                  />
                  <SunStat
                    label="Evening golden"
                    value={new Date(sun.goldenHour.duskStart).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    sub={`until ${new Date(sun.goldenHour.duskEnd).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Map */}
        <div className="rounded-3xl overflow-hidden h-56 fade-up fade-up-delay-2" style={{ border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-soft)' }}>
          <iframe src={osmUrl} title={`Map of ${terras.name}`} className="w-full h-full" loading="lazy" />
        </div>
      </div>
    </div>
  );
}
