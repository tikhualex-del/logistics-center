import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import {
  getCurrentCompany,
  getCompanyFeatures,
  updateCurrentCompany,
  updateCompanyFeature,
  type Company,
  type CompanyFeature,
  type UpdateCompanyDto,
  type UpdateCompanyFeatureDto,
} from '@/api/companies.api'
import {
  createWebhook,
  getWebhooks,
  updateWebhook,
  type UpsertWebhookRegistrationDto,
  type WebhookRegistration,
} from '@/api/integrations.api'
import { QUERY_KEYS } from '@/api/query-keys'
import { QUERY_STALE_TIME } from '@/lib/constants'

export function useCurrentCompany(
  options?: Partial<UseQueryOptions<Company>>,
) {
  return useQuery({
    queryKey: QUERY_KEYS.companies.current(),
    queryFn: getCurrentCompany,
    staleTime: QUERY_STALE_TIME.LONG,
    ...options,
  })
}

export function useCompanyFeatures(
  options?: Partial<UseQueryOptions<CompanyFeature[]>>,
) {
  return useQuery({
    queryKey: QUERY_KEYS.companies.features(),
    queryFn: getCompanyFeatures,
    staleTime: QUERY_STALE_TIME.LONG,
    ...options,
  })
}

export function useUpdateCurrentCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateCompanyDto) => updateCurrentCompany(data),
    onSuccess: (company) => {
      queryClient.setQueryData(QUERY_KEYS.companies.current(), company)
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.companies.all })
    },
  })
}

export function useUpdateCompanyFeature() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      featureKey,
      data,
    }: {
      featureKey: string
      data: UpdateCompanyFeatureDto
    }) => updateCompanyFeature(featureKey, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.companies.features(),
      })
    },
  })
}

export function useWebhooks(
  options?: Partial<UseQueryOptions<WebhookRegistration[]>>,
) {
  return useQuery({
    queryKey: QUERY_KEYS.integrations.webhooks(),
    queryFn: getWebhooks,
    staleTime: QUERY_STALE_TIME.DEFAULT,
    ...options,
  })
}

export function useCreateWebhook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpsertWebhookRegistrationDto) => createWebhook(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.integrations.all,
      })
    },
  })
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<UpsertWebhookRegistrationDto>
    }) => updateWebhook(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.integrations.all,
      })
    },
  })
}
