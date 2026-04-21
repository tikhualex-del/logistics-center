import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { CreateOrderForm } from '@/components/orders/create-order-form'

export const metadata: Metadata = { title: 'New Order' }

export default function CreateOrderPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="New Order" description="Create a new delivery order" />
      <CreateOrderForm />
    </div>
  )
}
