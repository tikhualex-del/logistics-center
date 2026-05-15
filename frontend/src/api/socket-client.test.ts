import { io } from 'socket.io-client'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildRealtimeSocketUrl,
  disconnectSocket,
  getSocket,
  REALTIME_NAMESPACE,
  WS_EVENTS,
} from './socket-client'

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    connected: false,
    disconnect: vi.fn(),
  })),
}))

describe('socket-client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    disconnectSocket()
    localStorage.clear()
  })

  it('connects to the backend realtime namespace', () => {
    getSocket()

    expect(io).toHaveBeenCalledWith(
      `http://localhost:3000${REALTIME_NAMESPACE}`,
      expect.objectContaining({
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }),
    )
  })

  it('does not append the realtime namespace twice', () => {
    expect(
      buildRealtimeSocketUrl(`http://localhost:3000${REALTIME_NAMESPACE}`),
    ).toBe(`http://localhost:3000${REALTIME_NAMESPACE}`)
  })

  it('sends the access token during socket authentication', () => {
    localStorage.setItem('access_token', 'access-token-1')
    getSocket()

    const socketOptions = vi.mocked(io).mock.calls[0]?.[1] as
      | { auth?: (callback: (payload: unknown) => void) => void }
      | undefined
    let authPayload: unknown = null
    socketOptions?.auth?.((payload) => {
      authPayload = payload
    })

    expect(authPayload).toEqual({ token: 'access-token-1' })
  })

  it('matches backend realtime event names', () => {
    expect(WS_EVENTS).toEqual({
      COURIER_LOCATION_UPDATED: 'courier:location_updated',
      ORDER_STATUS_CHANGED: 'order:status_changed',
      ROUTE_UPDATED: 'route:updated',
      ALERT_NEW: 'alert:new',
    })
  })
})
