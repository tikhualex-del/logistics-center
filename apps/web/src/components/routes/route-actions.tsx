'use client'

import { useRoute, useUpdateRouteStatus } from '@/features/routes/hooks'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/layout/role-guard'

interface Props {
  routeId: string
}

export function RouteActions({ routeId }: Props) {
  const { data: route } = useRoute(routeId)
  const { mutate: updateStatus, isPending } = useUpdateRouteStatus(routeId)

  if (!route) return null

  return (
    <RoleGuard roles={['owner', 'dispatcher']}>
      <div className="flex gap-2">
        {route.status === 'draft' && (
          <Button size="sm" onClick={() => updateStatus('assigned')} disabled={isPending}>
            Assign
          </Button>
        )}
        {route.status === 'assigned' && (
          <Button size="sm" onClick={() => updateStatus('completed')} disabled={isPending}>
            Mark Completed
          </Button>
        )}
        {['draft', 'assigned'].includes(route.status) && (
          <Button size="sm" variant="danger" onClick={() => updateStatus('cancelled')} disabled={isPending}>
            Cancel
          </Button>
        )}
      </div>
    </RoleGuard>
  )
}
