import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { CouriersTable } from '@/components/couriers/couriers-table'
import { ROUTES } from '@/constants/routes'

export const metadata: Metadata = { title: 'Couriers' }

export default function CouriersPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Couriers"
        description="Manage courier fleet"
        action={
          <Link
            href={ROUTES.COURIERS_CREATE}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Courier
          </Link>
        }
      />
      <CouriersTable />
    </div>
  )
}
