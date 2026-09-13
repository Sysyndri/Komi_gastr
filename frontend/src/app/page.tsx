'use client';

/**
 * Главная страница: список блюд + карта заведений + ближайшие мастер-классы.
 */
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useDishes } from '@/hooks/useDishes';
import { useMasterClasses } from '@/hooks/useMasterClasses';
import { placesApi } from '@/lib/admin.api';
import { MapComponent } from '@/components/organisms/MapComponent';
import { MasterClassCard } from '@/components/molecules/MasterClassCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

const difficultyLabel: Record<string, string> = {
  EASY: 'Легко',
  MEDIUM: 'Средне',
  HARD: 'Сложно',
};

export default function HomePage() {
  const dishesQuery = useDishes({ limit: 6, page: 1 });
  const mcQuery = useMasterClasses({ limit: 3, page: 1 });
  const placesQuery = useQuery({ queryKey: ['places'], queryFn: () => placesApi.list() });

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 px-8 py-12 text-white">
        <h1 className="mb-3 max-w-2xl text-3xl font-bold md:text-4xl">
          Добро пожаловать в мир национальной кухни Республики Коми
        </h1>
        <p className="mb-6 max-w-2xl text-primary-100">
          Откройте для себя традиционные блюда коми: шаньга, черинянь, пельмени по-коми.
          Найдите заведения, запишитесь на мастер-классы и участвуйте в гастрономических фестивалях.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/masterclasses"
            className="rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition hover:bg-accent-light"
          >
            Мастер-классы
          </Link>
          <Link
            href="/events"
            className="rounded-lg border border-white/40 px-5 py-2.5 font-medium text-white transition hover:bg-white/10"
          >
            Мероприятия
          </Link>
        </div>
      </section>

      {/* Блюда */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Национальные блюда</h2>
          <Link href="/dishes" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            Все блюда →
          </Link>
        </div>

        {dishesQuery.isLoading && <Spinner />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dishesQuery.data?.items.map((dish) => (
            <Card key={dish.id} className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  <Link href={`/dishes/${dish.id}`} className="hover:text-primary-700">
                    {dish.name}
                  </Link>
                </h3>
                {dish.nameKomi && dish.nameKomi !== dish.name && (
                  <Badge tone="blue">{dish.nameKomi}</Badge>
                )}
              </div>
              <p className="mb-3 line-clamp-2 text-sm text-gray-600">{dish.description}</p>
              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                <Badge tone={dish.difficulty === 'EASY' ? 'green' : dish.difficulty === 'MEDIUM' ? 'amber' : 'red'}>
                  {difficultyLabel[dish.difficulty]}
                </Badge>
                <span>⏱ {dish.cookingTimeMin} мин</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Карта заведений */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold text-gray-900">Где попробовать</h2>
        <MapComponent places={placesQuery.data ?? []} height={380} />
      </section>

      {/* Ближайшие мастер-классы */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Ближайшие мастер-классы</h2>
          <Link href="/masterclasses" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            Все мастер-классы →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {mcQuery.data?.items.map((mc) => <MasterClassCard key={mc.id} masterClass={mc} />)}
        </div>
      </section>
    </div>
  );
}