import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { UsersTable } from '@/components/users/users-table'
import { ROUTES } from '@/constants/routes'

export const metadata: Metadata = { title: 'Users' }

export default function UsersPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        description="Manage team members"
        action={
          <Link
            href={ROUTES.USERS_CREATE}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Invite User
          </Link>
        }
      />
      <UsersTable />
    </div>
  )
}
