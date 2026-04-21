import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { CompaniesTable } from '@/components/platform/companies-table'
import { ROUTES } from '@/constants/routes'

export const metadata: Metadata = { title: 'Companies' }

export default function CompaniesPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Companies"
        description="Manage tenant companies"
        action={
          <Link
            href={ROUTES.COMPANIES_CREATE}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Company
          </Link>
        }
      />
      <CompaniesTable />
    </div>
  )
}
