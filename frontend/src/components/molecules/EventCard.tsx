import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Event } from '@/types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export interface EventCardProps {
  event: Event;
}

/**
 * Молекула: карточка мероприятия.
 */
export function EventCard({ event }: EventCardProps) {
  return (
    <Card className="overflow-hidden transition hover:shadow-md" data-testid="event-card">
      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            <Link href={`/events/${event.id}`} className="hover:text-primary-700">
              {event.title}
            </Link>
          </h3>
          {event.price === 0 && <Badge tone="green">Бесплатно</Badge>}
        </div>

        <p className="mb-3 line-clamp-2 text-sm text-gray-600">{event.description}</p>

        <div className="mb-4 flex flex-wrap gap-2 text-sm text-gray-600">
          <span>📅 {formatDate(event.startDate)}</span>
          <span>📍 {event.location}</span>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="text-xl font-bold text-primary-700">
            {event.price === 0 ? 'Бесплатно' : `${event.price} ₽`}
          </span>
          <Link
            href={`/events/${event.id}`}
            className="rounded-lg bg-nordic px-4 py-2 text-sm font-medium text-white transition hover:bg-nordic-light"
          >
            Подробнее
          </Link>
        </div>
      </div>
    </Card>
  );
}