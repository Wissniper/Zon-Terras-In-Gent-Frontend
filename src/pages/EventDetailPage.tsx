import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getEventById } from '../services/eventService';
import { useEntityIntensity } from '../hooks/useEntityIntensity';
import EntityDetail from '../components/EntityDetail';
import type { DetailLink, DetailRow } from '../components/EntityDetail';

const DATE_OPTS: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
const TIME_OPTS: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventById(id!),
    enabled: !!id,
  });

  const live = useEntityIntensity('event', id ?? null);

  const rows: DetailRow[] = [];
  if (event) {
    const start = new Date(event.date_start);
    const end = new Date(event.date_end);
    const sameDay = start.toDateString() === end.toDateString();

    rows.push({
      label: 'Starts',
      value: (
        <>
          {start.toLocaleDateString('en-GB', DATE_OPTS)}
          {start.getHours() !== 0 && <> · {start.toLocaleTimeString('en-GB', TIME_OPTS)}</>}
        </>
      ),
    });
    if (!sameDay || end.getHours() !== 0) {
      rows.push({
        label: 'Ends',
        value: (
          <>
            {end.toLocaleDateString('en-GB', DATE_OPTS)}
            {end.getHours() !== 0 && <> · {end.toLocaleTimeString('en-GB', TIME_OPTS)}</>}
          </>
        ),
      });
    }
  }

  const links: DetailLink[] = [];
  if (event?.url) links.push({ href: event.url, label: 'More information', external: true });

  return (
    <EntityDetail
      kind="event"
      isLoading={isLoading}
      isError={isError}
      title={event?.title}
      address={event?.address}
      category={{ label: 'Event', tone: 'terra' }}
      description={event?.description ?? undefined}
      intensity={live.intensity}
      rows={rows}
      mapState={id ? { focusId: id, type: 'event' } : undefined}
      links={links}
    />
  );
}
