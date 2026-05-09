import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRestaurantById } from '../services/restaurantService';
import { fetchSunForRestaurant } from '../services/sunService';
import { useSelectedTime } from '../contexts/TimeContext';
import EntityDetail from '../components/EntityDetail';
import type { DetailLink, DetailRow } from '../components/EntityDetail';

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { selectedTime } = useSelectedTime();

  const { data: restaurant, isLoading, isError } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => getRestaurantById(id!),
    enabled: !!id,
  });

  const { data: sunResponse } = useQuery({
    queryKey: ['sun-restaurant', id, selectedTime],
    queryFn: () => fetchSunForRestaurant(id!, selectedTime),
    enabled: !!id,
  });

  const sun = sunResponse?.sunData;

  const rows: DetailRow[] = [];
  if (restaurant?.phone)         rows.push({ label: 'Phone',    value: restaurant.phone, href: `tel:${restaurant.phone}` });
  if (restaurant?.openingHours)  rows.push({ label: 'Hours',    value: restaurant.openingHours });
  if (restaurant?.takeaway != null) rows.push({ label: 'Takeaway', value: restaurant.takeaway ? 'Yes' : 'No' });

  const links: DetailLink[] = [];
  if (restaurant?.website) links.push({ href: restaurant.website, label: 'Visit website', external: true });
  if (restaurant?.osmUri)  links.push({ href: restaurant.osmUri,  label: 'OpenStreetMap',  external: true });

  return (
    <EntityDetail
      kind="restaurant"
      isLoading={isLoading}
      isError={isError}
      title={restaurant?.name}
      address={restaurant?.address}
      category={restaurant?.cuisine ? { label: restaurant.cuisine, tone: 'sky' } : undefined}
      intensity={restaurant?.intensity}
      sun={sun ? {
        altitudeDeg: (sun.altitude * 180) / Math.PI,
        azimuthDeg:  (sun.azimuth  * 180) / Math.PI,
        goldenHourEvening: sun.goldenHour ? { start: new Date(sun.goldenHour.duskStart), end: new Date(sun.goldenHour.duskEnd) } : undefined,
      } : undefined}
      rows={rows}
      mapState={id ? { focusId: id, type: 'restaurant' } : undefined}
      links={links}
    />
  );
}
