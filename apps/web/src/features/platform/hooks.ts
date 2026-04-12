'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { platformApi } from './api'
import type { CreateCompanyInput, CreatePlatformAdminInput, ImpersonateInput } from './types'

const COMPANIES_KEY = 'platform-companies'
const ADMINS_KEY = 'platform-admins'

export function useCompanies() {
  return useQuery({
    queryKey: [COMPANIES_KEY],
    queryFn: () => platformApi.listCompanies(),
  })
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: [COMPANIES_KEY, id],
    queryFn: () => platformApi.getCompany(id),
    enabled: !!id,
  })
}

export function useCreateCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCompanyInput) => platformApi.createCompany(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [COMPANIES_KEY] }),
  })
}

export function usePlatformAdmins() {
  return useQuery({
    queryKey: [ADMINS_KEY],
    queryFn: () => platformApi.listAdmins(),
  })
}

export function usePlatformAdmin(id: string) {
  return useQuery({
    queryKey: [ADMINS_KEY, id],
    queryFn: () => platformApi.getAdmin(id),
    enabled: !!id,
  })
}

export function useCreatePlatformAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePlatformAdminInput) => platformApi.createAdmin(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMINS_KEY] }),
  })
}

export function useImpersonate() {
  return useMutation({
    mutationFn: (input: ImpersonateInput) => platformApi.impersonate(input),
  })
}
