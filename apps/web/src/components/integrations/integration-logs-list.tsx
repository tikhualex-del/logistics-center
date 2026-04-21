'use client'

import { useIntegrationLogs } from '@/features/integrations/hooks'
import { Table, TableHead, TableBody, Th, Td } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/loader'
import { EmptyState } from '@/components/ui/empty-state'

interface Props {
  integrationId: string
}

export function IntegrationLogsList({ integrationId }: Props) {
  const { data: logs, isLoading } = useIntegrationLogs(integrationId)

  if (isLoading) return <PageLoader />
  if (!logs?.length) return <EmptyState title="No logs" description="No events have been delivered yet." />

  return (
    <Table>
      <TableHead>
        <tr>
          <Th>Time</Th>
          <Th>Event</Th>
          <Th>Status</Th>
          <Th>Response</Th>
        </tr>
      </TableHead>
      <TableBody>
        {logs.map((log) => (
          <tr key={log.id}>
            <Td className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</Td>
            <Td>{log.event}</Td>
            <Td>
              <Badge variant={log.success ? 'success' : 'danger'}>
                {log.success ? 'OK' : 'Failed'}
              </Badge>
            </Td>
            <Td className="text-xs font-mono">{log.responseStatus ?? '—'}</Td>
          </tr>
        ))}
      </TableBody>
    </Table>
  )
}
