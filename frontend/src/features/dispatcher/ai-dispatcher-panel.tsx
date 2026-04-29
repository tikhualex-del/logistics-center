import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '@/store'

function IconSparkles(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3-1.7 5.2L5 10l5.3 1.8L12 17l1.7-5.2L19 10l-5.3-1.8L12 3Z" />
      <path d="M5 3v4" />
      <path d="M3 5h4" />
      <path d="M19 17v4" />
      <path d="M17 19h4" />
    </svg>
  )
}

function IconSend(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}

function IconClose(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

export function AiDispatcherPanel({
  open,
  onClose,
  onToggle,
}: {
  open: boolean
  onClose: () => void
  onToggle: () => void
}): React.ReactElement {
  const { t } = useTranslation()
  const [command, setCommand] = useState('')
  const selectedOrderIds = useUiStore((state) => state.selectedOrderIds)
  const clearOrderSelection = useUiStore((state) => state.clearOrderSelection)
  const quickCommands = [
    t('aiDispatcher.quickBuildRoutes'),
    t('aiDispatcher.quickNewOnly'),
    t('aiDispatcher.quickUrgent'),
    t('aiDispatcher.quickAssignCouriers'),
    t('aiDispatcher.quickHideUnsuitable'),
  ]

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className={[
          'pointer-events-auto absolute bottom-[9.25rem] z-50 flex h-14 w-10 items-center justify-center border border-violet-500/70 bg-slate-950 text-xs font-bold tracking-wide text-violet-100 shadow-lg shadow-violet-950/30 backdrop-blur transition-[right,background-color,color] duration-300 hover:bg-slate-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-500',
          open ? 'rounded-l-2xl border-r-0' : 'rounded-2xl',
          open ? 'bg-slate-900 text-white' : '',
        ].join(' ')}
        style={{ right: open ? 'calc(20rem + 0.375rem)' : '0.375rem' }}
        aria-controls="ai-dispatcher-panel"
        aria-expanded={open}
        aria-label={open ? t('common.close') : t('aiDispatcher.open')}
        title={open ? t('common.close') : t('aiDispatcher.open')}
      >
        AI
      </button>

      <aside
        id="ai-dispatcher-panel"
        className={[
          'pointer-events-auto absolute bottom-4 right-1.5 z-40 flex h-80 w-80 flex-col overflow-hidden rounded-2xl border border-violet-500/80 bg-slate-950 text-slate-100 shadow-2xl shadow-violet-950/30 transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]',
        ].join(' ')}
        aria-hidden={!open}
      >
      <div className="mx-auto h-1 w-12 rounded-full bg-slate-700" />
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-violet-300">
            <IconSparkles />
          </span>
          <h2 className="text-sm font-semibold">{t('aiDispatcher.title')}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          aria-label={t('common.close')}
        >
          <IconClose />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-xs font-medium text-slate-300">
          {t('aiDispatcher.description')}
        </p>

        <div className="mt-3 flex gap-2">
          <label htmlFor="ai-dispatcher-command" className="sr-only">
            {t('aiDispatcher.placeholder')}
          </label>
          <input
            id="ai-dispatcher-command"
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder={t('aiDispatcher.placeholder')}
            className="h-10 min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            type="button"
            disabled={command.trim().length === 0}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            aria-label={t('aiDispatcher.send')}
          >
            <IconSend />
          </button>
        </div>

        <p className="mt-4 text-[11px] font-semibold text-slate-400">
          {t('aiDispatcher.popularCommands')}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {quickCommands.map((quickCommand) => (
            <button
              key={quickCommand}
              type="button"
              onClick={() => setCommand(quickCommand)}
              className="rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {quickCommand}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-800 px-4 py-3 text-xs">
        <span className="text-slate-400">
          {t('aiDispatcher.selectedOrders', { count: selectedOrderIds.length })}
        </span>
        <button
          type="button"
          onClick={clearOrderSelection}
          disabled={selectedOrderIds.length === 0}
          className="font-semibold text-blue-400 transition-colors hover:text-blue-300 disabled:cursor-not-allowed disabled:text-slate-600"
        >
          {t('aiDispatcher.clearSelection')}
        </button>
      </div>
      </aside>
    </>
  )
}
