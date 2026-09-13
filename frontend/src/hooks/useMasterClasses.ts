'use client';

/**
 * useMasterClasses — список и CRUD мастер-классов.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { masterClassesApi, MasterClassListParams } from '@/lib/masterclasses.api';
import { MasterClassFormValues } from '@/types';

export function useMasterClasses(params: MasterClassListParams = {}) {
  return useQuery({
    queryKey: ['masterclasses', params],
    queryFn: () => masterClassesApi.list(params),
    staleTime: 60 * 1000,
  });
}

export function useMasterClass(id: string | undefined) {
  return useQuery({
    queryKey: ['masterclass', id],
    queryFn: () => masterClassesApi.getById(id as string),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreateMasterClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MasterClassFormValues) => masterClassesApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['masterclasses'] });
    },
  });
}

export function useUpdateMasterClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MasterClassFormValues> }) =>
      masterClassesApi.update(id, input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['masterclasses'] });
      qc.invalidateQueries({ queryKey: ['masterclass', variables.id] });
    },
  });
}

export function useDeleteMasterClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => masterClassesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['masterclasses'] });
    },
  });
}