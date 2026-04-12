'use client'

import { usePlatformAdmin } from '@/features/platform/hooks'
import { PageLoader } from '@/components/ui/loader'

interface Props {
  adminId: string
}

export function PlatformAdminDetailCard({ adminId }: Props) {
  const { data: admin, isLoading } = usePlatformAdmin(adminId)

  if (isLoading) return <PageLoader />
  if (!admin) return <p className="text-sm text-gray-500">Admin not found.</p>

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="text-lg font-semibold">{admin.name}</h2>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-500">Email</dt>
          <dd className="font-medium">{admin.email}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Created</dt>
          <dd className="font-medium">{new Date(admin.createdAt).toLocaleDateString()}</dd>
        </div>
      </dl>
    </div>
  )
}
