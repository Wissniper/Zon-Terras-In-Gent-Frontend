import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRestaurantById } from '../services/restaurantService';
import { fetchSunForRestaurant } from '../services/sunService';

function intensityColor(v: number) {
  return v >= 70 ? '#D97706' : v >= 40 ? '#F5A623' : '#9CA3AF';
}

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-xs font-bold uppercase tracking-label text-text-3 shrink-0 pt-0.5">{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer"
          className="text-sm text-primary hover:underline text-right">{value}</a>
      ) : (
        <span className="text-sm text-text-1 text-right">{value}</span>
      )}
    </div>
  );
}

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: restaurant, isLoading, isError } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => getRestaurantById(id!),
    enabled: !!id,
  });

  const { data: sunResponse } = useQuery({
    queryKey: ['sun-restaurant', id],
    queryFn: () => fetchSunForRestaurant(id!),
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center bg-bg">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (isError || !restaurant) return (
    <div className="flex-1 flex items-center justify-center bg-bg">
      <p className="text-sm text-text-2">Restaurant not found.</p>
    </div>
  );

  const [lng, lat] = restaurant.location.coordinates;
  const sun = sunResponse?.sunData;
  const color = intensityColor(restaurant.intensity);
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
            <h1 className="text-xl font-semibold text-text-1 leading-tight">{restaurant.name}</h1>
            <span
              className="text-xs font-bold uppercase tracking-label shrink-0 mt-0.5 capitalize"
              style={{ color: '#75D1FF' }}
            >
              {restaurant.cuisine}
            </span>
          </div>
          <p className="text-sm text-text-2 mb-5">{restaurant.address}</p>

          <div className="mb-5">
            <div className="flex items-end justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-label text-text-3">Sun Intensity</p>
              <span className="font-light tabular-nums" style={{ fontSize: '2.5rem', lineHeight: 1, color, letterSpacing: '-0.02em' }}>
                {restaurant.intensity}<span className="text-lg">%</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${restaurant.intensity}%`, background: color }} />
            </div>
          </div>

          <div className="divide-y divide-surface-3">
            {restaurant.phone && <Row label="Phone" value={restaurant.phone} href={`tel:${restaurant.phone}`} />}
            {restaurant.openingHours && <Row label="Hours" value={restaurant.openingHours} />}
            {restaurant.takeaway !== undefined && (
              <Row label="Takeaway" value={restaurant.takeaway ? 'Yes' : 'No'} />
            )}
            {restaurant.website && <Row label="Website" value="Visit website" href={restaurant.website} />}
            {restaurant.osmUri && <Row label="Location" value="OpenStreetMap" href={restaurant.osmUri} />}
          </div>
        </div>

        {/* Sun data */}
        {sun && (
          <div className="bg-surface rounded-2xl shadow-soft p-5">
            <p className="text-xs font-bold uppercase tracking-label text-text-3 mb-4">Sun Data</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-surface-2 rounded-xl p-3">
                <p className="text-xs font-bold uppercase tracking-label text-text-3">Altitude</p>
                <p className="text-base font-semibold text-text-1 mt-1">{Math.round((sun.altitude * 180) / Math.PI)}°</p>
              </div>
              <div className="bg-surface-2 rounded-xl p-3">
                <p className="text-xs font-bold uppercase tracking-label text-text-3">Now</p>
                <p className="text-base font-semibold mt-1" style={{ color }}>{sun.intensity}%</p>
              </div>
              {sun.goldenHour && (
                <div className="bg-surface-2 rounded-xl p-3 col-span-2">
                  <p className="text-xs font-bold uppercase tracking-label text-text-3 mb-1">Evening golden hour</p>
                  <p className="text-sm font-semibold" style={{ color: '#F5A623' }}>
                    {new Date(sun.goldenHour.duskStart).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {new Date(sun.goldenHour.duskEnd).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-2xl overflow-hidden shadow-soft h-52 bg-surface-2">
          <iframe src={osmUrl} title={`Map of ${restaurant.name}`} className="w-full h-full" loading="lazy" />
        </div>
      </div>
    </div>
  );
}
