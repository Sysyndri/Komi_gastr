'use client';

/**
 * usePagination — управление состоянием пагинации для списков.
 */
import { useCallback, useMemo, useState } from 'react';

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function usePagination(initialPage = 1, initialLimit = 12) {
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);

  const nextPage = useCallback(() => setPage((p) => p + 1), []);
  const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const goToPage = useCallback((p: number) => setPage(Math.max(1, p)), []);
  const reset = useCallback(() => setPage(1), []);

  return useMemo(
    () => ({ page, limit, nextPage, prevPage, goToPage, reset }),
    [page, limit, nextPage, prevPage, goToPage, reset],
  );
}