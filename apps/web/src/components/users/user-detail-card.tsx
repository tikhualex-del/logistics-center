'use client'

import { useUser } from '@/features/users/hooks'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/loader'
import { userStatusColor } from '@/lib/utils/status-colors'

interface Props {
  userId: string
}

export function UserDetailCard({ userId }: Props) {
  const { data: user, isLoading } = useUser(userId)

  if (isLoading) return <PageLoader />
  if (!user) return <p className="text-sm text-gray-500">User not found.</p>

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">{user.name}</h2>
        <Badge className={userStatusColor(user.status)}>{user.status}</Badge>
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-500">Email</dt>
          <dd className="font-medium">{user.email}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Role</dt>
          <dd className="font-medium capitalize">{user.role}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Member since</dt>
          <dd className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</dd>
        </div>
      </dl>
    </div>
  )
}
