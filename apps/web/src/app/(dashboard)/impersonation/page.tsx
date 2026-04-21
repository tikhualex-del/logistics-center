import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { ImpersonationPanel } from '@/components/platform/impersonation-panel'

export const metadata: Metadata = { title: 'Impersonation' }

export default function ImpersonationPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Impersonation" description="Access a tenant company as a platform admin" />
      <ImpersonationPanel />
    </div>
  )
}
