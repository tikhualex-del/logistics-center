'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from './api'
import type { CreateOrderInput, UpdateOrderDeadlineInput, OrdersFilters } from './types'

const ORDERS_KEY = 'orders'

export function useOrders(filters?: OrdersFilters) {
  return useQuery({
    queryKey: [ORDERS_KEY, filters],
    queryFn: () => ordersApi.list(filters),
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: [ORDERS_KEY, id],
    queryFn: () => ordersApi.get(id),
    enabled: !!id,
  })
}

export function useOrderHistory(id: string) {
  return useQuery({
    queryKey: [ORDERS_KEY, id, 'history'],
    queryFn: () => ordersApi.getHistory(id),
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateOrderInput) => ordersApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ORDERS_KEY] }),
  })
}

export function useUpdateOrderStatus(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (status: string) => ordersApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ORDERS_KEY] }),
  })
}

export function useUpdateOrderDeadline(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateOrderDeadlineInput) => ordersApi.updateDeadline(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ORDERS_KEY] }),
  })
}
