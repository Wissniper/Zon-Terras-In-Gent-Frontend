import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getEventById } from '../services/eventService';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventById(id!),
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center bg-bg">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#E5870A', borderTopColor: 'transparent' }} />
    </div>
  );

  if (isError || !event) return (
    <div className="flex-1 flex items-center justify-center bg-bg">
      <p className="text-sm text-text-2">Event not found.</p>
    </div>
  );

  const [lng, lat] = event.location.coordinates;
  const start = new Date(event.date_start);
  const end = new Date(event.date_end);
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.004},${lat - 0.003},${lng + 0.004},${lat + 0.003}&layer=mapnik&marker=${lat},${lng}`;

  const intensity = event.intensity ?? 0;
  const intensityColor = intensity >= 70 ? '#E5870A' : intensity >= 40 ? '#F5AC32' : '#9B8570';

  return (
    <div className="flex-1 overflow-y-auto bg-bg">
      <div className="max-w-xl mx-auto px-4 py-7 space-y-4">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-text-3 hover:text-text-2 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        <div className="bg-surface rounded-3xl p-6 fade-up" style={{ border: '1px solid #EDE4D3', boxShadow: '0 4px 24px rgba(26,18,8,0.07)' }}>
          <div className="flex items-start justify-between gap-3 mb-1">
            <h1 className="font-display text-2xl font-semibold text-text-1 leading-tight">{event.title}</h1>
            <span
              className="text-xs font-medium px-2 py-1 rounded-lg shrink-0 mt-1"
              style={{ color: '#6DC2E8', background: '#EBF7FF' }}
            >
              Event
            </span>
          </div>
          <p className="text-sm text-text-3 mb-6">{event.address}</p>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-2.5 mb-6">
            <div className="rounded-xl p-3.5" style={{ background: '#FAF5EC', border: '1px solid #EDE4D3' }}>
              <p className="text-xs font-medium uppercase tracking-label text-text-3" style={{ letterSpacing: '0.10em' }}>Start</p>
              <p className="font-display text-base font-semibold text-text-1 mt-1">
                {start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              {start.getHours() !== 0 && (
                <p className="text-xs text-text-3 mt-0.5">
                  {start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
            <div className="rounded-xl p-3.5" style={{ background: '#FAF5EC', border: '1px solid #EDE4D3' }}>
              <p className="text-xs font-medium uppercase tracking-label text-text-3" style={{ letterSpacing: '0.10em' }}>End</p>
              <p className="font-display text-base font-semibold text-text-1 mt-1">
                {end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              {end.getHours() !== 0 && (
                <p className="text-xs text-text-3 mt-0.5">
                  {end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>

          {event.description && (
            <p className="text-sm text-text-2 leading-relaxed mb-6">{event.description}</p>
          )}

          {event.intensity != null && (
            <div className="mb-5 p-4 rounded-2xl" style={{ background: `${intensityColor}0D`, border: `1px solid ${intensityColor}30` }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium uppercase tracking-label text-text-3" style={{ letterSpacing: '0.10em' }}>Expected sun</p>
                <span className="font-display text-2xl font-semibold tabular-nums" style={{ color: intensityColor }}>
                  {event.intensity}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: '#EDE4D3' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${event.intensity}%`, background: `linear-gradient(to right, ${intensityColor}88, ${intensityColor})` }}
                />
              </div>
            </div>
          )}

          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: '#FEF5E6', color: '#E5870A', border: '1px solid rgba(229,135,10,0.2)' }}
            >
              More information ↗
            </a>
          )}
        </div>

        <div className="rounded-3xl overflow-hidden h-56 fade-up fade-up-delay-1" style={{ border: '1px solid #EDE4D3', boxShadow: '0 4px 24px rgba(26,18,8,0.07)' }}>
          <iframe src={osmUrl} title={`Map of ${event.title}`} className="w-full h-full" loading="lazy" />
        </div>
      </div>
    </div>
  );
}
