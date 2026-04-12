import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { OrdersFilters } from '@/components/orders/orders-filters'
import { OrdersTable } from '@/components/orders/orders-table'
import { ROUTES } from '@/constants/routes'

export const metadata: Metadata = { title: 'Orders' }

export default function OrdersPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Orders"
        description="Manage and track all delivery orders"
        action={
          <Link
            href={ROUTES.ORDERS_CREATE}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New Order
          </Link>
        }
      />
      <OrdersFilters />
      <OrdersTable />
    </div>
  )
}
