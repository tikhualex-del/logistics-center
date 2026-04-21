'use client'

import Link from 'next/link'
import { useRoutes } from '@/features/routes/hooks'
import { Table, TableHead, TableBody, Th, Td } from '@/components/ui/table'
import { RouteStatusBadge } from './route-status-badge'
import { PageLoader } from '@/components/ui/loader'
import { EmptyState } from '@/components/ui/empty-state'
import { ROUTES } from '@/constants/routes'

export function RoutesTable() {
  const { data: routes, isLoading } = useRoutes()

  if (isLoading) return <PageLoader />
  if (!routes?.length) return <EmptyState title="No routes yet" description="Create your first route to get started." />

  return (
    <Table>
      <TableHead>
        <tr>
          <Th>Name</Th>
          <Th>Status</Th>
          <Th>Courier</Th>
          <Th>Orders</Th>
          <Th>On Track</Th>
          <Th>At Risk</Th>
          <Th>Breached</Th>
          <Th />
        </tr>
      </TableHead>
      <TableBody>
        {routes.map((route) => (
          <tr key={route.id}>
            <Td className="font-medium">{route.name}</Td>
            <Td><RouteStatusBadge status={route.status} /></Td>
            <Td>{route.courier?.name ?? '—'}</Td>
            <Td>{route.orderCount}</Td>
            <Td>{route.slaSummary.on_track}</Td>
            <Td>{route.slaSummary.at_risk}</Td>
            <Td>{route.slaSummary.breached}</Td>
            <Td>
              <Link href={ROUTES.ROUTE(route.id)} className="text-blue-600 hover:underline text-sm">
                View
              </Link>
            </Td>
          </tr>
        ))}
      </TableBody>
    </Table>
  )
}
