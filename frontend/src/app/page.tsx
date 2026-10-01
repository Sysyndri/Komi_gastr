"use client";

/**
 * Главная страница: список блюд + карта заведений + ближайшие мастер-классы.
 */
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useDishes } from "@/hooks/useDishes";
import { useMasterClasses } from "@/hooks/useMasterClasses";
import { placesApi } from "@/lib/admin.api";
import { MapComponent } from "@/components/organisms/MapComponent";
import { MasterClassCard } from "@/components/molecules/MasterClassCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

const difficultyLabel: Record<string, string> = {
  EASY: "Легко",
  MEDIUM: "Средне",
  HARD: "Сложно",
};

export default function HomePage() {
  const dishesQuery = useDishes({ limit: 6, page: 1 });
  const mcQuery = useMasterClasses({ limit: 3, page: 1 });
  const placesQuery = useQuery({
    queryKey: ["places"],
    queryFn: () => placesApi.list(),
  });

  return (
    <div className="space-y-10">
      {/* Hero: заголовок h1 на фоне фотографии морошки */}
      <section className="relative overflow-hidden rounded-2xl bg-primary-900 px-5 py-8 text-white sm:px-8 sm:py-12">
        <Image
          src="/images/berries/cloudberry.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-cover"
        />
        {/* Затемнение: заголовок должен читаться на любом участке снимка */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary-900/85 via-primary-800/75 to-primary-900/90"
          aria-hidden
        />
        <div className="relative">
          <h1 className="mb-3 max-w-2xl text-2xl font-bold sm:text-3xl md:text-4xl">
            Добро пожаловать в мир национальной кухни Республики Коми
          </h1>
          <p className="mb-6 max-w-2xl text-primary-100">
            Откройте для себя традиционные блюда коми: шаньга, черинянь, пельмени
            по-коми. Найдите заведения, запишитесь на мастер-классы и участвуйте в
            гастрономических фестивалях.
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
        </div>
      </section>

      {/* Блюда */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
            Национальные блюда
          </h2>
          <Link
            href="/dishes"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Все блюда →
          </Link>
        </div>

        {dishesQuery.isLoading && <Spinner />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dishesQuery.data?.items.map((dish) => (
            <Link
              key={dish.id}
              href={`/dishes/${dish.id}`}
              className="group block cursor-pointer transition hover:-translate-y-0.5"
              data-testid="dish-card"
            >
              <Card className="h-full overflow-hidden p-0 transition group-hover:shadow-md">
                {dish.imageUrl && (
                  <div className="relative h-44 w-full">
                    <Image
                      src={dish.imageUrl}
                      alt={dish.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700">
                      {dish.name}
                    </h3>
                    {dish.nameKomi && dish.nameKomi !== dish.name && (
                      <Badge tone="blue">{dish.nameKomi}</Badge>
                    )}
                  </div>
                  <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                    {dish.description}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <Badge
                      tone={
                        dish.difficulty === "EASY"
                          ? "green"
                          : dish.difficulty === "MEDIUM"
                            ? "amber"
                            : "red"
                      }
                    >
                      {difficultyLabel[dish.difficulty]}
                    </Badge>
                    <span>⏱ {dish.cookingTimeMin} мин</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Карта заведений */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900 sm:text-2xl">
          Где попробовать
        </h2>
        <MapComponent places={placesQuery.data ?? []} height={380} />
      </section>

      {/* Ближайшие мастер-классы */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
            Ближайшие мастер-классы
          </h2>
          <Link
            href="/masterclasses"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Все мастер-классы →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {mcQuery.data?.items.map((mc) => (
            <MasterClassCard key={mc.id} masterClass={mc} />
          ))}
        </div>
      </section>
    </div>
  );
}
