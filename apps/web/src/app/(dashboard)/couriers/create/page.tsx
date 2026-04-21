import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { CourierForm } from '@/components/couriers/courier-form'

export const metadata: Metadata = { title: 'Add Courier' }

export default function CreateCourierPage() {
  return (
    <div className="max-w-lg">
      <PageHeader title="Add Courier" />
      <CourierForm />
    </div>
  )
}
