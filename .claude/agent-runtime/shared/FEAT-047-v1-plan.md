# FEAT-047 Plan

## Scope

Implement Phase 6.2a login page:
- provide a real `/login` screen with an email/password form
- move the auth screen into `src/features/auth`
- keep the route itself lightweight and lazy-loaded from the app router
- verify the page with frontend TypeScript and ESLint checks

## Implementation Notes

- Use the existing UI primitives (`Button`, `Input`, `Label`) and the current routing setup.
- Make the screen visually distinctive so auth does not feel like a placeholder scaffold.
- Keep the submit flow local and preview-safe until the API auth wiring lands in `6.2c`.
- Let authenticated users bypass the login screen and jump back into the dispatcher workspace.
