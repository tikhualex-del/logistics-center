import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { CourierDetailCard } from '@/components/couriers/courier-detail-card'

export const metadata: Metadata = { title: 'Courier Detail' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function CourierDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Courier Detail" />
      <CourierDetailCard courierId={id} />
    </div>
  )
}
