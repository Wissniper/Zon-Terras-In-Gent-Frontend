import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTerrasById } from '../services/terrasService';
import { useEntityIntensity } from '../hooks/useEntityIntensity';
import EntityDetail from '../components/EntityDetail';
import type { DetailLink } from '../components/EntityDetail';

export default function TerrasDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: terras, isLoading, isError } = useQuery({
    queryKey: ['terras', id],
    queryFn: () => getTerrasById(id!),
    enabled: !!id,
  });

  // Same canonical intensity hook the leaderboard / popup / discover use,
  // so the ring on this page never disagrees with what the map shows.
  const live = useEntityIntensity('terras', id ?? null);
  const sun = live.data?.sun;

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
      intensity={live.intensity}
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
