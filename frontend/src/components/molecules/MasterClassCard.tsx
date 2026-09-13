import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MasterClass } from "@/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface MasterClassCardProps {
  masterClass: MasterClass;
}

/**
 * Молекула: карточка мастер-класса.
 */
export function MasterClassCard({ masterClass }: MasterClassCardProps) {
  const available = masterClass.availableSeats ?? masterClass.maxParticipants;
  return (
    <Card className="overflow-hidden transition hover:shadow-md" data-testid="masterclass-card">
      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            <Link href={`/masterclasses/${masterClass.id}`} className="hover:text-primary-700">
              {masterClass.title}
            </Link>
          </h3>
          {masterClass.dish && (
            <Badge tone="blue">{masterClass.dish.name}</Badge>
          )}
        </div>

        {masterClass.shortDescription && (
          <p className="mb-3 text-sm text-gray-600">{masterClass.shortDescription}</p>
        )}

        <div className="mb-4 flex flex-wrap gap-2 text-sm text-gray-600">
          <span>📅 {formatDate(masterClass.date)}</span>
          <span>⏱ {masterClass.durationMin} мин</span>
          {masterClass.place && <span>📍 {masterClass.place.name}</span>}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <div>
            <span className="text-xl font-bold text-primary-700">
              {masterClass.price === 0 ? 'Бесплатно' : `${masterClass.price} ₽`}
            </span>
            <p className="text-xs text-gray-500">
              {available > 0 ? `Свободно ${available} мест` : 'Мест нет'}
            </p>
          </div>
          <Link
            href={`/masterclasses/${masterClass.id}`}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            Подробнее
          </Link>
        </div>
      </div>
    </Card>
  );
}