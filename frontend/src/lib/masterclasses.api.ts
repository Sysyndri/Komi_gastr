/**
 * API-методы мастер-классов.
 */
import { apiFetch } from './api-client';
import { ApiResponse, MasterClass, MasterClassFormValues, Pagination } from '@/types';

export interface MasterClassListParams {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  priceMax?: number;
  dishId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const masterClassesApi = {
  async list(params: MasterClassListParams = {}): Promise<Pagination<MasterClass>> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    const res = await apiFetch<ApiResponse<Pagination<MasterClass>>>(`/masterclasses?${qs.toString()}`);
    return res.data;
  },

  async getById(id: string): Promise<MasterClass> {
    const res = await apiFetch<ApiResponse<MasterClass>>(`/masterclasses/${id}`);
    return res.data;
  },

  async create(input: MasterClassFormValues): Promise<MasterClass> {
    const res = await apiFetch<ApiResponse<MasterClass>>('/masterclasses', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async update(id: string, input: Partial<MasterClassFormValues>): Promise<MasterClass> {
    const res = await apiFetch<ApiResponse<MasterClass>>(`/masterclasses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await apiFetch(`/masterclasses/${id}`, { method: 'DELETE' });
  },
};