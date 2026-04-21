import { useEffect } from 'react'
import { useUiStore } from '@/store'
import { cn } from '@/lib/utils'
import type { AlertNotificationPayload, AlertNotificationType } from '@/api/socket-client'

const TOAST_LIFETIME_MS = 6_000

const TOAST_STYLES: Record<
  AlertNotificationType,
  {
    label: string
    accent: string
    icon: string
  }
> = {
  'new-order': {
    label: 'New order',
    accent: 'bg-blue-500',
    icon: 'N',
  },
  'order-status-change': {
    label: 'Order update',
    accent: 'bg-amber-500',
    icon: 'O',
  },
  'route-change': {
    label: 'Route update',
    accent: 'bg-emerald-500',
    icon: 'R',
  },
}

export function AlertToastViewport(): React.ReactElement | null {
  const alertToasts = useUiStore((state) => state.alertToasts)

  if (alertToasts.length === 0) return null

  return (
    <section
      aria-label="Realtime alerts"
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-16 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {alertToasts.map((toast) => (
        <AlertToastCard key={toast.id} toast={toast} />
      ))}
    </section>
  )
}

function AlertToastCard({
  toast,
}: {
  toast: AlertNotificationPayload
}): React.ReactElement {
  const dismissAlertToast = useUiStore((state) => state.dismissAlertToast)
  const style = TOAST_STYLES[toast.type]

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      dismissAlertToast(toast.id)
    }, TOAST_LIFETIME_MS)

    return () => window.clearTimeout(timerId)
  }, [dismissAlertToast, toast.id])

  return (
    <article className="pointer-events-auto overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur animate-in slide-in-from-right-3 fade-in duration-200">
      <div className="flex gap-3 p-3">
        <div
          className={cn(
            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow-sm',
            style.accent,
          )}
          aria-hidden="true"
        >
          {style.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {style.label}
            </span>
            <time className="shrink-0 text-[10px] text-muted-foreground">
              {formatToastTime(toast.createdAt)}
            </time>
          </div>
          <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
            {toast.title}
          </p>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            {toast.message}
          </p>
        </div>
        <button
          type="button"
          onClick={() => dismissAlertToast(toast.id)}
          className="h-7 w-7 shrink-0 rounded-lg text-sm leading-none text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Dismiss alert"
        >
          x
        </button>
      </div>
      <div className={cn('h-1', style.accent)} />
    </article>
  )
}

function formatToastTime(createdAt: string): string {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return 'now'

  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
