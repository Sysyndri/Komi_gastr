'use client';

/**
 * Админ: список мероприятий.
 */
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useEvents, useDeleteEvent } from '@/hooks/useEvents';
import { SearchBar } from '@/components/molecules/SearchBar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';

const statusTone = { ACTIVE: 'green', DRAFT: 'gray', ARCHIVED: 'amber' } as const;

export default function AdminEventsPage() {
  const [search, setSearch] = useState('');
  const query = useEvents({ search, limit: 50 });
  const deleteMutation = useDeleteEvent();

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Удалить мероприятие «${title}»?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Мероприятие удалено');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">Мероприятия</h1>
        <Link href="/admin/events/new">
          <Button variant="primary">+ Создать</Button>
        </Link>
      </div>

      <SearchBar placeholder="Поиск мероприятий..." onSearch={setSearch} />

      {query.isLoading && <Spinner />}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Название</th>
              <th className="px-4 py-3">Дата</th>
              <th className="px-4 py-3">Локация</th>
              <th className="px-4 py-3">Участников</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {query.data?.items.map((event) => (
              <tr key={event.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{event.title}</td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(event.startDate).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-4 py-3 text-gray-600">{event.location}</td>
                <td className="px-4 py-3 text-gray-700">{event.bookingsCount ?? 0}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[event.status]}>{event.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => void handleDelete(event.id, event.title)}
                      isLoading={deleteMutation.isPending}
                    >
                      Удалить
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}