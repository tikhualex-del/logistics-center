import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { RouteDetailCard } from '@/components/routes/route-detail-card'
import { RouteActions } from '@/components/routes/route-actions'
import { RouteOrdersList } from '@/components/routes/route-orders-list'

export const metadata: Metadata = { title: 'Route Detail' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function RouteDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Route Detail" />
      <RouteActions routeId={id} />
      <RouteDetailCard routeId={id} />
      <RouteOrdersList routeId={id} />
    </div>
  )
}
