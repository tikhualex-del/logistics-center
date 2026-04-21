'use client'

import Link from 'next/link'
import { ROUTES } from '@/constants/routes'

export function IntegrationsSettingsPanel() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <p className="text-sm text-gray-600">
        Manage your integrations from the{' '}
        <Link href={ROUTES.INTEGRATIONS} className="text-blue-600 hover:underline">
          Integrations
        </Link>{' '}
        section.
      </p>
    </div>
  )
}
