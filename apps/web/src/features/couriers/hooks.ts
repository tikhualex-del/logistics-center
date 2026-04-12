'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { couriersApi } from './api'
import type { CreateCourierInput, UpdateCourierInput } from './types'

const COURIERS_KEY = 'couriers'

export function useCouriers() {
  return useQuery({
    queryKey: [COURIERS_KEY],
    queryFn: () => couriersApi.list(),
  })
}

export function useCourier(id: string) {
  return useQuery({
    queryKey: [COURIERS_KEY, id],
    queryFn: () => couriersApi.get(id),
    enabled: !!id,
  })
}

export function useCreateCourier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCourierInput) => couriersApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [COURIERS_KEY] }),
  })
}

export function useUpdateCourier(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateCourierInput) => couriersApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [COURIERS_KEY] }),
  })
}
