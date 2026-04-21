import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { OrderDetailCard } from '@/components/orders/order-detail-card'
import { OrderActions } from '@/components/orders/order-actions'
import { OrderHistoryList } from '@/components/orders/order-history-list'

export const metadata: Metadata = { title: 'Order Detail' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Order Detail" />
      <OrderActions orderId={id} />
      <OrderDetailCard orderId={id} />
      <OrderHistoryList orderId={id} />
    </div>
  )
}
