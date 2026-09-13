'use client';

/**
 * Список мастер-классов с фильтрами.
 */
import { useState } from 'react';
import { useMasterClasses } from '@/hooks/useMasterClasses';
import { usePagination } from '@/hooks/usePagination';
import { SearchBar } from '@/components/molecules/SearchBar';
import { MasterClassList } from '@/components/organisms/MasterClassList';

export default function MasterClassesPage() {
  const { page, limit, goToPage } = usePagination(1, 12);
  const [search, setSearch] = useState('');
  const [priceMax, setPriceMax] = useState('');

  const query = useMasterClasses({
    search,
    priceMax: priceMax ? Number(priceMax) : undefined,
    page,
    limit,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Мастер-классы</h1>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1">
          <SearchBar placeholder="Найти мастер-класс..." onSearch={setSearch} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600" htmlFor="price-max">
            Цена до:
          </label>
          <select
            id="price-max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Любая</option>
            <option value="1000">1000 ₽</option>
            <option value="2000">2000 ₽</option>
            <option value="5000">5000 ₽</option>
          </select>
        </div>
      </div>

      <MasterClassList
        masterClasses={query.data?.items}
        isLoading={query.isLoading}
        isError={query.isError}
        page={page}
        pages={query.data?.pages ?? 1}
        onPageChange={goToPage}
      />
    </div>
  );
}