/**
 * Атомарный индикатор загрузки.
 */
export function Spinner({ label = 'Загрузка...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8" role="status" aria-live="polite">
      <span
        className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"
        data-testid="spinner"
      />
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  );
}