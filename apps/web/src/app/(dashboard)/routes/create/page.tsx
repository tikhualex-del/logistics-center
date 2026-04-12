import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { CreateRouteForm } from '@/components/routes/create-route-form'

export const metadata: Metadata = { title: 'Create Route' }

export default function CreateRoutePage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Create Route" description="Create a new delivery route" />
      <CreateRouteForm />
    </div>
  )
}
