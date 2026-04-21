# FEAT-058 v1 - Plan

Feature: dispatcher-socket-connection
Task: 7.3a

## Scope

Mount authenticated Socket.io connection on dispatcher screen and subscribe to company realtime events.

## Acceptance

- Socket connects only for authenticated users.
- JWT is sent through the existing socket auth callback.
- Dispatcher subscribes to order, route, courier, and alert events.
- Realtime events invalidate relevant TanStack Query caches.

