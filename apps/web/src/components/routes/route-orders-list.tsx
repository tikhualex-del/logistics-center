'use client'

import Link from 'next/link'
import { useRoute } from '@/features/routes/hooks'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { SlaStatusBadge } from '@/components/sla/sla-status-badge'
import { Table, TableHead, TableBody, Th, Td } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { ROUTES } from '@/constants/routes'

interface Props {
  routeId: string
}

export function RouteOrdersList({ routeId }: Props) {
  const { data: route } = useRoute(routeId)

  const orders = route?.orders ?? []

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-base font-semibold text-gray-900">Orders</h2>
      {!orders.length ? (
        <EmptyState title="No orders in this route" />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <Th>Recipient</Th>
              <Th>Status</Th>
              <Th>SLA</Th>
              <Th>Position</Th>
              <Th />
            </tr>
          </TableHead>
          <TableBody>
            {orders.map((ro) => (
              <tr key={ro.orderId}>
                <Td>{ro.order.customerName}</Td>
                <Td><OrderStatusBadge status={ro.order.status} /></Td>
                <Td><SlaStatusBadge status={ro.order.slaStatus} /></Td>
                <Td>{ro.position}</Td>
                <Td>
                  <Link href={ROUTES.ORDER(ro.orderId)} className="text-blue-600 hover:underline text-sm">
                    View
                  </Link>
                </Td>
              </tr>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
