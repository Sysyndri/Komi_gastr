import { MasterClassCard } from '@/components/molecules/MasterClassCard';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { MasterClass } from '@/types';

export interface MasterClassListProps {
  masterClasses: MasterClass[] | undefined;
  isLoading: boolean;
  isError: boolean;
  page?: number;
  pages?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
}

/**
 * Организм: список мастер-классов с пагинацией.
 */
export function MasterClassList({
  masterClasses,
  isLoading,
  isError,
  page = 1,
  pages = 1,
  onPageChange,
  emptyMessage = 'Мастер-классы не найдены',
}: MasterClassListProps) {
  if (isLoading) return <Spinner label="Загружаем мастер-классы..." />;

  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center text-red-700" role="alert">
        Не удалось загрузить мастер-классы. Попробуйте позже.
      </div>
    );
  }

  if (!masterClasses || masterClasses.length === 0) {
    return <p className="py-8 text-center text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div data-testid="masterclass-list">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {masterClasses.map((mc) => (
          <MasterClassCard key={mc.id} masterClass={mc} />
        ))}
      </div>

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Пагинация">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange?.(page - 1)}
          >
            ← Назад
          </Button>
          <span className="px-2 text-sm text-gray-600" data-testid="pagination-info">
            {page} / {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => onPageChange?.(page + 1)}
          >
            Вперёд →
          </Button>
        </nav>
      )}
    </div>
  );
}