/**
 * payment-rules-constructor.ui.test.tsx
 *
 * Component-level tests for <PaymentRulesConstructor />.
 * These tests verify rendering, user interaction, and mutation wiring
 * without hitting any real network or store.
 *
 * Mocked boundaries:
 *  - @/hooks  → all query/mutation hooks return safe defaults
 *  - react-i18next → t(key) returns key (identity translation)
 *  - @/features/payments/payments-ledger → no-op component
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import type { PaymentRule } from '@/api'
import { PaymentRulesConstructor } from './payment-rules-constructor'

// ---------------------------------------------------------------------------
// Mock: react-i18next — return the translation key as the value
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params && Object.keys(params).length > 0) {
        // Interpolate params into key for predictable output in tests
        return Object.entries(params).reduce<string>(
          (acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)),
          key,
        )
      }
      return key
    },
    i18n: { changeLanguage: vi.fn() },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}))

// ---------------------------------------------------------------------------
// Mock: @/i18n  (used directly by module-level i18n.t() calls)
// ---------------------------------------------------------------------------

vi.mock('@/i18n', () => ({
  default: {
    t: (key: string, params?: Record<string, unknown>) => {
      if (params && Object.keys(params).length > 0) {
        return Object.entries(params).reduce<string>(
          (acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)),
          key,
        )
      }
      return key
    },
  },
}))

// ---------------------------------------------------------------------------
// Mock: @/features/payments/payments-ledger — avoid deep rendering
// ---------------------------------------------------------------------------

vi.mock('./payments-ledger', () => ({
  PaymentsLedger: () => null,
}))

// ---------------------------------------------------------------------------
// Mock: @/hooks — all payment / zone hooks return deterministic stubs
// ---------------------------------------------------------------------------

const mockCreate = vi.fn()
const mockUpdate = vi.fn()

vi.mock('@/hooks', () => ({
  usePaymentRules: vi.fn(),
  useZones: vi.fn(),
  useCreatePaymentRule: vi.fn(),
  useUpdatePaymentRule: vi.fn(),
}))

import {
  useCreatePaymentRule,
  usePaymentRules,
  useUpdatePaymentRule,
  useZones,
} from '@/hooks'

function setupDefaultMocks(rules: PaymentRule[] = []): void {
  ;(usePaymentRules as Mock).mockReturnValue({
    data: rules,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })
  ;(useZones as Mock).mockReturnValue({
    data: [
      { id: 'zone-1', name: 'North Zone' },
      { id: 'zone-2', name: 'South Zone' },
    ],
    isLoading: false,
    isError: false,
  })
  ;(useCreatePaymentRule as Mock).mockReturnValue({
    mutate: mockCreate,
    isPending: false,
    error: null,
    reset: vi.fn(),
  })
  ;(useUpdatePaymentRule as Mock).mockReturnValue({
    mutate: mockUpdate,
    isPending: false,
    error: null,
    reset: vi.fn(),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  setupDefaultMocks()
})

// ---------------------------------------------------------------------------
// Helper: render the component
// ---------------------------------------------------------------------------

function renderConstructor(): ReturnType<typeof render> {
  return render(<PaymentRulesConstructor />)
}

// ===========================================================================
// Group 1 — Initial render
// ===========================================================================

describe('PaymentRulesConstructor — initial render', () => {
  it('renders the rule name input', () => {
    renderConstructor()
    expect(screen.getByLabelText('payments.rules.name')).toBeInTheDocument()
  })

  it('renders the rule value input', () => {
    renderConstructor()
    // Value label is dynamic: t('payments.rules.valueLabels.per_order')
    expect(
      screen.getByLabelText('payments.rules.valueLabels.per_order'),
    ).toBeInTheDocument()
  })

  it('renders the Simulate button', () => {
    renderConstructor()
    expect(
      screen.getByRole('button', { name: /payments\.rules\.simulate/i }),
    ).toBeInTheDocument()
  })

  it('renders the Save button for a new rule', () => {
    renderConstructor()
    expect(
      screen.getByRole('button', { name: /payments\.rules\.saveRule/i }),
    ).toBeInTheDocument()
  })

  it('renders the "New rule" button in the header', () => {
    renderConstructor()
    expect(
      screen.getByRole('button', { name: /payments\.rules\.newRule/i }),
    ).toBeInTheDocument()
  })

  it('shows simulation hint before simulate is clicked', () => {
    renderConstructor()
    expect(
      screen.getByText('payments.rules.simulationHintDefault'),
    ).toBeInTheDocument()
  })

  it('renders all 6 rule type cards', () => {
    renderConstructor()
    const typeCards = screen.getAllByRole('button', {
      name: /payments\.rules\.types\./,
    })
    // 6 strip cards + at least the submit button — filter to strip only
    const stripCards = typeCards.filter((el) =>
      el.className.includes('rounded-2xl'),
    )
    expect(stripCards.length).toBeGreaterThanOrEqual(6)
  })
})

// ===========================================================================
// Group 2 — Condition fields visibility per rule type
// ===========================================================================

describe('PaymentRulesConstructor — condition fields by rule type', () => {
  it('per_order: no zone selector, no metric/threshold fields', () => {
    renderConstructor()
    expect(screen.queryByLabelText('payments.rules.labels.zoneMatch')).toBeNull()
    expect(screen.queryByLabelText('payments.rules.metric')).toBeNull()
    expect(screen.queryByLabelText('payments.rules.threshold')).toBeNull()
  })

  it('per_km: no zone selector, no metric/threshold fields', () => {
    renderConstructor()
    // The type <select> shows translated option text; select by the rule-type label id
    const typeSelect = screen.getByLabelText('payments.rules.type') as HTMLSelectElement
    fireEvent.change(typeSelect, { target: { value: 'per_km' } })
    expect(screen.queryByLabelText('payments.rules.labels.zoneMatch')).toBeNull()
    expect(screen.queryByLabelText('payments.rules.metric')).toBeNull()
  })

  it('zone_rate: zone selector appears', () => {
    renderConstructor()
    const typeSelect = screen.getByLabelText('payments.rules.type') as HTMLSelectElement
    fireEvent.change(typeSelect, { target: { value: 'zone_rate' } })
    expect(screen.getByLabelText('payments.rules.labels.zoneMatch')).toBeInTheDocument()
  })

  it('zone_rate: zone selector contains mocked zones', () => {
    renderConstructor()
    const typeSelect = screen.getByLabelText('payments.rules.type') as HTMLSelectElement
    fireEvent.change(typeSelect, { target: { value: 'zone_rate' } })
    expect(screen.getByText('North Zone')).toBeInTheDocument()
    expect(screen.getByText('South Zone')).toBeInTheDocument()
  })

  it('bonus: metric and threshold fields appear', () => {
    renderConstructor()
    const typeSelect = screen.getByLabelText('payments.rules.type') as HTMLSelectElement
    fireEvent.change(typeSelect, { target: { value: 'bonus' } })
    expect(screen.getByLabelText('payments.rules.metric')).toBeInTheDocument()
    expect(screen.getByLabelText('payments.rules.threshold')).toBeInTheDocument()
  })

  it('penalty: metric and threshold fields appear', () => {
    renderConstructor()
    const typeSelect = screen.getByLabelText('payments.rules.type') as HTMLSelectElement
    fireEvent.change(typeSelect, { target: { value: 'penalty' } })
    expect(screen.getByLabelText('payments.rules.metric')).toBeInTheDocument()
    expect(screen.getByLabelText('payments.rules.threshold')).toBeInTheDocument()
  })

  it('minimum_guarantee: period selector appears', () => {
    renderConstructor()
    const typeSelect = screen.getByLabelText('payments.rules.type') as HTMLSelectElement
    fireEvent.change(typeSelect, { target: { value: 'minimum_guarantee' } })
    expect(screen.getByLabelText('payments.rules.guaranteePeriod')).toBeInTheDocument()
  })
})

// ===========================================================================
// Group 3 — Name field
// ===========================================================================

describe('PaymentRulesConstructor — name field', () => {
  it('has a non-empty default name', () => {
    renderConstructor()
    const input = screen.getByLabelText('payments.rules.name') as HTMLInputElement
    expect(input.value.length).toBeGreaterThan(0)
  })

  it('updates name when user types', async () => {
    renderConstructor()
    const input = screen.getByLabelText('payments.rules.name') as HTMLInputElement
    await userEvent.clear(input)
    await userEvent.type(input, 'Custom Rule Name')
    expect(input.value).toBe('Custom Rule Name')
  })
})

// ===========================================================================
// Group 4 — Active checkbox
// ===========================================================================

describe('PaymentRulesConstructor — active toggle', () => {
  it('isActive checkbox is checked by default', () => {
    renderConstructor()
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  it('unchecking isActive unchecks the input', async () => {
    renderConstructor()
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    await userEvent.click(checkbox)
    expect(checkbox.checked).toBe(false)
  })

  it('can be toggled back on after unchecking', async () => {
    renderConstructor()
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    await userEvent.click(checkbox)
    await userEvent.click(checkbox)
    expect(checkbox.checked).toBe(true)
  })
})

// ===========================================================================
// Group 5 — Simulate button
// ===========================================================================

describe('PaymentRulesConstructor — simulation panel', () => {
  it('shows default hint before clicking Simulate', () => {
    renderConstructor()
    expect(screen.getByText('payments.rules.simulationHintDefault')).toBeInTheDocument()
  })

  it('clicking Simulate replaces hint with a result for per_order', async () => {
    renderConstructor()

    const valueInput = screen.getByRole('spinbutton') as HTMLInputElement
    await userEvent.clear(valueInput)
    await userEvent.type(valueInput, '100')

    const simulateBtn = screen.getByRole('button', {
      name: /payments\.rules\.simulate/i,
    })
    await userEvent.click(simulateBtn)

    // Simulation panel should no longer show the placeholder hint
    expect(
      screen.queryByText('payments.rules.simulationHintDefault'),
    ).toBeNull()
  })

  it('simulation result panel appears after clicking Simulate', async () => {
    renderConstructor()
    const simulateBtn = screen.getByRole('button', {
      name: /payments\.rules\.simulate/i,
    })
    await userEvent.click(simulateBtn)

    // The simulation section header is always visible; after simulate the
    // result block (with the label key) should be rendered.
    expect(
      screen.getByText('payments.rules.labels.deliveredPayout'),
    ).toBeInTheDocument()
  })
})

// ===========================================================================
// Group 6 — Submit wires correct mutation
// ===========================================================================

describe('PaymentRulesConstructor — submit mutation wiring', () => {
  it('calls createPaymentRule when form.id is null (new rule)', async () => {
    renderConstructor()
    const form = document.querySelector('form') as HTMLFormElement
    fireEvent.submit(form)
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledOnce()
    })
  })

  it('calls updatePaymentRule when a rule is loaded for editing', async () => {
    const existingRule: PaymentRule = {
      id: 'rule-edit',
      companyId: 'company-1',
      ruleKey: 'per_order_v2',
      name: 'Edit Me',
      ruleType: 'per_order',
      version: 2,
      value: 400,
      conditions: null,
      isActive: true,
      effectiveFrom: null,
      effectiveTo: null,
      changedByUserId: null,
      changeReason: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    setupDefaultMocks([existingRule])
    renderConstructor()

    // Click the rule in the RulesPanel to load it into the form
    const ruleButton = screen.getByRole('button', { name: /Edit Me/i })
    await userEvent.click(ruleButton)

    const form = document.querySelector('form') as HTMLFormElement
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledOnce()
      expect(mockCreate).not.toHaveBeenCalled()
    })
  })
})

// ===========================================================================
// Group 7 — "New rule" button resets form
// ===========================================================================

describe('PaymentRulesConstructor — New rule reset', () => {
  it('clicking "New rule" clears an edited rule back to defaults', async () => {
    const existingRule: PaymentRule = {
      id: 'rule-reset',
      companyId: 'company-1',
      ruleKey: 'zone_rate_v1',
      name: 'Reset Test',
      ruleType: 'zone_rate',
      version: 1,
      value: 150,
      conditions: { zoneId: 'zone-1' },
      isActive: false,
      effectiveFrom: null,
      effectiveTo: null,
      changedByUserId: null,
      changeReason: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    setupDefaultMocks([existingRule])
    renderConstructor()

    // Load the rule into the form
    const ruleButton = screen.getByRole('button', { name: /Reset Test/i })
    await userEvent.click(ruleButton)

    // isActive should now be false (the rule has isActive: false)
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(false)

    // Click "New rule"
    const newRuleBtn = screen.getByRole('button', { name: /payments\.rules\.newRule/i })
    await userEvent.click(newRuleBtn)

    // isActive resets to true (default)
    expect(checkbox.checked).toBe(true)
  })
})

// ===========================================================================
// Group 8 — Error display
// ===========================================================================

describe('PaymentRulesConstructor — error state', () => {
  it('shows mutation error message when createPaymentRule returns an error', () => {
    ;(useCreatePaymentRule as Mock).mockReturnValue({
      mutate: mockCreate,
      isPending: false,
      error: new Error('Server error: 422'),
      reset: vi.fn(),
    })
    ;(useUpdatePaymentRule as Mock).mockReturnValue({
      mutate: mockUpdate,
      isPending: false,
      error: null,
      reset: vi.fn(),
    })

    renderConstructor()
    expect(screen.getByText('Server error: 422')).toBeInTheDocument()
  })

  it('disables Save and Simulate buttons while mutation is pending', () => {
    ;(useCreatePaymentRule as Mock).mockReturnValue({
      mutate: mockCreate,
      isPending: true,
      error: null,
      reset: vi.fn(),
    })

    renderConstructor()

    const simulateBtn = screen.getByRole('button', {
      name: /payments\.rules\.simulate/i,
    })
    const saveBtn = screen.getByRole('button', { name: /common\.saving/i })

    expect(simulateBtn).toBeDisabled()
    expect(saveBtn).toBeDisabled()
  })
})

// ===========================================================================
// Group 9 — Rules panel states
// ===========================================================================

describe('PaymentRulesConstructor — rules panel states', () => {
  it('shows loading skeleton when rules are loading', () => {
    ;(usePaymentRules as Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    })
    renderConstructor()
    // Skeleton elements have animate-pulse class
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows error state and retry button when rules fail to load', () => {
    ;(usePaymentRules as Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    })
    renderConstructor()
    expect(screen.getByText('payments.rules.loadError')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /payments\.rules\.retry/i }),
    ).toBeInTheDocument()
  })

  it('shows empty state when no rules exist', () => {
    setupDefaultMocks([])
    renderConstructor()
    expect(screen.getByText('payments.rules.empty')).toBeInTheDocument()
  })

  it('renders a rule card for each existing rule', () => {
    const rules: PaymentRule[] = [
      {
        id: 'r1',
        companyId: 'c1',
        ruleKey: 'k1',
        name: 'Rule Alpha',
        ruleType: 'per_order',
        version: 1,
        value: 100,
        conditions: null,
        isActive: true,
        effectiveFrom: null,
        effectiveTo: null,
        changedByUserId: null,
        changeReason: null,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'r2',
        companyId: 'c1',
        ruleKey: 'k2',
        name: 'Rule Beta',
        ruleType: 'per_km',
        version: 1,
        value: 15,
        conditions: null,
        isActive: false,
        effectiveFrom: null,
        effectiveTo: null,
        changedByUserId: null,
        changeReason: null,
        createdAt: '',
        updatedAt: '',
      },
    ]
    setupDefaultMocks(rules)
    renderConstructor()
    expect(screen.getByText('Rule Alpha')).toBeInTheDocument()
    expect(screen.getByText('Rule Beta')).toBeInTheDocument()
  })
})

// ===========================================================================
// Group 10 — Header status pills
// ===========================================================================

describe('PaymentRulesConstructor — status pills in header', () => {
  it('shows correct count of active rules', () => {
    const rules: PaymentRule[] = Array.from({ length: 3 }, (_, i) => ({
      id: `r${i}`,
      companyId: 'c1',
      ruleKey: `k${i}`,
      name: `Rule ${i}`,
      ruleType: 'per_order' as const,
      version: 1,
      value: 100,
      conditions: null,
      isActive: i < 2, // 2 active, 1 inactive
      effectiveFrom: null,
      effectiveTo: null,
      changedByUserId: null,
      changeReason: null,
      createdAt: '',
      updatedAt: '',
    }))
    setupDefaultMocks(rules)
    renderConstructor()

    // The active pill shows "2"
    const activePill = screen.getByText('payments.rules.statusPill.active')
    expect(activePill.nextSibling?.textContent).toBe('2')

    // The inactive pill shows "1"
    const inactivePill = screen.getByText('payments.rules.statusPill.inactive')
    expect(inactivePill.nextSibling?.textContent).toBe('1')
  })
})
