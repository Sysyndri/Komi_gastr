import { EventCard } from '@/components/molecules/EventCard';
import { Spinner } from '@/components/ui/Spinner';
import { Event } from '@/types';

export interface EventListProps {
  events: Event[] | undefined;
  isLoading: boolean;
  isError: boolean;
  emptyMessage?: string;
}

/**
 * Организм: список мероприятий.
 */
export function EventList({ events, isLoading, isError, emptyMessage = 'Мероприятия не найдены' }: EventListProps) {
  if (isLoading) return <Spinner label="Загружаем мероприятия..." />;

  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center text-red-700" role="alert">
        Не удалось загрузить мероприятия.
      </div>
    );
  }

  if (!events || events.length === 0) {
    return <p className="py-8 text-center text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="event-list">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}