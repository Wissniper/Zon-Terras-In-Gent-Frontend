import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRestaurantById } from '../services/restaurantService';
import { fetchSunForRestaurant } from '../services/sunService';

function intensityColor(v: number) {
  return v >= 70 ? '#E5870A' : v >= 40 ? '#F5AC32' : '#9B8570';
}

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3" style={{ borderBottom: '1px solid #F5EEE2' }}>
      <span className="text-xs font-medium uppercase tracking-label text-text-3 shrink-0 pt-0.5" style={{ letterSpacing: '0.10em' }}>{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer"
          className="text-sm font-medium text-right transition-colors"
          style={{ color: '#E5870A' }}
        >{value}</a>
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
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#E5870A', borderTopColor: 'transparent' }} />
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

        {/* Header card */}
        <div className="bg-surface rounded-3xl p-6 fade-up" style={{ border: '1px solid #EDE4D3', boxShadow: '0 4px 24px rgba(26,18,8,0.07)' }}>
          <div className="flex items-start justify-between gap-3 mb-1">
            <h1 className="font-display text-2xl font-semibold text-text-1 leading-tight">{restaurant.name}</h1>
            <span
              className="text-xs font-medium capitalize px-2 py-1 rounded-lg shrink-0 mt-1"
              style={{ color: '#6DC2E8', background: '#EBF7FF' }}
            >
              {restaurant.cuisine}
            </span>
          </div>
          <p className="text-sm text-text-3 mb-6">{restaurant.address}</p>

          {/* Intensity hero */}
          <div className="mb-6 p-4 rounded-2xl" style={{ background: `${color}0D`, border: `1px solid ${color}30` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-label text-text-3" style={{ letterSpacing: '0.10em' }}>Sun Intensity</p>
              <span
                className="font-display tabular-nums"
                style={{ fontSize: '3rem', lineHeight: 1, color, letterSpacing: '-0.03em' }}
              >
                {restaurant.intensity}<span className="text-xl">%</span>
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#EDE4D3' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${restaurant.intensity}%`, background: `linear-gradient(to right, ${color}88, ${color})` }}
              />
            </div>
          </div>

          {/* Details rows */}
          <div>
            {restaurant.phone && <Row label="Phone" value={restaurant.phone} href={`tel:${restaurant.phone}`} />}
            {restaurant.openingHours && <Row label="Hours" value={restaurant.openingHours} />}
            {restaurant.takeaway !== undefined && (
              <Row label="Takeaway" value={restaurant.takeaway ? 'Yes' : 'No'} />
            )}
            {restaurant.website && <Row label="Website" value="Visit website ↗" href={restaurant.website} />}
            {restaurant.osmUri && <Row label="Location" value="OpenStreetMap ↗" href={restaurant.osmUri} />}
          </div>
        </div>

        {/* Sun data */}
        {sun && (
          <div className="bg-surface rounded-3xl p-6 fade-up fade-up-delay-1" style={{ border: '1px solid #EDE4D3', boxShadow: '0 4px 24px rgba(26,18,8,0.07)' }}>
            <p className="text-xs font-medium uppercase tracking-label text-text-3 mb-4" style={{ letterSpacing: '0.10em' }}>Sun Data</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl p-3.5" style={{ background: '#FAF5EC', border: '1px solid #EDE4D3' }}>
                <p className="text-xs font-medium uppercase tracking-label text-text-3" style={{ letterSpacing: '0.10em' }}>Altitude</p>
                <p className="font-display text-lg font-semibold text-text-1 mt-1">{Math.round((sun.altitude * 180) / Math.PI)}°</p>
              </div>
              <div className="rounded-xl p-3.5" style={{ background: '#FAF5EC', border: '1px solid #EDE4D3' }}>
                <p className="text-xs font-medium uppercase tracking-label text-text-3" style={{ letterSpacing: '0.10em' }}>Intensity now</p>
                <p className="font-display text-lg font-semibold mt-1" style={{ color }}>{sun.intensity}%</p>
              </div>
              {sun.goldenHour && (
                <div className="rounded-xl p-3.5 col-span-2" style={{ background: '#FEF5E6', border: '1px solid rgba(229,135,10,0.2)' }}>
                  <p className="text-xs font-medium uppercase tracking-label text-text-3 mb-1" style={{ letterSpacing: '0.10em' }}>Evening golden hour</p>
                  <p className="font-display text-lg font-semibold" style={{ color: '#E5870A' }}>
                    {new Date(sun.goldenHour.duskStart).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {new Date(sun.goldenHour.duskEnd).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-3xl overflow-hidden h-56 fade-up fade-up-delay-2" style={{ border: '1px solid #EDE4D3', boxShadow: '0 4px 24px rgba(26,18,8,0.07)' }}>
          <iframe src={osmUrl} title={`Map of ${restaurant.name}`} className="w-full h-full" loading="lazy" />
        </div>
      </div>
    </div>
  );
}
