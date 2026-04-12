# Logistics Center — Companies Domain

## 1. Goal of the module

The `companies` module defines the tenant root of the Logistics Center platform.

A **Company** is a SaaS client account and an isolated tenant inside the platform.
All core business data in the system belongs to a company.

This module is responsible for:
- creating and managing tenant companies
- storing company-level base settings
- controlling company lifecycle state
- linking a company to a plan
- providing a root reference for all other company-owned modules

This module is **not** responsible for:
- authentication
- company users management in depth
- warehouses
- zones
- integrations implementation
- payout formulas
- statuses configuration
- non-delivery reasons
- analytics
- billing engine

Those belong to separate modules.

---

## 2. Company definition

**Company** is a fully isolated tenant in the multi-tenant SaaS platform.

Inside a company live:
- users
- couriers
- orders
- routes
- shifts
- warehouses / origin points
- settings
- integrations
- analytics context
- operational configuration

Each user belongs to exactly one company.

Company is the root tenant entity for all company-level modules.

---

## 3. Who can create a company

In MVP:
- only **super-admin** can create a company

Self-registration is not part of MVP.

---

## 4. Company base fields

The following fields are required at the domain level.

### Identity
- `id`
- `name`
- `slug`

### Lifecycle
- `status`

### Base settings
- `timezone`
- `defaultCurrency`
- `language`
- `country`

### Business contacts
- `contactEmail`
- `contactPhone`

### Commercial
- `planId`

### Audit dates
- `createdAt`
- `updatedAt`

---

## 5. Company branding

Branding is **not required in MVP**.

The following are not part of the first version of the module:
- logo
- primary color
- branded login page
- white-label branding layer

This can be added later if needed.

---

## 6. Company statuses

The company lifecycle must support the following statuses:

- `active`
- `inactive`
- `suspended`
- `trial`
- `pending_setup`
- `archived`

### Meaning of statuses

#### `active`
Company is operational:
- users can log in
- integrations can work
- platform features are available according to company plan and enabled features

#### `inactive`
Company exists, but is not active:
- users cannot log in
- integrations are stopped
- data is preserved
- super-admin can still access the company

#### `suspended`
Company is temporarily blocked by platform decision:
- users cannot log in
- integrations are stopped
- data is preserved
- super-admin can still access the company

#### `trial`
Company is in trial mode:
- can operate with trial restrictions
- future rules can depend on plan and feature flags

#### `pending_setup`
Company is created, but not yet fully configured:
- may be visible to super-admin
- not yet ready for full operational use

#### `archived`
Company is archived:
- no operational access for company users
- data remains in system
- available to super-admin for review/audit
- hard delete is forbidden

---

## 7. Status effects

When company status is not operational (`inactive`, `suspended`, `archived`):
- company users cannot log in
- company integrations must stop
- company data must not be deleted
- super-admin still sees the company

This rule must be respected across the platform.

---

## 8. Company root responsibility

The `Company` entity should only contain tenant-root data.

### Company root includes:
- tenant identity
- lifecycle state
- base company settings
- contact fields
- plan reference
- future feature flags reference/capability

### Company root does NOT include as direct fields:
- users
- warehouses
- zones
- transports
- payout formulas
- integrations
- business statuses
- reasons of non-delivery

These are separate entities/modules linked to company.

---

## 9. Actions required in MVP

The following operations are required for MVP:

- create company
- view company list
- view company card/details
- update base company data
- change company status
- assign/change company plan
- change timezone
- change currency
- change language
- archive company (soft delete only)
- impersonate as company admin

### Forbidden action
- hard delete is not allowed

---

## 10. Access model

### Super-admin can:
- create company
- view all companies
- view company details
- update all company base fields
- change status
- assign/change plan
- archive company
- impersonate company admin
- see platform-level company context

### Company owner can:
- update allowed company-level business fields such as:
  - name
  - timezone
  - currency
  - language
  - contact fields

### Company owner cannot:
- change platform-level/system fields such as:
  - company status
  - plan assignment
  - platform-level flags controlled only by super-admin

Final permission mapping will belong to auth/users/permissions design later.

---

## 11. Audit requirements

Changes to company data must be auditable.

Minimum audit expectation:
- who changed company status
- who changed plan
- who changed timezone
- who changed currency
- who changed language
- who changed company name

This should be supported through common audit log mechanisms, not through a special isolated logging design for this module.

---

## 12. Plan model

At the `Company` level, MVP only needs:
- a reference to a `plan`

Billing logic and limit enforcement are not part of this module yet.

This means:
- company stores `planId`
- plan details/limits can be designed later in platform/billing context

---

## 13. Localization and defaults

Correct base model for MVP:

- company has one default currency
- company has one default language
- company has one default timezone

The platform itself should remain:
- multilingual
- multicurrency-capable
- multi-timezone-capable

But the company root stores one primary default value for each.

---

## 14. Feature flags / feature toggles

Company-level feature toggles should be considered part of the domain design.

Examples for future use:
- urgent delivery enabled / disabled
- map enabled / disabled
- payouts enabled / disabled
- third-party delivery enabled / disabled
- integrations enabled / disabled

### Important
Feature flags are part of the future architecture direction,
but they are **not required to be fully implemented in MVP**.

For now, the domain should be designed so this can be added later without breaking the company model.

---

## 15. Relationship to other modules

The `companies` module is the tenant root for future modules:

- users
- auth
- warehouses
- couriers
- orders
- routes
- shifts
- payouts
- integrations
- analytics
- notifications

Each of these modules must later reference company as the owner tenant.

---

## 16. Design principles for implementation

When implementing the `companies` module, the following principles must be preserved:

1. Company is tenant root, not a dump for all settings
2. Company must stay small and clean
3. Separate domain entities must not be collapsed into Company fields
4. Company status must have real platform behavior
5. Hard delete is forbidden
6. Future feature toggles must be possible
7. Company must be usable by other modules as stable tenant foundation

---

## 17. Success criteria of correct design

The `companies` domain is considered designed correctly if:

1. A tenant company can be created
2. Company lifecycle can be managed through statuses
3. Base company settings can be stored cleanly
4. Company root is not overloaded with unrelated entities
5. Other modules can reliably reference company as tenant root