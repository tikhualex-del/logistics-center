import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { RoutesTable } from '@/components/routes/routes-table'
import { ROUTES } from '@/constants/routes'

export const metadata: Metadata = { title: 'Routes' }

export default function RoutesPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Routes"
        description="Manage delivery routes"
        action={
          <Link
            href={ROUTES.ROUTES_CREATE}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Route
          </Link>
        }
      />
      <RoutesTable />
    </div>
  )
}
