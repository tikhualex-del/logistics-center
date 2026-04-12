'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from './api'
import type { UpdateCompanySettingsInput, UpdateOperationsSettingsInput, UpdateSlaSettingsInput } from './types'

export function useCompanySettings() {
  return useQuery({
    queryKey: ['settings', 'company'],
    queryFn: () => settingsApi.getCompany(),
  })
}

export function useUpdateCompanySettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateCompanySettingsInput) => settingsApi.updateCompany(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'company'] }),
  })
}

export function useOperationsSettings() {
  return useQuery({
    queryKey: ['settings', 'operations'],
    queryFn: () => settingsApi.getOperations(),
  })
}

export function useUpdateOperationsSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateOperationsSettingsInput) => settingsApi.updateOperations(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'operations'] }),
  })
}

export function useSlaSettings() {
  return useQuery({
    queryKey: ['settings', 'sla'],
    queryFn: () => settingsApi.getSla(),
  })
}

export function useUpdateSlaSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateSlaSettingsInput) => settingsApi.updateSla(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'sla'] }),
  })
}
