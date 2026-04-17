import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTerrasById } from '../services/terrasService';
import { fetchSunForTerras } from '../services/sunService';

function intensityColor(v: number) {
  return v >= 70 ? '#D97706' : v >= 40 ? '#F5A623' : '#9CA3AF';
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-surface-2 rounded-xl p-3">
      <p className="text-xs font-bold uppercase tracking-label text-text-3">{label}</p>
      <p className="text-base font-semibold text-text-1 mt-1">{value}</p>
      {sub && <p className="text-xs text-text-3 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function TerrasDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: terras, isLoading, isError } = useQuery({
    queryKey: ['terras', id],
    queryFn: () => getTerrasById(id!),
    enabled: !!id,
  });

  const { data: sunResponse } = useQuery({
    queryKey: ['sun-terras', id],
    queryFn: () => fetchSunForTerras(id!),
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center bg-bg">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-text-2 hover:text-text-1 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="bg-surface rounded-2xl shadow-soft p-5">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h1 className="text-xl font-semibold text-text-1 leading-tight">{terras.name}</h1>
            <span className="text-xs font-bold uppercase tracking-label text-text-3 shrink-0 mt-0.5">Terrace</span>
          </div>
          <p className="text-sm text-text-2 mb-5">{terras.address}</p>

          <div className="mb-5">
            <div className="flex items-end justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-label text-text-3">Sun Intensity</p>
              <span className="font-light tabular-nums" style={{ fontSize: '2.5rem', lineHeight: 1, color, letterSpacing: '-0.02em' }}>
                {terras.intensity}<span className="text-lg">%</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${terras.intensity}%`, background: color }} />
            </div>
          </div>

          {terras.description && (
            <p className="text-sm text-text-2 mb-4">{terras.description}</p>
          )}

          <div className="flex flex-wrap gap-4">
            {terras.url && (
              <a href={terras.url} target="_blank" rel="noopener noreferrer"
                className="text-xs font-medium text-primary hover:underline">
                Website
              </a>
            )}
            {terras.osmUri && (
              <a href={terras.osmUri} target="_blank" rel="noopener noreferrer"
                className="text-xs text-text-3 hover:text-text-2 transition-colors">
                OpenStreetMap
              </a>
            )}
          </div>
        </div>

        {/* Sun data */}
        {sun && (
          <div className="bg-surface rounded-2xl shadow-soft p-5">
            <p className="text-xs font-bold uppercase tracking-label text-text-3 mb-4">Sun Data</p>
            <div className="grid grid-cols-2 gap-2.5">
              <Stat label="Altitude" value={`${Math.round((sun.altitude * 180) / Math.PI)}°`} />
              <Stat label="Azimuth" value={`${Math.round((sun.azimuth * 180) / Math.PI)}°`} />
              {sun.goldenHour && (
                <>
                  <Stat
                    label="Morning golden"
                    value={new Date(sun.goldenHour.dawnStart).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    sub={`until ${new Date(sun.goldenHour.dawnEnd).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
                  />
                  <Stat
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
        <div className="rounded-2xl overflow-hidden shadow-soft h-52 bg-surface-2">
          <iframe src={osmUrl} title={`Map of ${terras.name}`} className="w-full h-full" loading="lazy" />
        </div>
      </div>
    </div>
  );
}
