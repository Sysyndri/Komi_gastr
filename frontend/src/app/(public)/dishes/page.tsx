'use client';

/**
 * Список блюд с фильтрацией и поиском.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useDishes } from '@/hooks/useDishes';
import { usePagination } from '@/hooks/usePagination';
import { SearchBar } from '@/components/molecules/SearchBar';
import { FilterBar } from '@/components/molecules/FilterBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

const difficultyLabel: Record<string, string> = { EASY: 'Легко', MEDIUM: 'Средне', HARD: 'Сложно' };

export default function DishesPage() {
  const { page, limit, goToPage } = usePagination(1, 12);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const query = useDishes({ search, difficulty, page, limit });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">Каталог блюд</h1>
      </div>

      <SearchBar placeholder="Найти блюдо..." onSearch={setSearch} />

      <FilterBar
        filters={[
          {
            key: 'difficulty',
            label: 'Сложность',
            options: [
              { value: 'EASY', label: 'Легко' },
              { value: 'MEDIUM', label: 'Средне' },
              { value: 'HARD', label: 'Сложно' },
            ],
          },
        ]}
        values={{ difficulty }}
        onChange={(k, v) => k === 'difficulty' && setDifficulty(v)}
      />

      {query.isLoading && <Spinner />}

      {query.data?.items.length === 0 && (
        <p className="py-8 text-center text-gray-500">Блюда не найдены. Попробуйте изменить фильтры.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {query.data?.items.map((dish) => (
          <Card key={dish.id} className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                <Link href={`/dishes/${dish.id}`} className="hover:text-primary-700">
                  {dish.name}
                </Link>
              </h2>
              {dish.nameKomi && dish.nameKomi !== dish.name && <Badge tone="blue">{dish.nameKomi}</Badge>}
            </div>
            <p className="mb-3 line-clamp-2 text-sm text-gray-600">{dish.description}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <Badge tone={dish.difficulty === 'EASY' ? 'green' : dish.difficulty === 'MEDIUM' ? 'amber' : 'red'}>
                {difficultyLabel[dish.difficulty]}
              </Badge>
              <span>⏱ {dish.cookingTimeMin} мин</span>
              {dish.places && dish.places.length > 0 && <span>🏠 {dish.places.length} завед.</span>}
            </div>
          </Card>
        ))}
      </div>

      {query.data && query.data.pages > 1 && (
        <nav className="flex items-center justify-center gap-2 pt-4" aria-label="Пагинация">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
            ← Назад
          </Button>
          <span className="px-2 text-sm text-gray-600">
            {page} / {query.data.pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= query.data.pages} onClick={() => goToPage(page + 1)}>
            Вперёд →
          </Button>
        </nav>
      )}
    </div>
  );
}