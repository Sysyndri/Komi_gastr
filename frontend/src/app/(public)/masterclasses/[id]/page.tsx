"use client";

/**
 * Страница мастер-класса: детали + запись.
 */
import { useState } from "react";
import toast from "react-hot-toast";
import { useMasterClass } from "@/hooks/useMasterClasses";
import {
  useBookMasterClass,
  useCancelMasterClassBooking,
  useMyBookings,
} from "@/hooks/useBookings";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { BookingForm } from "@/components/molecules/BookingForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MasterClassDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const { isAuthenticated } = useAuth();
  const mcQuery = useMasterClass(id);
  const myBookingsQuery = useMyBookings(isAuthenticated);
  const bookMutation = useBookMasterClass();
  const cancelMutation = useCancelMasterClassBooking();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (mcQuery.isLoading) return <Spinner label="Загружаем мастер-класс..." />;
  if (mcQuery.isError || !mcQuery.data) {
    return (
      <p className="py-8 text-center text-red-600">Мастер-класс не найден.</p>
    );
  }

  const mc = mcQuery.data;
  const myBooking = myBookingsQuery.data?.masterClasses.find(
    (b) => b.masterClassId === id && b.status === "CONFIRMED",
  );
  const isAlreadyBooked = !!myBooking;

  const handleBook = async () => {
    setConfirmOpen(false);
    try {
      await bookMutation.mutateAsync(id);
      toast.success("Вы успешно записаны на мастер-класс!");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleCancel = async () => {
    if (!myBooking) return;
    try {
      await cancelMutation.mutateAsync(myBooking.id);
      toast.success("Запись отменена");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-2 flex items-start justify-between">
          <h1 className="text-3xl font-bold text-gray-900">{mc.title}</h1>
          {mc.status === "ACTIVE" && <Badge tone="green">Активен</Badge>}
        </div>

        {mc.shortDescription && (
          <p className="mb-4 text-lg text-gray-600">{mc.shortDescription}</p>
        )}

        <p className="mb-6 text-gray-700">{mc.description}</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Дата и время</p>
            <p className="font-medium">{formatDate(mc.date)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Длительность</p>
            <p className="font-medium">{mc.durationMin} мин</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Стоимость</p>
            <p className="font-medium">
              {mc.price === 0 ? "Бесплатно" : `${mc.price} ₽`}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Свободно мест</p>
            <p className="font-medium">
              {mc.availableSeats ?? mc.maxParticipants} из {mc.maxParticipants}
            </p>
          </div>
        </div>

        {mc.place && (
          <p className="mt-4 text-sm text-gray-600">
            📍 Место проведения:{" "}
            <span className="font-medium">{mc.place.name}</span> —{" "}
            {mc.place.address}
          </p>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Запись на мастер-класс
        </h2>
        {isAuthenticated && !isAlreadyBooked ? (
          <>
            <p className="mb-4 text-sm text-gray-600">
              Нажмите «Записаться», чтобы забронировать место. Вы получите
              подтверждение на email.
            </p>
            <Button
              size="lg"
              onClick={() => setConfirmOpen(true)}
              isLoading={bookMutation.isPending}
            >
              Записаться
            </Button>
            <Modal
              open={confirmOpen}
              title="Подтверждение записи"
              onClose={() => setConfirmOpen(false)}
            >
              <p className="mb-4 text-gray-700">
                Подтвердите запись на мастер-класс «{mc.title}» (
                {formatDate(mc.date)}).
                {mc.price > 0 && ` Стоимость: ${mc.price} ₽.`}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={handleBook} isLoading={bookMutation.isPending}>
                  Подтвердить запись
                </Button>
              </div>
            </Modal>
          </>
        ) : (
          <BookingForm
            masterClass={mc}
            isAlreadyBooked={isAlreadyBooked}
            isAuthenticated={isAuthenticated}
            onSubmit={handleBook}
            onCancel={handleCancel}
          />
        )}
      </Card>
    </div>
  );
}
