'use client';

/**
 * useEvents — список и CRUD мероприятий.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventsApi, EventListParams } from '@/lib/events.api';
import { EventFormValues } from '@/types';

export function useEvents(params: EventListParams = {}) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => eventsApi.list(params),
    staleTime: 60 * 1000,
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getById(id as string),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EventFormValues) => eventsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<EventFormValues> }) =>
      eventsApi.update(id, input),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event', v.id] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}