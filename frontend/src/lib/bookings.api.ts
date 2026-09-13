/**
 * API-методы бронирований.
 */
import { apiFetch } from './api-client';
import { ApiResponse, Booking, EventBooking, MyBookingsResponse } from '@/types';

export const bookingsApi = {
  async bookMasterClass(id: string): Promise<Booking> {
    const res = await apiFetch<ApiResponse<Booking>>(`/bookings/masterclass/${id}`, { method: 'POST' });
    return res.data;
  },

  async bookEvent(id: string): Promise<EventBooking> {
    const res = await apiFetch<ApiResponse<EventBooking>>(`/bookings/event/${id}`, { method: 'POST' });
    return res.data;
  },

  async cancelMasterClass(id: string): Promise<Booking> {
    const res = await apiFetch<ApiResponse<Booking>>(`/bookings/masterclass/${id}`, { method: 'DELETE' });
    return res.data;
  },

  async cancelEvent(id: string): Promise<EventBooking> {
    const res = await apiFetch<ApiResponse<EventBooking>>(`/bookings/event/${id}`, { method: 'DELETE' });
    return res.data;
  },

  async getMyBookings(): Promise<MyBookingsResponse> {
    const res = await apiFetch<ApiResponse<MyBookingsResponse>>('/bookings/my');
    return res.data;
  },
};