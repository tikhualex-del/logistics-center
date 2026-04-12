export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const diffMs  = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1)  return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)   return `${hours}h ago`
  const days  = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatDeadline(dateStr: string | null | undefined): string {
  if (!dateStr) return 'No deadline'
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()

  if (diffMs < 0) {
    const overdue = Math.floor(-diffMs / 60_000)
    if (overdue < 60)    return `${overdue}m overdue`
    const hours = Math.floor(overdue / 60)
    if (hours < 24)      return `${hours}h overdue`
    return `${Math.floor(hours / 24)}d overdue`
  }

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 60)  return `in ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)    return `in ${hours}h`
  return formatDateTime(dateStr)
}
