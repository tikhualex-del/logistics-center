import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { PlatformAdminDetailCard } from '@/components/platform/platform-admin-detail-card'

export const metadata: Metadata = { title: 'Platform Admin Detail' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function PlatformAdminDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Platform Admin Detail" />
      <PlatformAdminDetailCard adminId={id} />
    </div>
  )
}
