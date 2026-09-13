'use client';

/**
 * useDishes — получение списка блюд с фильтрацией и пагинацией.
 */
import { useQuery } from '@tanstack/react-query';
import { dishesApi, DishListParams } from '@/lib/dishes.api';

export function useDishes(params: DishListParams = {}) {
  return useQuery({
    queryKey: ['dishes', params],
    queryFn: () => dishesApi.list(params),
    staleTime: 5 * 60 * 1000, // TTL 5 минут для уменьшения запросов
  });
}

export function useDish(id: string | undefined) {
  return useQuery({
    queryKey: ['dish', id],
    queryFn: () => dishesApi.getById(id as string),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}