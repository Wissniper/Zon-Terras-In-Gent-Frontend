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
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
  const intensityColor = intensity >= 70 ? '#D97706' : intensity >= 40 ? '#F5A623' : '#9CA3AF';

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

        <div className="bg-surface rounded-2xl shadow-soft p-5">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h1 className="text-xl font-semibold text-text-1 leading-tight">{event.title}</h1>
            <span className="text-xs font-bold uppercase tracking-label shrink-0 mt-0.5" style={{ color: '#75D1FF' }}>
              Event
            </span>
          </div>
          <p className="text-sm text-text-2 mb-5">{event.address}</p>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <div className="bg-surface-2 rounded-xl p-3">
              <p className="text-xs font-bold uppercase tracking-label text-text-3">Start</p>
              <p className="text-sm font-semibold text-text-1 mt-1">
                {start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              {start.getHours() !== 0 && (
                <p className="text-xs text-text-2 mt-0.5">
                  {start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
            <div className="bg-surface-2 rounded-xl p-3">
              <p className="text-xs font-bold uppercase tracking-label text-text-3">End</p>
              <p className="text-sm font-semibold text-text-1 mt-1">
                {end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              {end.getHours() !== 0 && (
                <p className="text-xs text-text-2 mt-0.5">
                  {end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>

          {event.description && (
            <p className="text-sm text-text-2 leading-relaxed mb-5">{event.description}</p>
          )}

          {event.intensity != null && (
            <div className="mb-4">
              <div className="flex items-end justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-label text-text-3">Expected sun</p>
                <span className="text-xl font-semibold tabular-nums" style={{ color: intensityColor }}>
                  {event.intensity}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${event.intensity}%`, background: intensityColor }} />
              </div>
            </div>
          )}

          {event.url && (
            <a href={event.url} target="_blank" rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline">
              More information
            </a>
          )}
        </div>

        <div className="rounded-2xl overflow-hidden shadow-soft h-52 bg-surface-2">
          <iframe src={osmUrl} title={`Map of ${event.title}`} className="w-full h-full" loading="lazy" />
        </div>
      </div>
    </div>
  );
}
