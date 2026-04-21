# FEAT-017 v1 — Plan

## Feature
Swagger setup with JWT support

## Goal
Make Swagger a stable part of the backend bootstrap so `/api/docs` works consistently in the running app and in e2e tests, with Bearer JWT auth configured in the OpenAPI document.

## Scope
- Extract shared app bootstrap configuration into a reusable helper.
- Keep Swagger UI at `/api/docs`.
- Configure Bearer auth in the Swagger/OpenAPI config.
- Add an e2e test for the docs route and a test assertion for the generated OpenAPI document.

## Expected Outcome
- Swagger UI is accessible at `/api/docs`.
- The generated document contains `bearer` security scheme metadata for future auth-decorated endpoints.
