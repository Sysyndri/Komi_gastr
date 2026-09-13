'use client';

/**
 * Форма создания/редактирования мероприятия.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useCreateEvent, useUpdateEvent } from '@/hooks/useEvents';
import { placesApi } from '@/lib/admin.api';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { EventFormValues, Status } from '@/types';

export interface EventFormProps {
  initialValues?: Partial<EventFormValues>;
  eventId?: string;
}

function toLocalDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ initialValues, eventId }: EventFormProps) {
  const router = useRouter();
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const placesQuery = useQuery({ queryKey: ['places'], queryFn: () => placesApi.list() });

  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [startDate, setStartDate] = useState(initialValues?.startDate ? toLocalDateTime(initialValues.startDate) : '');
  const [location, setLocation] = useState(initialValues?.location ?? '');
  const [price, setPrice] = useState(initialValues?.price ?? 0);
  const [maxVisitors, setMaxVisitors] = useState(initialValues?.maxVisitors ?? 100);
  const [status, setStatus] = useState<Status>(initialValues?.status ?? 'ACTIVE');
  const [placeId, setPlaceId] = useState(initialValues?.placeId ?? '');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload: EventFormValues = {
      title: title.trim(),
      description: description.trim(),
      startDate: new Date(startDate).toISOString(),
      location: location.trim(),
      price: Number(price),
      maxVisitors: Number(maxVisitors) || undefined,
      status,
      placeId: placeId || undefined,
    };

    try {
      if (eventId) {
        await updateMutation.mutateAsync({ id: eventId, input: payload });
        toast.success('Мероприятие обновлено');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Мероприятие создано');
      }
      router.push('/admin/events');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4" data-testid="event-form">
      <Input label="Название *" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <Textarea
        label="Описание *"
        name="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        required
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Дата начала *"
          type="datetime-local"
          name="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        <Input
          label="Локация *"
          name="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
        <Input
          label="Стоимость (₽, 0 — бесплатно)"
          type="number"
          name="price"
          min={0}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
        <Input
          label="Максимум посетителей"
          type="number"
          name="maxVisitors"
          min={1}
          value={maxVisitors}
          onChange={(e) => setMaxVisitors(Number(e.target.value))}
        />
      </div>

      <Select
        label="Место проведения"
        name="placeId"
        value={placeId}
        onChange={(e) => setPlaceId(e.target.value)}
        options={[
          { value: '', label: '— не выбрано —' },
          ...(placesQuery.data?.map((p) => ({ value: p.id, label: p.name })) ?? []),
        ]}
      />

      <Select
        label="Статус"
        name="status"
        value={status}
        onChange={(e) => setStatus(e.target.value as Status)}
        options={[
          { value: 'ACTIVE', label: 'Активен' },
          { value: 'DRAFT', label: 'Черновик' },
          { value: 'ARCHIVED', label: 'Архив' },
        ]}
      />

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
          {eventId ? 'Сохранить изменения' : 'Создать'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Отмена
        </Button>
      </div>
    </form>
  );
}