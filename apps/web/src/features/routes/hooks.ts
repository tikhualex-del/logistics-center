'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { routesApi } from './api'
import type { CreateRouteInput, AssignCourierInput, AddOrderInput } from './types'

const ROUTES_KEY = 'routes'

export function useRoutes() {
  return useQuery({
    queryKey: [ROUTES_KEY],
    queryFn: () => routesApi.list(),
  })
}

export function useRoute(id: string) {
  return useQuery({
    queryKey: [ROUTES_KEY, id],
    queryFn: () => routesApi.get(id),
    enabled: !!id,
  })
}

export function useCreateRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateRouteInput) => routesApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROUTES_KEY] }),
  })
}

export function useUpdateRouteStatus(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (status: string) => routesApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROUTES_KEY] }),
  })
}

export function useAssignCourierToRoute(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AssignCourierInput) => routesApi.assignCourier(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROUTES_KEY] }),
  })
}

export function useAddOrderToRoute(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AddOrderInput) => routesApi.addOrder(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROUTES_KEY] }),
  })
}
