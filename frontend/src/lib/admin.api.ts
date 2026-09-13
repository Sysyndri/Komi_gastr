/**
 * API-методы поиска и общих ресурсов.
 */
import { apiFetch } from './api-client';
import { ApiResponse, Place, SearchResults, StatsResponse, User } from '@/types';

export const placesApi = {
  async list(search?: string): Promise<Place[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await apiFetch<ApiResponse<Place[]>>(`/places${qs}`);
    return res.data;
  },

  async getById(id: string): Promise<Place> {
    const res = await apiFetch<ApiResponse<Place>>(`/places/${id}`);
    return res.data;
  },
};

export const searchApi = {
  async search(q: string, limit = 10): Promise<SearchResults> {
    const res = await apiFetch<ApiResponse<SearchResults>>(
      `/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    );
    return res.data;
  },
};

export const statsApi = {
  async getStats(): Promise<StatsResponse> {
    const res = await apiFetch<ApiResponse<StatsResponse>>('/stats');
    return res.data;
  },
};

export interface AdminUser extends User {
  _count: { bookings: number; eventBookings: number };
}

export const adminApi = {
  async listUsers(params: { search?: string; role?: string; page?: number; limit?: number } = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    const res = await apiFetch<ApiResponse<{ items: AdminUser[]; total: number; page: number; pages: number }>>(
      `/admin/users?${qs.toString()}`,
    );
    return res.data;
  },

  async changeRole(id: string, role: string): Promise<{ id: string; role: string }> {
    const res = await apiFetch<ApiResponse<{ id: string; role: string }>>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    return res.data;
  },

  async toggleBlock(id: string): Promise<{ id: string; isBlocked: boolean }> {
    const res = await apiFetch<ApiResponse<{ id: string; isBlocked: boolean }>>(`/admin/users/${id}/block`, {
      method: 'PATCH',
    });
    return res.data;
  },

  async exportMasterClasses(): Promise<string> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/masterclasses/export`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('gk_access_token')}` },
    });
    return res.text();
  },
};