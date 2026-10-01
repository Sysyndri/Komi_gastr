'use client';

/**
 * Админ: каталог блюд (просмотр + быстрые действия).
 */
import { useState } from 'react';
import { useDishes } from '@/hooks/useDishes';
import { SearchBar } from '@/components/molecules/SearchBar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';

const difficultyLabel: Record<string, string> = { EASY: 'Легко', MEDIUM: 'Средне', HARD: 'Сложно' };

export default function AdminDishesPage() {
  const [search, setSearch] = useState('');
  const query = useDishes({ search, limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">Блюда</h1>
      </div>

      <SearchBar placeholder="Поиск блюд..." onSearch={setSearch} />

      {query.isLoading && <Spinner />}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Название</th>
              <th className="px-4 py-3">Категория</th>
              <th className="px-4 py-3">Сложность</th>
              <th className="px-4 py-3">Время</th>
              <th className="px-4 py-3">Заведения</th>
            </tr>
          </thead>
          <tbody>
            {query.data?.items.map((dish) => (
              <tr key={dish.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {dish.name}
                  {dish.nameKomi && dish.nameKomi !== dish.name && (
                    <span className="ml-2 text-xs text-gray-400">({dish.nameKomi})</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{dish.category ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge tone={dish.difficulty === 'EASY' ? 'green' : dish.difficulty === 'MEDIUM' ? 'amber' : 'red'}>
                    {difficultyLabel[dish.difficulty]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-600">{dish.cookingTimeMin} мин</td>
                <td className="px-4 py-3 text-gray-600">{dish.places?.length ?? 0}</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}