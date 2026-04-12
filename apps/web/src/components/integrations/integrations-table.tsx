'use client'

import Link from 'next/link'
import { useIntegrations } from '@/features/integrations/hooks'
import { Table, TableHead, TableBody, Th, Td } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/loader'
import { EmptyState } from '@/components/ui/empty-state'
import { ROUTES } from '@/constants/routes'
import { integrationStatusColor } from '@/lib/utils/status-colors'

export function IntegrationsTable() {
  const { data: integrations, isLoading } = useIntegrations()

  if (isLoading) return <PageLoader />
  if (!integrations?.length) return <EmptyState title="No integrations yet" description="Connect your first external service." />

  return (
    <Table>
      <TableHead>
        <tr>
          <Th>Name</Th>
          <Th>Type</Th>
          <Th>Status</Th>
          <Th>Events</Th>
          <Th />
        </tr>
      </TableHead>
      <TableBody>
        {integrations.map((integration) => (
          <tr key={integration.id}>
            <Td className="font-medium">{integration.name}</Td>
            <Td>{integration.type}</Td>
            <Td><Badge className={integrationStatusColor(integration.status)}>{integration.status}</Badge></Td>
            <Td>{integration.eventCount ?? 0}</Td>
            <Td>
              <Link href={ROUTES.INTEGRATION(integration.id)} className="text-blue-600 hover:underline text-sm">
                View
              </Link>
            </Td>
          </tr>
        ))}
      </TableBody>
    </Table>
  )
}
