'use client'

import { useCompany } from '@/features/platform/hooks'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/loader'

interface Props {
  companyId: string
}

export function CompanyDetailCard({ companyId }: Props) {
  const { data: company, isLoading } = useCompany(companyId)

  if (isLoading) return <PageLoader />
  if (!company) return <p className="text-sm text-gray-500">Company not found.</p>

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">{company.name}</h2>
        <Badge>{company.status}</Badge>
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-500">Slug</dt>
          <dd className="font-mono text-xs">{company.slug}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Plan</dt>
          <dd className="font-medium">{company.plan ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Created</dt>
          <dd className="font-medium">{new Date(company.createdAt).toLocaleDateString()}</dd>
        </div>
      </dl>
    </div>
  )
}
