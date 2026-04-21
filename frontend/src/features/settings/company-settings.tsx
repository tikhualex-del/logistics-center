import { useMemo, useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import {
  Building2,
  CheckCircle2,
  Edit3,
  Flag,
  Globe2,
  KeyRound,
  Link2,
  Plus,
  RefreshCw,
  Save,
  Webhook,
  XCircle,
} from 'lucide-react'
import {
  SUPPORTED_WEBHOOK_EVENTS,
  type CompanyFeature,
  type UpsertWebhookRegistrationDto,
  type WebhookRegistration,
} from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCompanyFeatures,
  useCreateWebhook,
  useCurrentCompany,
  usePermissions,
  useUpdateCompanyFeature,
  useUpdateCurrentCompany,
  useUpdateWebhook,
  useWebhooks,
} from '@/hooks'
import { cn } from '@/lib/utils'

const DEFAULT_FEATURE_KEYS = [
  'routing.yandex',
  'integrations.crm',
  'payments.minimum-guarantee',
  'notifications.realtime',
  'analytics.finance',
]

interface FeatureDraft {
  enabled: boolean
  configText: string
}

interface WebhookFormState {
  id: string | null
  name: string
  provider: string
  outboundWebhookUrl: string
  webhookSecret: string
  inboundSecret: string
  eventTypes: string[]
  isActive: boolean
  settingsText: string
}

const DEFAULT_WEBHOOK_FORM: WebhookFormState = {
  id: null,
  name: 'crm-main',
  provider: 'crm',
  outboundWebhookUrl: '',
  webhookSecret: '',
  inboundSecret: '',
  eventTypes: [...SUPPORTED_WEBHOOK_EVENTS],
  isActive: true,
  settingsText: '{}',
}

export function CompanySettings(): ReactElement {
  const companyQuery = useCurrentCompany()
  const featuresQuery = useCompanyFeatures()
  const webhooksQuery = useWebhooks()
  const updateCompanyMutation = useUpdateCurrentCompany()
  const updateFeatureMutation = useUpdateCompanyFeature()
  const createWebhookMutation = useCreateWebhook()
  const updateWebhookMutation = useUpdateWebhook()
  const { can } = usePermissions()

  const [companyName, setCompanyName] = useState('')
  const [featureDrafts, setFeatureDrafts] = useState<Record<string, FeatureDraft>>({})
  const [webhookForm, setWebhookForm] =
    useState<WebhookFormState>(DEFAULT_WEBHOOK_FORM)
  const [webhookError, setWebhookError] = useState<string | null>(null)

  const company = companyQuery.data ?? null
  const features = useMemo(
    () => featuresQuery.data ?? [],
    [featuresQuery.data],
  )
  const webhooks = useMemo(() => webhooksQuery.data ?? [], [webhooksQuery.data])
  const featureRows = useMemo(() => mergeFeatureRows(features), [features])
  const canEditCompany = can('manage:users')
  const canConnectIntegrations = can('connect:integrations')
  const isWebhookEditing = webhookForm.id !== null

  function syncCompanyName(): void {
    setCompanyName(company?.name ?? '')
  }

  function updateCompanyName(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const name = companyName.trim()
    if (!name) return

    updateCompanyMutation.mutate({ name })
  }

  function getFeatureDraft(feature: CompanyFeature): FeatureDraft {
    return (
      featureDrafts[feature.featureKey] ?? {
        enabled: feature.enabled,
        configText: formatJson(feature.config ?? {}),
      }
    )
  }

  function updateFeatureDraft(
    featureKey: string,
    patch: Partial<FeatureDraft>,
  ): void {
    setFeatureDrafts((current) => ({
      ...current,
      [featureKey]: {
        enabled: current[featureKey]?.enabled ?? false,
        configText: current[featureKey]?.configText ?? '{}',
        ...patch,
      },
    }))
  }

  function saveFeature(feature: CompanyFeature): void {
    const draft = getFeatureDraft(feature)
    const config = parseJsonObject(draft.configText)
    if (config === null) return

    updateFeatureMutation.mutate({
      featureKey: feature.featureKey,
      data: {
        enabled: draft.enabled,
        config,
      },
    })
  }

  function editWebhook(webhook: WebhookRegistration): void {
    setWebhookError(null)
    setWebhookForm({
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
      settingsText: formatJson(webhook.settings ?? {}),
    })
  }

  function resetWebhookForm(): void {
    setWebhookError(null)
    setWebhookForm(DEFAULT_WEBHOOK_FORM)
    createWebhookMutation.reset()
    updateWebhookMutation.reset()
  }

  function updateWebhookForm<Key extends keyof WebhookFormState>(
    key: Key,
    value: WebhookFormState[Key],
  ): void {
    setWebhookForm((current) => ({ ...current, [key]: value }))
  }

  function toggleWebhookEvent(eventType: string): void {
    setWebhookForm((current) => {
      const hasEvent = current.eventTypes.includes(eventType)
      return {
        ...current,
        eventTypes: hasEvent
          ? current.eventTypes.filter((item) => item !== eventType)
          : [...current.eventTypes, eventType],
      }
    })
  }

  function submitWebhook(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    setWebhookError(null)

    const payload = webhookFormToPayload(webhookForm)
    if (!payload) {
      setWebhookError('Settings must be a valid JSON object.')
      return
    }

    if (webhookForm.id) {
      updateWebhookMutation.mutate(
        { id: webhookForm.id, data: payload },
        { onSuccess: resetWebhookForm },
      )
    } else {
      createWebhookMutation.mutate(payload, { onSuccess: resetWebhookForm })
    }
  }

  return (
    <section className="space-y-4 xl:col-span-2">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_410px]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Company profile
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">
                    {company?.name ?? 'Current company'}
                  </h2>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={syncCompanyName}
                  disabled={company === null}
                >
                  <Edit3 />
                  Edit name
                </Button>
              </div>
            </div>

            <form onSubmit={updateCompanyName} className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div>
                <Label htmlFor="company-name">Company name</Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder={company?.name ?? 'Company name'}
                  disabled={!canEditCompany}
                  className="mt-2"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Created {company ? formatDate(company.createdAt) : 'unknown'} ·
                  updated {company ? formatDate(company.updatedAt) : 'unknown'}
                </p>
              </div>
              <Button
                type="submit"
                disabled={!canEditCompany || updateCompanyMutation.isPending}
              >
                <Save />
                Save profile
              </Button>
            </form>
          </section>

          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-border p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Feature flags
                </p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">
                  Runtime capabilities
                </h2>
              </div>
              <button
                type="button"
                onClick={() => void featuresQuery.refetch()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent"
                aria-label="Refresh feature flags"
              >
                <RefreshCw
                  className={cn(
                    'h-4 w-4',
                    featuresQuery.isFetching && 'animate-spin',
                  )}
                />
              </button>
            </div>
            <div className="divide-y divide-border">
              {featureRows.map((feature) => {
                const draft = getFeatureDraft(feature)
                return (
                  <div key={feature.featureKey} className="p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Flag className="h-4 w-4 text-muted-foreground" />
                          <h3 className="truncate text-sm font-semibold text-foreground">
                            {feature.featureKey}
                          </h3>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {feature.enabled ? 'Enabled' : 'Disabled'} · updated{' '}
                          {formatDate(feature.updatedAt)}
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                        <input
                          type="checkbox"
                          checked={draft.enabled}
                          onChange={(event) =>
                            updateFeatureDraft(feature.featureKey, {
                              enabled: event.target.checked,
                            })
                          }
                          disabled={!canEditCompany}
                          className="h-4 w-4 accent-primary"
                        />
                        Enabled
                      </label>
                    </div>
                    <textarea
                      value={draft.configText}
                      onChange={(event) =>
                        updateFeatureDraft(feature.featureKey, {
                          configText: event.target.value,
                        })
                      }
                      rows={3}
                      disabled={!canEditCompany}
                      className="mt-3 w-full resize-none rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                    <div className="mt-3 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!canEditCompany || updateFeatureMutation.isPending}
                        onClick={() => saveFeature(feature)}
                      >
                        <Save />
                        Save flag
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Integrations
                </p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">
                  Webhook endpoints
                </h2>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={resetWebhookForm}>
                <Plus />
                New
              </Button>
            </div>
          </div>

          <form onSubmit={submitWebhook} className="space-y-4 p-5">
            {!canConnectIntegrations && (
              <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-700">
                Your current role cannot manage integrations.
              </p>
            )}

            <FormField label="Name" htmlFor="webhook-name" icon={<Webhook />}>
              <Input
                id="webhook-name"
                value={webhookForm.name}
                onChange={(event) => updateWebhookForm('name', event.target.value)}
                disabled={!canConnectIntegrations}
                required
              />
            </FormField>

            <FormField label="Provider" htmlFor="webhook-provider" icon={<Building2 />}>
              <Input
                id="webhook-provider"
                value={webhookForm.provider}
                onChange={(event) =>
                  updateWebhookForm('provider', event.target.value)
                }
                disabled={!canConnectIntegrations}
                required
              />
            </FormField>

            <FormField label="Outbound URL" htmlFor="webhook-url" icon={<Globe2 />}>
              <Input
                id="webhook-url"
                type="url"
                value={webhookForm.outboundWebhookUrl}
                onChange={(event) =>
                  updateWebhookForm('outboundWebhookUrl', event.target.value)
                }
                disabled={!canConnectIntegrations}
                required
              />
            </FormField>

            <FormField
              label={isWebhookEditing ? 'Rotate webhook secret' : 'Webhook secret'}
              htmlFor="webhook-secret"
              icon={<KeyRound />}
            >
              <Input
                id="webhook-secret"
                type="password"
                minLength={8}
                value={webhookForm.webhookSecret}
                onChange={(event) =>
                  updateWebhookForm('webhookSecret', event.target.value)
                }
                disabled={!canConnectIntegrations}
                required={!isWebhookEditing}
                placeholder={isWebhookEditing ? 'Leave empty to keep current secret' : ''}
              />
            </FormField>

            <FormField label="Inbound secret" htmlFor="inbound-secret" icon={<KeyRound />}>
              <Input
                id="inbound-secret"
                type="password"
                minLength={8}
                value={webhookForm.inboundSecret}
                onChange={(event) =>
                  updateWebhookForm('inboundSecret', event.target.value)
                }
                disabled={!canConnectIntegrations}
                placeholder="Optional"
              />
            </FormField>

            <div>
              <Label className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                Events
              </Label>
              <div className="mt-2 grid gap-2">
                {SUPPORTED_WEBHOOK_EVENTS.map((eventType) => (
                  <label
                    key={eventType}
                    className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <span className="text-foreground">{eventType}</span>
                    <input
                      type="checkbox"
                      checked={webhookForm.eventTypes.includes(eventType)}
                      onChange={() => toggleWebhookEvent(eventType)}
                      disabled={!canConnectIntegrations}
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
              <span className="text-sm font-medium text-foreground">Active webhook</span>
              <input
                type="checkbox"
                checked={webhookForm.isActive}
                onChange={(event) =>
                  updateWebhookForm('isActive', event.target.checked)
                }
                disabled={!canConnectIntegrations}
                className="h-4 w-4 accent-primary"
              />
            </label>

            <div>
              <Label htmlFor="webhook-settings">Settings JSON</Label>
              <textarea
                id="webhook-settings"
                value={webhookForm.settingsText}
                onChange={(event) =>
                  updateWebhookForm('settingsText', event.target.value)
                }
                rows={3}
                disabled={!canConnectIntegrations}
                className="mt-2 w-full resize-none rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              />
            </div>

            {(webhookError ||
              createWebhookMutation.error ||
              updateWebhookMutation.error) && (
              <p className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                {webhookError ??
                  createWebhookMutation.error?.message ??
                  updateWebhookMutation.error?.message}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={
                !canConnectIntegrations ||
                createWebhookMutation.isPending ||
                updateWebhookMutation.isPending
              }
            >
              {isWebhookEditing ? <Edit3 /> : <Plus />}
              {isWebhookEditing ? 'Save webhook' : 'Create webhook'}
            </Button>
          </form>

          <div className="border-t border-border">
            {webhooksQuery.isLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : webhooks.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                No webhooks registered yet.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {webhooks.map((webhook) => (
                  <button
                    key={webhook.id}
                    type="button"
                    onClick={() => editWebhook(webhook)}
                    className="w-full px-5 py-4 text-left transition-colors hover:bg-accent"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {webhook.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {webhook.provider} · {webhook.outboundWebhookUrl ?? 'No URL'}
                        </p>
                      </div>
                      <StateBadge enabled={webhook.isActive} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {webhook.eventTypes.length} events · secret{' '}
                      {webhook.hasWebhookSecret ? 'set' : 'missing'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  )
}

function FormField({
  label,
  htmlFor,
  icon,
  children,
}: {
  label: string
  htmlFor: string
  icon: React.ReactNode
  children: React.ReactNode
}): ReactElement {
  return (
    <div>
      <Label htmlFor={htmlFor} className="flex items-center gap-2">
        <span className="text-muted-foreground [&_svg]:h-4 [&_svg]:w-4" aria-hidden="true">
          {icon}
        </span>
        {label}
      </Label>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function StateBadge({ enabled }: { enabled: boolean }): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset',
        enabled
          ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20'
          : 'bg-zinc-500/10 text-zinc-600 ring-zinc-500/20',
      )}
    >
      {enabled ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  )
}

function mergeFeatureRows(features: CompanyFeature[]): CompanyFeature[] {
  const rows = new Map<string, CompanyFeature>()

  for (const feature of features) {
    rows.set(feature.featureKey, feature)
  }

  for (const featureKey of DEFAULT_FEATURE_KEYS) {
    if (!rows.has(featureKey)) {
      rows.set(featureKey, {
        id: featureKey,
        companyId: '',
        featureKey,
        enabled: false,
        config: {},
        updatedByUserId: null,
        enabledAt: null,
        disabledAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
  }

  return [...rows.values()].sort((a, b) =>
    a.featureKey.localeCompare(b.featureKey),
  )
}

function webhookFormToPayload(
  form: WebhookFormState,
): UpsertWebhookRegistrationDto | null {
  const settings = parseJsonObject(form.settingsText)
  if (settings === null) return null

  return {
    name: form.name.trim(),
    provider: form.provider.trim(),
    outboundWebhookUrl: form.outboundWebhookUrl.trim(),
    ...(form.webhookSecret.trim()
      ? { webhookSecret: form.webhookSecret.trim() }
      : {}),
    ...(form.inboundSecret.trim()
      ? { inboundSecret: form.inboundSecret.trim() }
      : {}),
    eventTypes: form.eventTypes,
    isActive: form.isActive,
    settings,
  }
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function formatJson(value: Record<string, unknown>): string {
  return JSON.stringify(value, null, 2)
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'unknown'

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
