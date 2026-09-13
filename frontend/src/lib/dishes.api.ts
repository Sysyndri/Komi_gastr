/**
 * API-методы блюд.
 */
import { apiFetch } from './api-client';
import { ApiResponse, Dish, DishFormValues, Pagination } from '@/types';

export interface DishListParams {
  search?: string;
  category?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
}

export const dishesApi = {
  async list(params: DishListParams = {}): Promise<Pagination<Dish>> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    const res = await apiFetch<ApiResponse<Pagination<Dish>>>(`/dishes?${qs.toString()}`);
    return res.data;
  },

  async getById(id: string): Promise<Dish> {
    const res = await apiFetch<ApiResponse<Dish>>(`/dishes/${id}`);
    return res.data;
  },

  async create(input: DishFormValues): Promise<Dish> {
    const res = await apiFetch<ApiResponse<Dish>>('/dishes', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async update(id: string, input: Partial<DishFormValues>): Promise<Dish> {
    const res = await apiFetch<ApiResponse<Dish>>(`/dishes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await apiFetch(`/dishes/${id}`, { method: 'DELETE' });
  },
};