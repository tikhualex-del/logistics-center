# Logistics Center — Foundation

## 1. Project Overview

**Logistics Center** is a commercial multi-tenant SaaS platform for companies with their own in-house delivery operations.

The product is intended for:
- retail chains
- e-commerce companies
- flower delivery
- food delivery
- pharmacy delivery
- other businesses with their own couriers and logistics staff

The system must help companies manage the full logistics operation through a single platform:
- order intake from external systems
- operational dispatching
- courier assignment
- route building and control
- SLA tracking
- delivery cost calculation
- courier payout calculation
- operational analytics
- management analytics
- integration with CRM / ERP / other external systems

The product must be designed from the beginning as a **secure multi-tenant SaaS platform** with strict company isolation.

---

## 2. Product Type

- **Type:** Commercial B2B SaaS
- **Architecture type:** Multi-tenant
- **Access model:** Web admin platform first
- **Courier mobile app:** Later
- **Courier app foundation:** API-ready from the beginning
- **Primary operating mode in MVP:** Office logistics operations

---

## 3. Primary Target Segment for First Version

The first version is focused primarily on:

**Companies with their own store-based delivery operations**

Examples:
- store chains
- local retail networks
- dark stores
- pharmacies
- food businesses
- flower businesses

The system is not initially focused on marketplace logistics or external courier aggregation as the main use case.

---

## 4. Core Business Problems the Product Solves

The first version of the product is intended to solve these main problems:

1. Weak integration with CRM / ERP / external order sources
2. Poor visibility and analytics for business owners and heads of logistics
3. Manual courier payout calculation
4. Chaos in order operations and dispatching

---

## 5. Main Users in MVP

### Primary user #1
**Business Owner**
- full visibility into operations
- full access to company data
- access to analytics, costs, SLA, efficiency

### Primary user #2
**Head of Logistics**
- full operational control
- access to all logistics processes
- can manage all operational data and settings related to logistics

### Other users
**Dispatcher / Logistician**
- works with all orders
- manually assigns couriers
- builds routes
- controls execution
- handles operational exceptions

**Courier**
- belongs to one company
- sees only own work context
- in future should work through dedicated interface / mobile workflow
- in MVP full courier product is not included

### Platform-level user
**Super Admin (SaaS owner/operator)**
- creates companies
- sees all companies
- manages plans/tariffs
- enables/disables integrations
- can impersonate company admin
- views system logs

---

## 6. Multi-Tenant Principles

The system must be built with strict tenant isolation.

### Tenant = Company

Each user always belongs to exactly **one company**.

Each company has its own:
- users
- roles and permissions
- orders
- couriers
- dispatchers/logistics staff
- routes
- warehouses / stores / dark stores / points of origin
- settings
- zones
- SLA rules
- payout formulas
- integrations
- plans/tariffs
- currencies
- timezone settings
- transport settings
- statuses and display settings

### Isolation rules
- company data must never mix with another company’s data
- user from company A must never see company B
- each company has its own integrations
- each courier belongs to one company

---

## 7. Access Model and Roles

The access system must support **configurable company roles**, but foundation should rely on:

- system roles / core access model
- permissions-based access control
- company-level role customization

### Base role groups
- Business Owner
- Head of Logistics
- Dispatcher / Logistician
- Courier
- Super Admin

### Base access assumptions
- Business Owner: full company access
- Head of Logistics: full operational access, can edit all logistics-related data
- Dispatcher: sees all company orders and works operationally
- Courier: sees only own orders, own current route, and own history
- Super Admin: platform-level access

### Recommended model
- core permissions in the system
- company-configurable role composition on top of those permissions

---

## 8. Core Operational Scope of MVP

The first working contour of the product must include:

1. Accept orders from external systems
2. Show orders to logistics staff
3. Allow dispatcher/logistician to manually assign couriers
4. Allow dispatcher/logistician to manually build routes
5. Track operational delivery status
6. Calculate SLA
7. Calculate courier payouts
8. Show core operational and management analytics
9. Show order and route data on a map

---

## 9. What Is Explicitly Out of Scope for Initial MVP

These areas are intentionally not part of the first version:

- full courier mobile application
- AI assistant implementation
- advanced route optimization engine
- advanced motivation / KPI system for couriers and logisticians
- document/file workflows
- proof-of-delivery workflows (photo, signature, etc.) as core MVP functionality
- complex push/SMS notification system
- full geotracking implementation if not required for day-1 MVP launch

These can be added later on top of the core foundation.

---

## 10. Main Domain Entities

The foundation must be built around the following core entities.

### 10.1 Company
Represents a tenant in the SaaS platform.

Owns:
- users
- couriers
- orders
- routes
- shifts
- warehouses / origin points
- settings
- integrations
- zones
- payout rules
- SLA rules
- currencies
- timezone
- plans

### 10.2 User
A system user belonging to exactly one company.

Can be:
- business owner
- head of logistics
- dispatcher / logistician
- courier-facing office user if needed
- other configurable company role
- super admin at platform level

### 10.3 Courier
Operational delivery performer.

Must support:
- different employment models:
  - staff employee
  - contractor / self-employed / external equivalent
- different transport types
- transport capacity
- shifts
- payout rules
- order history
- route assignment

### 10.4 Warehouse / Store / Origin Point
Point from which an order starts.

A company can have multiple such points:
- warehouse
- store
- dark store
- pharmacy
- restaurant
- hub
- other origin point types

Every order must be linked to a point of origin.

### 10.5 Order
Core business delivery object.

Critical order fields for MVP:
- customer
- address
- delivery time window
- comment
- priority
- product type
- weight / volume
- number of packages / places
- order status
- source system
- origin point
- payment-related state if available
- delivery cost context

An order may include:
- one or multiple stops
- return scenarios
- partial delivery
- repeated delivery
- combined logistics scenarios

### 10.6 Order Stop
Represents a delivery/return/logistics point inside an order.

Needed because:
- one order can have multiple delivery points
- one order can include combined scenarios
- multi-stop support is required from the foundation level

### 10.7 Route
Operational object created by dispatcher/logistician.

A route:
- contains multiple orders and/or stops
- is manually built in MVP
- is assigned to one courier
- has lifecycle statuses
- is shown on the map
- is the main execution unit for operational delivery control

### 10.8 Shift
Represents courier working period.

Needed in foundation because:
- courier working logic may depend on company
- workload and payout can depend on shift
- later analytics depends on it

### 10.9 Payout
Represents courier payout calculation.

Must support:
- preliminary calculation
- final calculation for a period
- breakdown of calculation
- manual adjustment
- export to Excel/CSV
- paid / unpaid status

### 10.10 SLA Rule
Represents service-level target logic.

Must support:
- promised delivery interval
- zone-based SLA logic
- overdue identification
- in-time vs late analytics

### 10.11 Zone
Geographic or operational zone used for:
- routing context
- SLA calculation
- filtering
- operational grouping

### 10.12 Integration
Represents connection to external systems.

Must support:
- multiple integrations per company
- UI-managed configuration
- inbound and outbound synchronization
- CRM / ERP / API / import workflows

### 10.13 Audit Log
Stores important change history:
- status changes
- courier reassignment
- route changes
- settings changes
- other critical actions

---

## 11. Order Sources

Orders can enter the system from:
- CRM
- ERP
- manual entry by dispatcher/logistician
- CSV / Excel import
- API

The foundation must support multiple sources from the beginning.

---

## 12. Order Model Rules

### Critical order attributes for MVP
- customer data
- delivery address
- delivery time window
- comment
- priority
- product type
- weight / volume
- package count
- order status
- origin point

### Advanced order logic required from foundation
- multiple stops inside one order
- return handling
- partial delivery support
- repeated delivery support
- combined scenarios

---

## 13. Route Model Rules

### Route in MVP
- manually assembled by dispatcher/logistician
- no complex optimization engine in first version
- basic suggestions can exist later
- route is map-visible
- route has lifecycle states

### Base route statuses
- Draft
- Built
- Issued to courier
- In Progress
- Completed
- Cancelled

---

## 14. Order Status Model

The system must support **two levels of statuses**:

### 14.1 Core system statuses
System-required statuses needed for platform logic, analytics, routing, SLA, and integrations.

### 14.2 Company-facing business statuses
Each company may configure:
- own visible business statuses
- display labels
- colors
- mapping to their existing workflow
- alignment with statuses in their current system

### Example business flow provided for foundation context
- New
- Awaiting Payment
- Special Approval
- Sent to Assembly
- Assembled
- Courier Assigned
- Delivering
- Return
- Completed

The platform should not rely only on display labels. It must rely on system-level status semantics.

---

## 15. Assignment Rules

In MVP:
- courier assignment is done **manually by dispatcher/logistician only**
- reassignment must be supported
- manual operational control is the main model

No auto-assignment should be considered core MVP functionality.

---

## 16. Source of Truth Model

The system uses a **mixed source of truth** model.

### CRM / external source controls:
- customer data
- address
- delivery time window
- order composition
- payment-related information
- source-side business data

### Logistics Center controls:
- courier assignment
- route composition
- delivery execution statuses
- SLA calculation
- payout calculation
- logistics comments
- operational state of execution

### Synchronization rule
If CRM updates the order:
- update Logistics Center automatically if order is not yet issued to courier
- once the order is already in execution, critical logistics data must be protected
- if address changes during active delivery, logistician must have a way to manually apply the new address for courier visibility where operationally needed

This model must be designed carefully from the backend foundation stage.

---

## 17. External Delivery Support

The foundation must support both:
- own couriers
- external / third-party delivery

This is required because business wants to compare:
- internal delivery cost
- external delivery cost
- courier payout
- logistics overhead
- system cost
- cost per order

---

## 18. Delivery Cost Model

For MVP, delivery cost must be understood as the company-side cost of fulfilling the order.

It may include:
- courier payout cost
- logistics staff operational cost
- system/platform cost
- external delivery cost if a third party is used

The system foundation must allow cost calculation and later extension of cost model without redesign.

---

## 19. Courier Payout Model

The payout system must support different company models.

Required support from foundation:
- mixed payout models
- payout per delivered order
- payout per kilometer
- company-specific formulas
- manual adjustment
- period closing
- paid / unpaid tracking
- export to Excel/CSV

Because payout logic varies by company, formulas must be configurable.

---

## 20. Shifts and Transport

### Shift support
Shift is required from foundation level.

Reason:
- company-specific courier work models
- operational scheduling
- workload analytics
- payout linkage

### Transport support
Courier transport must include:
- transport type
- transport capacity

Examples:
- on foot
- car
- bicycle
- scooter / moped
- other

This is important for:
- operations
- route logic
- analytics
- payout rules

---

## 21. Zones and Time Slots

The system must support company-level configuration of:
- delivery zones
- time slots
- zone-based SLA logic

Zones are required from MVP.

---

## 22. Analytics Scope

### Core management metrics identified
- number of orders
- % delivered on time
- average delivery time
- number of returns
- courier workload
- delivery cost
- cost per order
- SLA by zone
- overdue orders
- dispatcher / logistician efficiency

### Analytics dimensions needed
- current day
- days
- weeks
- months
- filters by:
  - zone
  - courier
  - logistician
  - source
- export support

### MVP note
Full advanced analytics may evolve later, but foundation must allow it from the beginning.

---

## 23. Map Requirement

The map is **mandatory in MVP**.

The map must be considered a first-class product surface, not a later add-on.

At minimum, the map must support future visibility of:
- orders
- routes
- courier-related operational objects
- status-based display markers / pins

Company-level configuration of map pin/icon display is planned for future configurability.

---

## 24. Notifications

### Critical notification need for MVP
- notify logistician about new orders

### Future notification scope
- SLA risk notifications for logistics
- route assignment notifications for courier
- critical incident notifications for business
- email
- in-app
- push/SMS later

In MVP, new order notification for logistician is the most critical.

---

## 25. Courier-Facing Product Scope

In MVP:
- Logistics Center is primarily an office product
- no full courier app is included
- no full courier mobile workflow yet

However, the backend must be API-ready for future courier application.

---

## 26. Audit and Security

Security is a core requirement from the beginning.

### Authentication
Must support:
- email + password
- OAuth

### Security expectations
- strong tenant isolation
- secure user access control
- safe integration handling
- company-safe data separation
- auditability of important actions

### Audit log required in MVP
Minimum audit trail must include:
- who changed order status
- who reassigned courier
- who changed route
- who changed settings

---

## 27. Company-Level Configurability

The following items are required to be configurable by company, ideally through UI:

- users
- roles and permissions
- zones
- time slots
- non-delivery reasons
- SLA rules
- payout formulas
- integrations
- warehouses / stores / origin points
- currency
- timezone
- transport types
- business-visible statuses
- status colors
- map display icons / pins

Not all of this must be fully available on day 1, but the foundation must allow it.

---

## 28. Integrations

The platform must support multiple integrations per company.

### Required capabilities
- CRM inbound sync
- ERP / external source support
- API-based integration
- CSV / Excel import
- outbound sync back to CRM
- UI-based integration setup
- no developer dependency for routine connection setup by clients

### Data that must be synced back to CRM
- delivery statuses
- assigned courier
- delivery-related cost data
- other logistics execution data later

### Direction
Integration model must support **bidirectional communication**.

---

## 29. Global Product Readiness Requirements

The system must be designed from the beginning for:
- multilingual support
- multicurrency support
- multiple timezones

These are not optional future ideas; they are foundational product requirements.

---

## 30. MVP Success Criteria

The first version will be considered useful if the following are true:

1. Logistician works in one system
2. Courier payouts are calculated automatically
3. Integration with CRM works reliably

These are primary proof points for MVP value.

---

## 31. Recommended Technical Direction for Start

For the start of development, the recommended architecture direction is:

- **modular monolith**
- **API-first backend**
- **clear domain boundaries**
- **multi-tenant-safe from day one**
- **frontend as separate layer**
- **mobile-ready API foundation**
- **integration layer through adapters**

This should be the starting point before any scaling or microservice decisions.

---

## 32. Immediate Next Design Principle

Before coding starts, every next architectural step must validate:

1. Is this multi-tenant safe?
2. Does this preserve company isolation?
3. Does this support mixed source of truth?
4. Does this support configurable company logic later?
5. Does this avoid overengineering in MVP?
6. Does this keep courier mobile app possible later without redesign?

If the answer is “no” to one of these, the design should be reconsidered.