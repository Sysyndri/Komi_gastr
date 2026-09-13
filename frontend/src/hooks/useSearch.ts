'use client';

/**
 * useSearch — поиск с debounce по блюдам, МК и мероприятиям.
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/lib/admin.api';

export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function useSearch(query: string) {
  const debouncedQuery = useDebouncedValue(query, 400);
  return useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchApi.search(debouncedQuery),
    enabled: debouncedQuery.trim().length > 1,
    staleTime: 60 * 1000,
  });
}