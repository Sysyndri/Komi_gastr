"use client";

/**
 * Страница блюда: детали + список мастер-классов.
 */
import { useDish } from "@/hooks/useDishes";
import { useMasterClasses } from "@/hooks/useMasterClasses";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { MasterClassCard } from "@/components/molecules/MasterClassCard";
import Image from "next/image";

const difficultyLabel: Record<string, string> = {
  EASY: "Легко",
  MEDIUM: "Средне",
  HARD: "Сложно",
};

export default function DishDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const dishQuery = useDish(id);
  const mcQuery = useMasterClasses({ dishId: id, limit: 5 });

  if (dishQuery.isLoading) return <Spinner label="Загружаем блюдо..." />;
  if (dishQuery.isError || !dishQuery.data) {
    return <p className="py-8 text-center text-red-600">Блюдо не найдено.</p>;
  }

  const dish = dishQuery.data;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        {dish.imageUrl && (
          <div
            className="relative h-64 w-full sm:h-80"
            data-testid="dish-image"
          >
            <Image
              src={dish.imageUrl}
              alt={dish.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          </div>
        )}
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{dish.name}</h1>
              {dish.nameKomi && dish.nameKomi !== dish.name && (
                <p className="mt-1 text-sm text-gray-500">
                  На коми: {dish.nameKomi}
                </p>
              )}
            </div>
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
          </div>

          <p className="mb-4 text-gray-700">{dish.description}</p>

          {dish.history && (
            <div className="mb-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">История блюда</p>
              <p className="mt-1">{dish.history}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Время приготовления</p>
              <p className="font-medium">{dish.cookingTimeMin} минут</p>
            </div>
            {dish.category && (
              <div>
                <p className="text-gray-500">Категория</p>
                <p className="font-medium">{dish.category}</p>
              </div>
            )}
          </div>

          {dish.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {dish.tags.map((tag) => (
                <Badge key={tag} tone="gray">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {dish.recipe && (
            <div className="mt-6">
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                Рецепт
              </h2>
              <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                {dish.recipe}
              </pre>
            </div>
          )}
        </div>
      </Card>

      {dish.places && dish.places.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Где попробовать
          </h2>
          <ul className="space-y-2">
            {dish.places.map((p) => (
              <li key={p.id} className="text-sm text-gray-700">
                🏠 <span className="font-medium">{p.name}</span> — {p.address}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Связанные мастер-классы
        </h2>
        {mcQuery.isLoading ? (
          <Spinner />
        ) : mcQuery.data && mcQuery.data.items.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mcQuery.data.items.map((mc) => (
              <MasterClassCard key={mc.id} masterClass={mc} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Мастер-классы по этому блюду пока не запланированы.
          </p>
        )}
      </div>
    </div>
  );
}
