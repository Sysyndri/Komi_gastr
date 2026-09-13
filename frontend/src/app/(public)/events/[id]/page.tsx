'use client';

/**
 * Страница мероприятия: детали + участие.
 */
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useEvent } from '@/hooks/useEvents';
import { useBookEvent, useCancelEventBooking, useMyBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { isAuthenticated } = useAuth();
  const eventQuery = useEvent(id);
  const myBookingsQuery = useMyBookings(isAuthenticated);
  const bookMutation = useBookEvent();
  const cancelMutation = useCancelEventBooking();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (eventQuery.isLoading) return <Spinner label="Загружаем мероприятие..." />;
  if (eventQuery.isError || !eventQuery.data) {
    return <p className="py-8 text-center text-red-600">Мероприятие не найдено.</p>;
  }

  const event = eventQuery.data;
  const myBooking = myBookingsQuery.data?.events.find((b) => b.eventId === id && b.status === 'CONFIRMED');
  const isRegistered = !!myBooking;

  const handleBook = async () => {
    setConfirmOpen(false);
    try {
      await bookMutation.mutateAsync(id);
      toast.success('Вы участвуете в мероприятии!');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleCancel = async () => {
    if (!myBooking) return;
    try {
      await cancelMutation.mutateAsync(myBooking.id);
      toast.success('Участие отменено');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-2 flex items-start justify-between">
          <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
          {event.price === 0 && <Badge tone="green">Бесплатно</Badge>}
        </div>

        <p className="mb-6 text-gray-700">{event.description}</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Дата начала</p>
            <p className="font-medium">{formatDate(event.startDate)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Место</p>
            <p className="font-medium">{event.location}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Стоимость</p>
            <p className="font-medium">{event.price === 0 ? 'Бесплатно' : `${event.price} ₽`}</p>
          </div>
        </div>

        {event.maxVisitors && (
          <p className="mt-4 text-sm text-gray-500">
            Зарегистрировано: {event.bookingsCount ?? 0} из {event.maxVisitors}
          </p>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Участие в мероприятии</h2>

        {!isAuthenticated ? (
          <p className="text-sm text-gray-600">
            Для участия необходимо{' '}
            <a href="/login" className="font-medium text-primary-600 underline">
              войти в систему
            </a>
            .
          </p>
        ) : isRegistered ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-green-700">Вы зарегистрированы на это мероприятие!</p>
            <Button variant="outline" onClick={handleCancel} isLoading={cancelMutation.isPending}>
              Отменить участие
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-600">
              Подтвердите участие в «{event.title}».
              {event.price > 0 && ` Стоимость: ${event.price} ₽.`}
            </p>
            <Button size="lg" onClick={() => setConfirmOpen(true)} isLoading={bookMutation.isPending}>
              Участвовать
            </Button>
            <Modal open={confirmOpen} title="Подтверждение участия" onClose={() => setConfirmOpen(false)}>
              <p className="mb-4 text-gray-700">
                Вы собираетесь участвовать в мероприятии «{event.title}» ({formatDate(event.startDate)}).
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={handleBook}>Подтвердить</Button>
              </div>
            </Modal>
          </>
        )}
      </Card>
    </div>
  );
}