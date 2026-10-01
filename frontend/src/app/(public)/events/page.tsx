'use client';

/**
 * Список мероприятий.
 */
import { useEvents } from '@/hooks/useEvents';
import { usePagination } from '@/hooks/usePagination';
import { EventList } from '@/components/organisms/EventList';
import { SearchBar } from '@/components/molecules/SearchBar';
import { useState } from 'react';

export default function EventsPage() {
  const { page, limit, goToPage } = usePagination(1, 12);
  const [search, setSearch] = useState('');
  const query = useEvents({ search, page, limit });

  return (
    <div className="space-y-6">
      <h1 className="h1-berry text-xl font-semibold sm:text-2xl">Мероприятия и фестивали</h1>

      <SearchBar placeholder="Найти мероприятие..." onSearch={setSearch} />

      <EventList
        events={query.data?.items}
        isLoading={query.isLoading}
        isError={query.isError}
      />

      {query.data && query.data.pages > 1 && (
        <nav className="flex items-center justify-center gap-2 pt-4" aria-label="Пагинация">
          <button
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            ← Назад
          </button>
          <span className="px-2 text-sm text-gray-600">
            {page} / {query.data.pages}
          </span>
          <button
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
            disabled={page >= query.data.pages}
            onClick={() => goToPage(page + 1)}
          >
            Вперёд →
          </button>
        </nav>
      )}
    </div>
  );
}