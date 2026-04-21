# FEAT-072 v1 frontend implementation

## Changes
- Added `UserManagement` feature and wired `/settings` to it.
- Added users table with search, role filter and active/inactive filter.
- Added create-user and edit-user form with email, phone, name, role, password and activation controls.
- Added role guide panel for admin, dispatcher and courier responsibilities.
- Updated user API types to include backend fields `phone`, `lastLoginAt`, nullable `lastName`, and updateable email/password/phone.
- Protected management actions in the UI with `can('manage:users')`.

## Verification
- `npm run lint` passed.
- `npm run build` passed.
