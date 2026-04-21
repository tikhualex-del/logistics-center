'use client'

import { useOrderHistory } from '@/features/orders/hooks'
import { PageLoader } from '@/components/ui/loader'
import { EmptyState } from '@/components/ui/empty-state'

interface Props {
  orderId: string
}

export function OrderHistoryList({ orderId }: Props) {
  const { data: history, isLoading } = useOrderHistory(orderId)

  if (isLoading) return <PageLoader />

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-base font-semibold text-gray-900">History</h2>
      {!history?.length ? (
        <EmptyState title="No history" />
      ) : (
        <ol className="space-y-3">
          {history.map((entry) => (
            <li key={entry.id} className="flex items-start gap-3 text-sm">
              <span className="shrink-0 text-gray-400 text-xs">
                {new Date(entry.createdAt).toLocaleString()}
              </span>
              <span className="text-gray-700">{entry.event}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
