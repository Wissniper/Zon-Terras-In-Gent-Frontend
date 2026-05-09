import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTerrasById } from '../services/terrasService';
import { fetchSunForTerras } from '../services/sunService';
import { useSelectedTime } from '../contexts/TimeContext';
import EntityDetail from '../components/EntityDetail';
import type { DetailLink } from '../components/EntityDetail';

export default function TerrasDetailPage() {
  const { id } = useParams<{ id: string }>();
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

  const sun = sunResponse?.sunData;

  const links: DetailLink[] = [];
  if (terras?.url)    links.push({ href: terras.url,    label: 'Visit website', external: true });
  if (terras?.osmUri) links.push({ href: terras.osmUri, label: 'OpenStreetMap',  external: true });

  return (
    <EntityDetail
      kind="terras"
      isLoading={isLoading}
      isError={isError}
      title={terras?.name}
      address={terras?.address}
      category={{ label: 'Terrace', tone: 'gold' }}
      description={terras?.description ?? undefined}
      intensity={terras?.intensity}
      sun={sun ? {
        altitudeDeg: (sun.altitude * 180) / Math.PI,
        azimuthDeg:  (sun.azimuth  * 180) / Math.PI,
        goldenHourMorning: sun.goldenHour ? { start: new Date(sun.goldenHour.dawnStart), end: new Date(sun.goldenHour.dawnEnd) } : undefined,
        goldenHourEvening: sun.goldenHour ? { start: new Date(sun.goldenHour.duskStart), end: new Date(sun.goldenHour.duskEnd) } : undefined,
      } : undefined}
      mapState={id ? { focusId: id, type: 'terras' } : undefined}
      links={links}
    />
  );
}
