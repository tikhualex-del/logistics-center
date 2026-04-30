import { useMemo, useState, type FormEvent, type ReactElement } from 'react'
import { CheckCircle2, KeyRound, Plus, RefreshCw, Webhook } from 'lucide-react'
import {
  SUPPORTED_WEBHOOK_EVENTS,
  type UpsertWebhookRegistrationDto,
  type WebhookRegistration,
} from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCreateWebhook,
  usePermissions,
  useUpdateWebhook,
  useWebhooks,
} from '@/hooks'
import { cn } from '@/lib/utils'

const EMPTY_WEBHOOKS: readonly WebhookRegistration[] = []

interface WebhookFormState {
  id: string | null
  name: string
  provider: string
  outboundWebhookUrl: string
  webhookSecret: string
  inboundSecret: string
  eventTypes: string[]
  isActive: boolean
}

const EMPTY_FORM: WebhookFormState = {
  id: null,
  name: '',
  provider: 'crm',
  outboundWebhookUrl: '',
  webhookSecret: '',
  inboundSecret: '',
  eventTypes: [...SUPPORTED_WEBHOOK_EVENTS],
  isActive: true,
}

export function IntegrationsWorkspace(): ReactElement {
  const webhooksQuery = useWebhooks()
  const createWebhookMutation = useCreateWebhook()
  const updateWebhookMutation = useUpdateWebhook()
  const { can } = usePermissions()
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null)
  const [form, setForm] = useState<WebhookFormState>(EMPTY_FORM)

  const webhooks = webhooksQuery.data ?? EMPTY_WEBHOOKS
  const selectedWebhook =
    webhooks.find((webhook) => webhook.id === selectedWebhookId) ??
    webhooks[0] ??
    null
  const activeCount = useMemo(
    () => webhooks.filter((webhook) => webhook.isActive).length,
    [webhooks],
  )
  const canConnect = can('connect:integrations')
  const isEditing = form.id !== null

  function editWebhook(webhook: WebhookRegistration): void {
    setForm({
      id: webhook.id,
      name: webhook.name,
      provider: webhook.provider,
      outboundWebhookUrl: webhook.outboundWebhookUrl ?? '',
      webhookSecret: '',
      inboundSecret: '',
      eventTypes:
        webhook.eventTypes.length > 0
          ? webhook.eventTypes
          : [...SUPPORTED_WEBHOOK_EVENTS],
      isActive: webhook.isActive,
    })
  }

  function resetForm(): void {
    setForm(EMPTY_FORM)
    createWebhookMutation.reset()
    updateWebhookMutation.reset()
  }

  function submitWebhook(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const payload = formToPayload(form)
    if (payload === null) return

    if (form.id) {
      updateWebhookMutation.mutate(
        { id: form.id, data: payload },
        { onSuccess: resetForm },
      )
    } else {
      createWebhookMutation.mutate(payload, { onSuccess: resetForm })
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto bg-background p-4 md:p-6">
      <div className="flex flex-col gap-3 border-b border-border pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Интеграции
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">
            Webhook-каналы
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Расширенный список, детали и журнал состояния поверх canonical webhook API.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void webhooksQuery.refetch()}
        >
          <RefreshCw aria-hidden="true" />
          Обновить
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Всего каналов" value={webhooks.length} />
        <Metric label="Активные" value={activeCount} />
        <Metric label="Поддерживаемые события" value={SUPPORTED_WEBHOOK_EVENTS.length} />
      </div>

      <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <section className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Зарегистрированные webhooks
              </h2>
              <p className="text-xs text-muted-foreground">
                {webhooks.length} записей
              </p>
            </div>
            {canConnect && (
              <Button type="button" size="sm" onClick={resetForm}>
                <Plus aria-hidden="true" />
                Новый
              </Button>
            )}
          </div>
          <div className="divide-y divide-border">
            {webhooksQuery.isLoading && (
              <p className="p-4 text-sm text-muted-foreground">Загрузка...</p>
            )}
            {!webhooksQuery.isLoading &&
              webhooks.map((webhook) => (
                <button
                  key={webhook.id}
                  type="button"
                  onClick={() => setSelectedWebhookId(webhook.id)}
                  className={cn(
                    'flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-muted/50',
                    selectedWebhook?.id === webhook.id && 'bg-muted',
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {webhook.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {webhook.provider} · {webhook.eventTypes.length} событий
                    </p>
                  </div>
                  <StatusPill active={webhook.isActive} />
                </button>
              ))}
            {!webhooksQuery.isLoading && webhooks.length === 0 && (
              <p className="p-6 text-sm text-muted-foreground">
                Webhook-каналы пока не зарегистрированы.
              </p>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <IntegrationDetailCard webhook={selectedWebhook} onEdit={editWebhook} />
          {canConnect && (
            <WebhookForm
              form={form}
              isEditing={isEditing}
              isPending={
                createWebhookMutation.isPending || updateWebhookMutation.isPending
              }
              onSubmit={submitWebhook}
              onChange={setForm}
              onReset={resetForm}
            />
          )}
        </aside>
      </div>
    </section>
  )
}

function IntegrationDetailCard({
  webhook,
  onEdit,
}: {
  webhook: WebhookRegistration | null
  onEdit: (webhook: WebhookRegistration) => void
}): ReactElement {
  if (webhook === null) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
        Выберите интеграцию для просмотра деталей.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Детали интеграции
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            {webhook.name}
          </h2>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => onEdit(webhook)}>
          Изменить
        </Button>
      </div>
      <dl className="mt-4 space-y-3 text-sm">
        <Detail label="Провайдер" value={webhook.provider} />
        <Detail label="URL" value={webhook.outboundWebhookUrl ?? 'Не задан'} />
        <Detail
          label="Секреты"
          value={`${webhook.hasWebhookSecret ? 'webhook задан' : 'webhook нет'} · ${
            webhook.hasInboundSecret ? 'inbound задан' : 'inbound нет'
          }`}
        />
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        {webhook.eventTypes.map((eventType) => (
          <span
            key={eventType}
            className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
          >
            {eventType}
          </span>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-dashed border-border bg-background p-3 text-xs text-muted-foreground">
        Журнал доставок в canonical backend пока не открыт отдельным endpoint. В 11.4 сохранена точка UI: здесь будут последние события и ответы CRM.
      </div>
    </div>
  )
}

function WebhookForm({
  form,
  isEditing,
  isPending,
  onSubmit,
  onChange,
  onReset,
}: {
  form: WebhookFormState
  isEditing: boolean
  isPending: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onChange: (form: WebhookFormState) => void
  onReset: () => void
}): ReactElement {
  function update<Key extends keyof WebhookFormState>(
    key: Key,
    value: WebhookFormState[Key],
  ): void {
    onChange({ ...form, [key]: value })
  }

  function toggleEvent(eventType: string): void {
    update(
      'eventTypes',
      form.eventTypes.includes(eventType)
        ? form.eventTypes.filter((item) => item !== eventType)
        : [...form.eventTypes, eventType],
    )
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Webhook className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-base font-semibold text-foreground">
          {isEditing ? 'Редактировать webhook' : 'Новый webhook'}
        </h2>
      </div>
      <div className="mt-4 space-y-3">
        <Field label="Название" value={form.name} onChange={(value) => update('name', value)} required />
        <Field label="Провайдер" value={form.provider} onChange={(value) => update('provider', value)} required />
        <Field label="Исходящий URL" value={form.outboundWebhookUrl} onChange={(value) => update('outboundWebhookUrl', value)} required />
        <Field label="Webhook secret" value={form.webhookSecret} onChange={(value) => update('webhookSecret', value)} />
        <Field label="Inbound secret" value={form.inboundSecret} onChange={(value) => update('inboundSecret', value)} />
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          События
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SUPPORTED_WEBHOOK_EVENTS.map((eventType) => (
            <button
              key={eventType}
              type="button"
              onClick={() => toggleEvent(eventType)}
              className={cn(
                'rounded-md px-2 py-1 text-xs font-semibold ring-1 transition-colors',
                form.eventTypes.includes(eventType)
                  ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20'
                  : 'bg-muted text-muted-foreground ring-border',
              )}
            >
              {eventType}
            </button>
          ))}
        </div>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(event) => update('isActive', event.target.checked)}
        />
        Активный webhook
      </label>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onReset}>
          Сбросить
        </Button>
        <Button type="submit" disabled={isPending || form.eventTypes.length === 0}>
          <KeyRound aria-hidden="true" />
          {isEditing ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </form>
  )
}

function Metric({ label, value }: { label: string; value: number }): ReactElement {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  )
}

function StatusPill({ active }: { active: boolean }): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-semibold ring-1',
        active
          ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20'
          : 'bg-slate-500/10 text-slate-600 ring-slate-500/20',
      )}
    >
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      {active ? 'Активен' : 'Отключен'}
    </span>
  )
}

function Detail({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-foreground">{value}</dd>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}): ReactElement {
  const id = `integration-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2"
      />
    </div>
  )
}

function formToPayload(
  form: WebhookFormState,
): UpsertWebhookRegistrationDto | null {
  const name = form.name.trim()
  const provider = form.provider.trim()
  const outboundWebhookUrl = form.outboundWebhookUrl.trim()
  if (!name || !provider || !outboundWebhookUrl || form.eventTypes.length === 0) {
    return null
  }

  return {
    name,
    provider,
    outboundWebhookUrl,
    webhookSecret: optionalString(form.webhookSecret),
    inboundSecret: optionalString(form.inboundSecret),
    eventTypes: form.eventTypes,
    isActive: form.isActive,
  }
}

function optionalString(value: string): string | undefined {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}
