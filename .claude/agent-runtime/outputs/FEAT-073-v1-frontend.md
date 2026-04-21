# FEAT-073 v1 frontend implementation

## Changes
- Added company/settings API modules for company profile, feature flags and webhooks.
- Added `use-company-settings` hooks for current company, features and integration webhooks.
- Added `CompanySettings` feature and embedded it at the top of the Settings page.
- Added company name editing.
- Added feature flags with enable/disable controls and JSON config editing.
- Added webhook registration/editing with provider, URL, secrets, event selection, active state and settings JSON.
- Kept user management below the company settings area.

## Verification
- `npm run lint` passed.
- `npm run build` passed.
