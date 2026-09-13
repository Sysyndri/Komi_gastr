'use client';

/**
 * Админ: редактирование мастер-класса.
 */
import { MasterClassForm } from '@/components/organisms/MasterClassForm';
import { Spinner } from '@/components/ui/Spinner';
import { useMasterClass } from '@/hooks/useMasterClasses';

export default function EditMasterClassPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const query = useMasterClass(id);

  if (query.isLoading) return <Spinner label="Загружаем мастер-класс..." />;
  if (query.isError || !query.data) {
    return <p className="py-8 text-center text-red-600">Мастер-класс не найден.</p>;
  }

  const mc = query.data;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Редактирование: {mc.title}</h1>
      <MasterClassForm
        masterClassId={mc.id}
        initialValues={{
          title: mc.title,
          shortDescription: mc.shortDescription ?? '',
          description: mc.description,
          date: mc.date,
          durationMin: mc.durationMin,
          price: Number(mc.price),
          maxParticipants: mc.maxParticipants,
          status: mc.status,
          dishId: mc.dishId ?? '',
          placeId: mc.placeId ?? '',
        }}
      />
    </div>
  );
}