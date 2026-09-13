/**
 * API-методы мероприятий.
 */
import { apiFetch } from './api-client';
import { ApiResponse, Event, EventFormValues, Pagination } from '@/types';

export interface EventListParams {
  search?: string;
  page?: number;
  limit?: number;
}

export const eventsApi = {
  async list(params: EventListParams = {}): Promise<Pagination<Event>> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    const res = await apiFetch<ApiResponse<Pagination<Event>>>(`/events?${qs.toString()}`);
    return res.data;
  },

  async getById(id: string): Promise<Event> {
    const res = await apiFetch<ApiResponse<Event>>(`/events/${id}`);
    return res.data;
  },

  async create(input: EventFormValues): Promise<Event> {
    const res = await apiFetch<ApiResponse<Event>>('/events', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async update(id: string, input: Partial<EventFormValues>): Promise<Event> {
    const res = await apiFetch<ApiResponse<Event>>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await apiFetch(`/events/${id}`, { method: 'DELETE' });
  },
};