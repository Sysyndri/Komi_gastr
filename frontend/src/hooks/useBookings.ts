"use client";

/**
 * useBookings — запись/отмена на мастер-классы и мероприятия с состояниями загрузки.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingsApi } from "@/lib/bookings.api";

export function useMyBookings(enabled = true) {
  return useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => bookingsApi.getMyBookings(),
    staleTime: 30 * 1000,
    enabled,
  });
}

export function useBookMasterClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingsApi.bookMasterClass(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      qc.invalidateQueries({ queryKey: ["masterclass"] });
      qc.invalidateQueries({ queryKey: ["masterclasses"] });
    },
  });
}

export function useCancelMasterClassBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingsApi.cancelMasterClass(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      qc.invalidateQueries({ queryKey: ["masterclass"] });
    },
  });
}

export function useBookEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingsApi.bookEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      qc.invalidateQueries({ queryKey: ["event"] });
    },
  });
}

export function useCancelEventBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingsApi.cancelEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      qc.invalidateQueries({ queryKey: ["event"] });
    },
  });
}
