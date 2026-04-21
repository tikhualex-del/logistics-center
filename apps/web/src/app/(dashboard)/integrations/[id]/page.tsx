import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { IntegrationDetailCard } from '@/components/integrations/integration-detail-card'

export const metadata: Metadata = { title: 'Integration Detail' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function IntegrationDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Integration Detail" />
      <IntegrationDetailCard integrationId={id} />
    </div>
  )
}
