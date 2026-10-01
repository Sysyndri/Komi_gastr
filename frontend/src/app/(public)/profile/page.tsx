'use client';

/**
 * Профиль пользователя: мои записи на МК и мероприятия.
 */
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMyBookings, useCancelMasterClassBooking, useCancelEventBooking } from '@/hooks/useBookings';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusTone = { CONFIRMED: 'green', CANCELLED: 'gray', COMPLETED: 'blue' } as const;
const statusLabel = { CONFIRMED: 'Подтверждена', CANCELLED: 'Отменена', COMPLETED: 'Завершена' } as const;

export default function ProfilePage() {
  const { user } = useAuth();
  const bookingsQuery = useMyBookings(true);
  const cancelMC = useCancelMasterClassBooking();
  const cancelEvent = useCancelEventBooking();

  const handleCancelMC = async (id: string) => {
    try {
      await cancelMC.mutateAsync(id);
      toast.success('Запись отменена');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleCancelEvent = async (id: string) => {
    try {
      await cancelEvent.mutateAsync(id);
      toast.success('Участие отменено');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (bookingsQuery.isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <h1 className="h1-berry text-xl font-semibold sm:text-2xl">Личный кабинет</h1>
        <div className="mt-3 text-sm text-gray-600">
          <p>
            <span className="font-medium">Имя:</span> {user?.name}
          </p>
          <p>
            <span className="font-medium">Email:</span> {user?.email}
          </p>
          <p>
            <span className="font-medium">Роль:</span>{' '}
            <Badge tone={user?.role === 'ADMIN' ? 'red' : user?.role === 'MODERATOR' ? 'amber' : 'green'}>
              {user?.role}
            </Badge>
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Мои записи на мастер-классы</h2>

        {bookingsQuery.data?.masterClasses.length === 0 && (
          <p className="text-sm text-gray-500">
            У вас пока нет записей.{' '}
            <Link href="/masterclasses" className="font-medium text-primary-600">
              Выбрать мастер-класс
            </Link>
          </p>
        )}

        <ul className="space-y-3">
          {bookingsQuery.data?.masterClasses.map((booking) => (
            <li
              key={booking.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 p-4"
              data-testid="mc-booking"
            >
              <div>
                <p className="font-medium text-gray-900">
                  <Link href={`/masterclasses/${booking.masterClassId}`} className="hover:text-primary-700">
                    {booking.masterClass?.title}
                  </Link>
                </p>
                {booking.masterClass && (
                  <p className="text-sm text-gray-500">📅 {formatDate(booking.masterClass.date)}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={statusTone[booking.status]}>{statusLabel[booking.status]}</Badge>
                {booking.status === 'CONFIRMED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleCancelMC(booking.id)}
                    isLoading={cancelMC.isPending}
                  >
                    Отменить
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Мои мероприятия</h2>

        {bookingsQuery.data?.events.length === 0 && (
          <p className="text-sm text-gray-500">
            Вы пока не участвуете в мероприятиях.{' '}
            <Link href="/events" className="font-medium text-primary-600">
              Смотреть мероприятия
            </Link>
          </p>
        )}

        <ul className="space-y-3">
          {bookingsQuery.data?.events.map((booking) => (
            <li
              key={booking.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 p-4"
              data-testid="event-booking"
            >
              <div>
                <p className="font-medium text-gray-900">
                  <Link href={`/events/${booking.eventId}`} className="hover:text-primary-700">
                    {booking.event?.title}
                  </Link>
                </p>
                {booking.event && (
                  <p className="text-sm text-gray-500">📍 {booking.event.location}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={statusTone[booking.status]}>{statusLabel[booking.status]}</Badge>
                {booking.status === 'CONFIRMED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleCancelEvent(booking.id)}
                    isLoading={cancelEvent.isPending}
                  >
                    Отменить
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}