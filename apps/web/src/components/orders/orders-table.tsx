'use client'

import Link from 'next/link'
import { useOrders } from '@/features/orders/hooks'
import { Table, TableHead, TableBody, Th, Td } from '@/components/ui/table'
import { OrderStatusBadge } from './order-status-badge'
import { SlaStatusBadge } from '@/components/sla/sla-status-badge'
import { PageLoader } from '@/components/ui/loader'
import { EmptyState } from '@/components/ui/empty-state'
import { ROUTES } from '@/constants/routes'

export function OrdersTable() {
  const { data: orders, isLoading } = useOrders()

  if (isLoading) return <PageLoader />
  if (!orders?.length) return <EmptyState title="No orders yet" description="Create your first order to get started." />

  return (
    <Table>
      <TableHead>
        <tr>
          <Th>ID</Th>
          <Th>Клиент</Th>
          <Th>Статус</Th>
          <Th>SLA</Th>
          <Th>Дедлайн</Th>
          <Th>Курьер</Th>
          <Th />
        </tr>
      </TableHead>
      <TableBody>
        {orders.map((order) => (
          <tr key={order.id}>
            <Td className="font-mono text-xs">{order.id.slice(0, 8)}</Td>
            <Td>{order.customerName}</Td>
            <Td><OrderStatusBadge status={order.status} /></Td>
            <Td><SlaStatusBadge status={order.slaStatus} /></Td>
            <Td>{order.deadline ? new Date(order.deadline).toLocaleDateString() : '—'}</Td>
            <Td>{order.courierId ?? '—'}</Td>
            <Td>
              <Link href={ROUTES.ORDER(order.id)} className="text-blue-600 hover:underline text-sm">
                Открыть
              </Link>
            </Td>
          </tr>
        ))}
      </TableBody>
    </Table>
  )
}
