'use client';

/**
 * Админ: создание мастер-класса.
 */
import { MasterClassForm } from '@/components/organisms/MasterClassForm';

export default function NewMasterClassPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Создание мастер-класса</h1>
      <MasterClassForm />
    </div>
  );
}