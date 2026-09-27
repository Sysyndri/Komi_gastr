import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Event } from "@/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export interface EventCardProps {
  event: Event;
}

/**
 * Молекула: карточка мероприятия.
 * Вся карточка кликабельна и ведёт на страницу мероприятия.
 */
export function EventCard({ event }: EventCardProps) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="group block cursor-pointer transition hover:-translate-y-0.5"
      data-testid="event-card"
    >
      <Card className="h-full overflow-hidden transition group-hover:shadow-md">
        <div className="p-5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700">
              {event.title}
            </h3>
            {event.price === 0 && <Badge tone="green">Бесплатно</Badge>}
          </div>

          <p className="mb-3 line-clamp-2 text-sm text-gray-600">
            {event.description}
          </p>

          <div className="mb-4 flex flex-wrap gap-2 text-sm text-gray-600">
            <span>📅 {formatDate(event.startDate)}</span>
            <span>📍 {event.location}</span>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-xl font-bold text-primary-700">
              {event.price === 0 ? "Бесплатно" : `${event.price} ₽`}
            </span>
            <span className="rounded-lg bg-nordic px-4 py-2 text-sm font-medium text-white transition group-hover:bg-nordic-light">
              Подробнее
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
