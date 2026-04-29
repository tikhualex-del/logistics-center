import { useMemo, useState } from 'react'
import type { FormEvent, ReactElement, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  BadgeDollarSign,
  Calculator,
  CopyPlus,
  Plus,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react'
import type { PaymentRule, PaymentRuleType, UpsertPaymentRuleDto } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import i18n from '@/i18n'
import {
  useCreatePaymentRule,
  usePaymentRules,
  useUpdatePaymentRule,
  useZones,
} from '@/hooks'
import { cn } from '@/lib/utils'
import { PaymentsLedger } from './payments-ledger'

const RULE_TYPE_VALUES: PaymentRuleType[] = [
  'zone_rate',
  'per_km',
  'per_order',
  'bonus',
  'penalty',
  'minimum_guarantee',
]

const METRIC_VALUES = [
  'delivered_orders',
  'completed_routes',
  'distance_km',
  'late_orders',
] as const

const PERIOD_VALUES = ['daily', 'weekly', 'monthly'] as const

const SAMPLE_METRICS = {
  distanceKm: 42,
  deliveredOrders: 18,
  completedRoutes: 6,
  lateOrders: 1,
}

function ruleTypeToCamelCaseKey(type: PaymentRuleType): string {
  const map: Record<PaymentRuleType, string> = {
    zone_rate: 'zoneRate',
    per_km: 'perKilometer',
    per_order: 'perOrder',
    bonus: 'bonus',
    penalty: 'penalty',
    minimum_guarantee: 'minGuarantee',
  }
  return map[type]
}

function metricToCamelCaseKey(metric: string): string {
  const map: Record<string, string> = {
    delivered_orders: 'deliveredOrders',
    completed_routes: 'completedRoutes',
    distance_km: 'distanceKm',
    late_orders: 'lateOrders',
  }
  return map[metric] ?? metric
}

interface RuleFormState {
  id: string | null
  name: string
  ruleType: PaymentRuleType
  value: string
  zoneId: string
  metric: string
  threshold: string
  period: string
  isActive: boolean
  effectiveFrom: string
  effectiveTo: string
  changeReason: string
}

function getDefaultForm(): RuleFormState {
  return {
    id: null,
    name: i18n.t('payments.rules.defaultName'),
    ruleType: 'per_order',
    value: '250',
    zoneId: '',
    metric: 'delivered_orders',
    threshold: '10',
    period: 'weekly',
    isActive: true,
    effectiveFrom: '',
    effectiveTo: '',
    changeReason: '',
  }
}

export function PaymentRulesConstructor(): ReactElement {
  const { t } = useTranslation()
  const [form, setForm] = useState<RuleFormState>(() => getDefaultForm())
  const [simulation, setSimulation] = useState<SimulationResult | null>(null)

  const rulesQuery = usePaymentRules()
  const zonesQuery = useZones()
  const createRuleMutation = useCreatePaymentRule()
  const updateRuleMutation = useUpdatePaymentRule()

  const rules = useMemo(() => rulesQuery.data ?? [], [rulesQuery.data])
  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data])
  const activeRules = rules.filter((rule) => rule.isActive)
  const inactiveRules = rules.length - activeRules.length
  const isEditing = form.id !== null
  const isSaving = createRuleMutation.isPending || updateRuleMutation.isPending
  const saveError = createRuleMutation.error ?? updateRuleMutation.error
  const draftConditions = buildConditions(form)

  const typeCounts = useMemo(() => countRulesByType(rules), [rules])

  function updateForm<Key extends keyof RuleFormState>(
    key: Key,
    value: RuleFormState[Key],
  ): void {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function resetForm(): void {
    setForm(getDefaultForm())
    setSimulation(null)
    createRuleMutation.reset()
    updateRuleMutation.reset()
  }

  function editRule(rule: PaymentRule): void {
    setForm(ruleToForm(rule))
    setSimulation(null)
    createRuleMutation.reset()
    updateRuleMutation.reset()
  }

  function handleSimulate(): void {
    setSimulation(simulateRule(form, zones))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()

    const payload = formToPayload(form)
    if (!payload) {
      setSimulation({
        amount: 0,
        label: t('payments.rules.simulationBlocked'),
        details: t('payments.rules.enterNonNegative'),
        isPositive: false,
      })
      return
    }

    if (form.id) {
      updateRuleMutation.mutate({ id: form.id, data: payload })
    } else {
      createRuleMutation.mutate(payload)
    }
  }

  const selectedTypeKey = ruleTypeToCamelCaseKey(form.ruleType)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-muted/30">
      <header className="shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t('payments.rules.section')}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              {t('payments.rules.title')}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <StatusPill
              label={t('payments.rules.statusPill.active')}
              value={activeRules.length}
            />
            <StatusPill
              label={t('payments.rules.statusPill.inactive')}
              value={inactiveRules}
            />
            <Button type="button" variant="outline" size="sm" onClick={resetForm}>
              <Plus />
              {t('payments.rules.newRule')}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
            <section className="space-y-4">
              <RuleTypeStrip
                selectedType={form.ruleType}
                typeCounts={typeCounts}
                onSelect={(ruleType) => {
                  updateForm('ruleType', ruleType)
                  setSimulation(null)
                }}
              />

            <form
              onSubmit={handleSubmit}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="border-b border-border p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      {t('payments.rules.constructorTitle')}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('payments.rules.constructorHint')}
                    </p>
                  </div>
                  <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                    {isEditing
                      ? t('payments.rules.versionUpdate')
                      : t('payments.rules.newVersionOne')}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                <RuleBlock
                  tone="condition"
                  title={t('payments.rules.conditionSection')}
                  icon={<SlidersHorizontal />}
                >
                  <div className="space-y-4">
                    <FormField label={t('payments.rules.name')} htmlFor="rule-name">
                      <Input
                        id="rule-name"
                        value={form.name}
                        maxLength={120}
                        onChange={(event) => updateForm('name', event.target.value)}
                        required
                      />
                    </FormField>

                    <FormField label={t('payments.rules.type')} htmlFor="rule-type">
                      <select
                        id="rule-type"
                        value={form.ruleType}
                        onChange={(event) =>
                          updateForm('ruleType', event.target.value as PaymentRuleType)
                        }
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {RULE_TYPE_VALUES.map((type) => (
                          <option key={type} value={type}>
                            {t(`payments.rules.types.${ruleTypeToCamelCaseKey(type)}`)}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <ConditionFields form={form} zones={zones} onChange={updateForm} />
                  </div>
                </RuleBlock>

                <div className="hidden items-center justify-center lg:flex">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </div>

                <RuleBlock
                  tone="action"
                  title={t('payments.rules.actionSection')}
                  icon={<BadgeDollarSign />}
                >
                  <div className="space-y-4">
                    <div className="rounded-lg border border-border bg-background p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {t(`payments.rules.actionTitles.${form.ruleType}`)}
                      </p>
                      <p className="mt-2 text-sm text-foreground">
                        {t(`payments.rules.actionDescriptions.${form.ruleType}`)}
                      </p>
                    </div>

                    <FormField
                      label={t(`payments.rules.valueLabels.${form.ruleType}`)}
                      htmlFor="rule-value"
                    >
                      <div className="flex overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
                        <input
                          id="rule-value"
                          type="number"
                          min="0"
                          step="0.0001"
                          value={form.value}
                          onChange={(event) => updateForm('value', event.target.value)}
                          className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none"
                          required
                        />
                        <span className="flex items-center border-l border-border px-3 text-xs font-medium text-muted-foreground">
                          {t(`payments.rules.valueSuffixes.${form.ruleType}`)}
                        </span>
                      </div>
                    </FormField>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField
                        label={t('payments.rules.effectiveFrom')}
                        htmlFor="effective-from"
                      >
                        <Input
                          id="effective-from"
                          type="datetime-local"
                          value={form.effectiveFrom}
                          onChange={(event) =>
                            updateForm('effectiveFrom', event.target.value)
                          }
                        />
                      </FormField>
                      <FormField
                        label={t('payments.rules.effectiveTo')}
                        htmlFor="effective-to"
                      >
                        <Input
                          id="effective-to"
                          type="datetime-local"
                          value={form.effectiveTo}
                          onChange={(event) =>
                            updateForm('effectiveTo', event.target.value)
                          }
                        />
                      </FormField>
                    </div>

                    <label className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                      <span className="text-sm font-medium text-foreground">
                        {t('payments.rules.activeRule')}
                      </span>
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(event) =>
                          updateForm('isActive', event.target.checked)
                        }
                        className="h-4 w-4 accent-primary"
                      />
                    </label>
                  </div>
                </RuleBlock>
              </div>

              <div className="border-t border-border p-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                  <div>
                    <Label htmlFor="change-reason">
                      {t('payments.rules.changeReason')}
                    </Label>
                    <textarea
                      id="change-reason"
                      value={form.changeReason}
                      onChange={(event) =>
                        updateForm('changeReason', event.target.value)
                      }
                      maxLength={255}
                      rows={3}
                      className="mt-2 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder={t('payments.rules.changeReasonHint')}
                    />
                  </div>

                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {t('payments.rules.draftPayload')}
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {t(`payments.rules.types.${selectedTypeKey}`)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('payments.rules.conditionsLabel')}{' '}
                      {formatConditions(draftConditions)}
                    </p>
                  </div>
                </div>

                {saveError !== null && (
                  <p className="mt-4 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                    {saveError.message}
                  </p>
                )}

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSimulate}
                    disabled={isSaving}
                  >
                    <Calculator />
                    {t('payments.rules.simulate')}
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isEditing ? <CopyPlus /> : <Plus />}
                    {isSaving
                      ? t('common.saving')
                      : isEditing
                        ? t('payments.rules.createVersion')
                        : t('payments.rules.saveRule')}
                  </Button>
                </div>
              </div>
            </form>
            </section>

            <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
              <SimulationPanel simulation={simulation} />
              <RulesPanel
                rules={rules}
                isLoading={rulesQuery.isLoading}
                isError={rulesQuery.isError}
                onRetry={() => void rulesQuery.refetch()}
                onEdit={editRule}
              />
            </aside>
          </div>

          <PaymentsLedger />
        </div>
      </main>
    </div>
  )
}

function RuleTypeStrip({
  selectedType,
  typeCounts,
  onSelect,
}: {
  selectedType: PaymentRuleType
  typeCounts: Map<PaymentRuleType, number>
  onSelect: (type: PaymentRuleType) => void
}): ReactElement {
  const { t } = useTranslation()
  return (
    <section className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
      {RULE_TYPE_VALUES.map((type) => {
        const key = ruleTypeToCamelCaseKey(type)
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={cn(
              'rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent',
              selectedType === type
                ? 'border-primary ring-1 ring-primary/20'
                : 'border-border',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground">
                {t(`payments.rules.types.${key}`)}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
                {typeCounts.get(type) ?? 0}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
              {t(`payments.rules.actionTitles.${type}`)}
            </p>
          </button>
        )
      })}
    </section>
  )
}

function RuleBlock({
  tone,
  title,
  icon,
  children,
}: {
  tone: 'condition' | 'action'
  title: string
  icon: ReactNode
  children: ReactNode
}): ReactElement {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4',
        tone === 'condition'
          ? 'border-sky-500/25 bg-sky-500/5'
          : 'border-emerald-500/25 bg-emerald-500/5',
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <span
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg text-white [&_svg]:h-4 [&_svg]:w-4',
            tone === 'condition' ? 'bg-sky-600' : 'bg-emerald-600',
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
          {title}
        </h3>
      </div>
      {children}
    </div>
  )
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}): ReactElement {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function ConditionFields({
  form,
  zones,
  onChange,
}: {
  form: RuleFormState
  zones: Array<{ id: string; name: string }>
  onChange: <Key extends keyof RuleFormState>(
    key: Key,
    value: RuleFormState[Key],
  ) => void
}): ReactElement {
  const { t } = useTranslation()

  if (form.ruleType === 'zone_rate') {
    return (
      <FormField label={t('payments.rules.labels.zoneMatch')} htmlFor="zone-id">
        <select
          id="zone-id"
          value={form.zoneId}
          onChange={(event) => onChange('zoneId', event.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          required
        >
          <option value="">{t('payments.rules.selectZone')}</option>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.name}
            </option>
          ))}
        </select>
      </FormField>
    )
  }

  if (form.ruleType === 'bonus' || form.ruleType === 'penalty') {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label={t('payments.rules.metric')} htmlFor="metric">
          <select
            id="metric"
            value={form.metric}
            onChange={(event) => onChange('metric', event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {METRIC_VALUES.map((metric) => (
              <option key={metric} value={metric}>
                {t(`payments.rules.metrics.${metricToCamelCaseKey(metric)}`)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label={t('payments.rules.threshold')} htmlFor="threshold">
          <Input
            id="threshold"
            type="number"
            min="0"
            step="0.0001"
            value={form.threshold}
            onChange={(event) => onChange('threshold', event.target.value)}
            required
          />
        </FormField>
      </div>
    )
  }

  if (form.ruleType === 'minimum_guarantee') {
    return (
      <FormField label={t('payments.rules.guaranteePeriod')} htmlFor="period">
        <select
          id="period"
          value={form.period}
          onChange={(event) => onChange('period', event.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {PERIOD_VALUES.map((period) => (
            <option key={period} value={period}>
              {t(`payments.rules.periods.${period}`)}
            </option>
          ))}
        </select>
      </FormField>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
      {t('payments.rules.conditionsEveryRoute')}
    </div>
  )
}

interface SimulationResult {
  amount: number
  label: string
  details: string
  isPositive: boolean
}

function SimulationPanel({
  simulation,
}: {
  simulation: SimulationResult | null
}): ReactElement {
  const { t } = useTranslation()
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Calculator className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {t('payments.rules.simulation')}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t('payments.rules.simulationHint')}
          </p>
        </div>
      </div>

      {simulation === null ? (
        <div className="mt-5 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          {t('payments.rules.simulationHintDefault')}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {simulation.label}
          </p>
          <p
            className={cn(
              'mt-2 text-3xl font-semibold tabular-nums',
              simulation.isPositive ? 'text-emerald-700' : 'text-foreground',
            )}
          >
            {formatMoney(simulation.amount)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {simulation.details}
          </p>
        </div>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <SampleMetric
          label={t('payments.rules.sampleOrders')}
          value={SAMPLE_METRICS.deliveredOrders}
        />
        <SampleMetric
          label={t('payments.rules.sampleDistance')}
          value={`${SAMPLE_METRICS.distanceKm} ${t('payments.rules.valueSuffix.rubPerKm').replace('₽/', '')}`}
        />
        <SampleMetric
          label={t('payments.rules.sampleRoutes')}
          value={SAMPLE_METRICS.completedRoutes}
        />
        <SampleMetric
          label={t('payments.rules.sampleLate')}
          value={SAMPLE_METRICS.lateOrders}
        />
      </dl>
    </section>
  )
}

function SampleMetric({
  label,
  value,
}: {
  label: string
  value: string | number
}): ReactElement {
  return (
    <div className="rounded-lg bg-muted px-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-semibold text-foreground tabular-nums">
        {value}
      </dd>
    </div>
  )
}

function RulesPanel({
  rules,
  isLoading,
  isError,
  onRetry,
  onEdit,
}: {
  rules: PaymentRule[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onEdit: (rule: PaymentRule) => void
}): ReactElement {
  const { t } = useTranslation()
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border p-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {t('payments.rules.currentRules')}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('payments.rules.currentRulesHint')}
          </p>
        </div>
        {isError && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent"
            aria-label={t('payments.rules.retry')}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-5 text-sm text-muted-foreground">
          {t('payments.rules.loadError')}
        </div>
      ) : rules.length === 0 ? (
        <div className="p-5 text-sm text-muted-foreground">
          {t('payments.rules.empty')}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {rules.map((rule) => (
            <button
              key={rule.id}
              type="button"
              onClick={() => onEdit(rule)}
              className="w-full px-5 py-4 text-left transition-colors hover:bg-accent"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {rule.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(`payments.rules.types.${ruleTypeToCamelCaseKey(rule.ruleType)}`)}{' '}
                    · {t('payments.rules.versionShort', { version: rule.version })}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2 py-1 text-[11px] font-semibold',
                    rule.isActive
                      ? 'bg-emerald-500/10 text-emerald-700'
                      : 'bg-zinc-500/10 text-zinc-600',
                  )}
                >
                  {rule.isActive ? t('common.active') : t('common.inactive')}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">
                  {formatConditions(rule.conditions)}
                </span>
                <span className="font-semibold text-foreground">
                  {formatMoney(rule.value)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function StatusPill({
  label,
  value,
}: {
  label: string
  value: number
}): ReactElement {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
      <span>{label}</span>
      <span className="font-semibold text-foreground tabular-nums">{value}</span>
    </span>
  )
}

function countRulesByType(rules: PaymentRule[]): Map<PaymentRuleType, number> {
  const counts = new Map<PaymentRuleType, number>()

  for (const rule of rules) {
    counts.set(rule.ruleType, (counts.get(rule.ruleType) ?? 0) + 1)
  }

  return counts
}

function buildConditions(form: RuleFormState): Record<string, unknown> | null {
  if (form.ruleType === 'zone_rate') {
    return form.zoneId ? { zoneId: form.zoneId } : null
  }

  if (form.ruleType === 'bonus' || form.ruleType === 'penalty') {
    const threshold = Number(form.threshold)
    return form.metric && Number.isFinite(threshold)
      ? { metric: form.metric, threshold }
      : null
  }

  if (form.ruleType === 'minimum_guarantee') {
    return { period: form.period }
  }

  return null
}

function formToPayload(form: RuleFormState): UpsertPaymentRuleDto | null {
  const value = Number(form.value)
  if (!form.name.trim() || !Number.isFinite(value) || value < 0) return null

  const conditions = buildConditions(form)
  if (requiresConditions(form.ruleType) && conditions === null) return null

  return {
    name: form.name.trim(),
    ruleType: form.ruleType,
    value,
    conditions,
    isActive: form.isActive,
    changeReason: form.changeReason.trim() || null,
    effectiveFrom: toIsoDateTime(form.effectiveFrom),
    effectiveTo: toIsoDateTime(form.effectiveTo),
  }
}

function ruleToForm(rule: PaymentRule): RuleFormState {
  const conditions = rule.conditions ?? {}

  return {
    id: rule.id,
    name: rule.name,
    ruleType: rule.ruleType,
    value: String(rule.value),
    zoneId: readString(conditions.zoneId),
    metric: readString(conditions.metric) || 'delivered_orders',
    threshold:
      typeof conditions.threshold === 'number' ? String(conditions.threshold) : '10',
    period: readString(conditions.period) || 'weekly',
    isActive: rule.isActive,
    effectiveFrom: toInputDateTime(rule.effectiveFrom),
    effectiveTo: toInputDateTime(rule.effectiveTo),
    changeReason: rule.changeReason ?? '',
  }
}

function simulateRule(
  form: RuleFormState,
  zones: Array<{ id: string; name: string }>,
): SimulationResult {
  const value = Number(form.value)
  if (!Number.isFinite(value) || value < 0) {
    return {
      amount: 0,
      label: i18n.t('payments.rules.invalidAction'),
      details: i18n.t('payments.rules.enterNonNegative'),
      isPositive: false,
    }
  }

  switch (form.ruleType) {
    case 'zone_rate': {
      const zone = zones.find((item) => item.id === form.zoneId)
      return {
        amount: form.zoneId ? value : 0,
        label: i18n.t('payments.rules.labels.zoneMatch'),
        details: form.zoneId
          ? zone
            ? i18n.t('payments.rules.simulationDetails.zoneMatchSelected', {
                zone: zone.name,
              })
            : i18n.t('payments.rules.simulationDetails.zoneMatchDefault')
          : i18n.t('payments.rules.simulationDetails.zoneMatchEmpty'),
        isPositive: form.zoneId.length > 0,
      }
    }
    case 'per_km':
      return {
        amount: value * SAMPLE_METRICS.distanceKm,
        label: i18n.t('payments.rules.labels.distancePayout'),
        details: i18n.t('payments.rules.simulationDetails.distancePayout', {
          distance: SAMPLE_METRICS.distanceKm,
          rate: formatMoney(value),
        }),
        isPositive: true,
      }
    case 'per_order':
      return {
        amount: value * SAMPLE_METRICS.deliveredOrders,
        label: i18n.t('payments.rules.labels.deliveredPayout'),
        details: i18n.t('payments.rules.simulationDetails.deliveredPayout', {
          orders: SAMPLE_METRICS.deliveredOrders,
          rate: formatMoney(value),
        }),
        isPositive: true,
      }
    case 'bonus':
    case 'penalty': {
      const metricValue = getSampleMetricValue(form.metric)
      const threshold = Number(form.threshold)
      const passes = Number.isFinite(threshold) && metricValue >= threshold
      const amount = passes ? value : 0
      return {
        amount: form.ruleType === 'penalty' ? -amount : amount,
        label: passes
          ? i18n.t('payments.rules.labels.thresholdReached')
          : i18n.t('payments.rules.labels.thresholdNotReached'),
        details: i18n.t('payments.rules.simulationDetails.thresholdDetails', {
          metric: formatMetricLabel(form.metric),
          value: metricValue,
          threshold:
            form.threshold ||
            i18n.t('payments.rules.simulationDetails.thresholdNotSet'),
        }),
        isPositive: passes && form.ruleType === 'bonus',
      }
    }
    case 'minimum_guarantee':
      return {
        amount: value,
        label: i18n.t('payments.rules.labels.guaranteedFloor'),
        details: i18n.t('payments.rules.simulationDetails.guaranteeDetails', {
          value: formatMoney(value),
          period: i18n.t(`payments.rules.periods.${form.period}`),
        }),
        isPositive: true,
      }
  }
}

function requiresConditions(type: PaymentRuleType): boolean {
  return type === 'zone_rate' || type === 'bonus' || type === 'penalty' || type === 'minimum_guarantee'
}

function getSampleMetricValue(metric: string): number {
  if (metric === 'completed_routes') return SAMPLE_METRICS.completedRoutes
  if (metric === 'distance_km') return SAMPLE_METRICS.distanceKm
  if (metric === 'late_orders') return SAMPLE_METRICS.lateOrders
  return SAMPLE_METRICS.deliveredOrders
}

function formatMetricLabel(metric: string): string {
  return i18n.t(`payments.rules.metrics.${metricToCamelCaseKey(metric)}`, {
    defaultValue: metric,
  })
}

function formatConditions(conditions: Record<string, unknown> | null): string {
  if (conditions === null || Object.keys(conditions).length === 0) {
    return i18n.t('payments.rules.noConditionFields')
  }

  return Object.entries(conditions)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(', ')
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

function toIsoDateTime(value: string): string | null {
  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function toInputDateTime(value: string | null): string {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
