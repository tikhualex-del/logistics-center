import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { CompanyDetailCard } from '@/components/platform/company-detail-card'

export const metadata: Metadata = { title: 'Company Detail' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function CompanyDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Company Detail" />
      <CompanyDetailCard companyId={id} />
    </div>
  )
}
