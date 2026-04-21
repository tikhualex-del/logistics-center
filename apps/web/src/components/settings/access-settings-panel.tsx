'use client'

import Link from 'next/link'
import { ROUTES } from '@/constants/routes'

export function AccessSettingsPanel() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <p className="text-sm text-gray-600">
        Manage team members and roles in the{' '}
        <Link href={ROUTES.USERS} className="text-blue-600 hover:underline">
          Users
        </Link>{' '}
        section.
      </p>
    </div>
  )
}
