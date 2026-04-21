import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { IntegrationLogsList } from '@/components/integrations/integration-logs-list'

export const metadata: Metadata = { title: 'Integration Logs' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function IntegrationLogsPage({ params }: Props) {
  const { id } = await params
  return (
    <div className="space-y-4">
      <PageHeader title="Integration Logs" description="View webhook delivery history" />
      <IntegrationLogsList integrationId={id} />
    </div>
  )
}
