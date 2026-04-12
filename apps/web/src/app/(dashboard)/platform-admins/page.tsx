import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { PlatformAdminsTable } from '@/components/platform/platform-admins-table'
import { ROUTES } from '@/constants/routes'

export const metadata: Metadata = { title: 'Platform Admins' }

export default function PlatformAdminsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Platform Admins"
        description="Manage platform administrator accounts"
        action={
          <Link
            href={ROUTES.PLATFORM_ADMINS_CREATE}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Admin
          </Link>
        }
      />
      <PlatformAdminsTable />
    </div>
  )
}
