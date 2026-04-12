import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { IntegrationsTable } from '@/components/integrations/integrations-table'
import { ROUTES } from '@/constants/routes'

export const metadata: Metadata = { title: 'Integrations' }

export default function IntegrationsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Integrations"
        description="Manage external integrations"
        action={
          <Link
            href={ROUTES.INTEGRATIONS_CREATE}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Integration
          </Link>
        }
      />
      <IntegrationsTable />
    </div>
  )
}
