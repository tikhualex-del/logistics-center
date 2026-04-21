'use client'

import { useIntegration } from '@/features/integrations/hooks'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/loader'
import { integrationStatusColor } from '@/lib/utils/status-colors'

interface Props {
  integrationId: string
}

export function IntegrationDetailCard({ integrationId }: Props) {
  const { data: integration, isLoading } = useIntegration(integrationId)

  if (isLoading) return <PageLoader />
  if (!integration) return <p className="text-sm text-gray-500">Integration not found.</p>

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">{integration.name}</h2>
        <Badge className={integrationStatusColor(integration.status)}>{integration.status}</Badge>
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-500">Type</dt>
          <dd className="font-medium">{integration.type}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Endpoint</dt>
          <dd className="font-medium font-mono text-xs break-all">{integration.endpoint ?? '—'}</dd>
        </div>
      </dl>
    </div>
  )
}
