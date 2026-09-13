'use client';

/**
 * Админ: создание мероприятия.
 */
import { EventForm } from '@/components/organisms/EventForm';

export default function NewEventPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Создание мероприятия</h1>
      <EventForm />
    </div>
  );
}