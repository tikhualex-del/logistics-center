import { io, type Socket } from 'socket.io-client'
import { WS_URL } from '@/lib/constants'

/**
 * WebSocket event names (per CLAUDE.md Section 16).
 * These match the server-side Socket.io event names exactly.
 */
export const WS_EVENTS = {
  COURIER_LOCATION_UPDATED: 'courier:location_updated',
  ORDER_STATUS_CHANGED: 'order:status_changed',
  ROUTE_UPDATED: 'route:updated',
  ALERT_NEW: 'alert:new',
} as const

export type WsEventName = (typeof WS_EVENTS)[keyof typeof WS_EVENTS]

/**
 * Singleton Socket.io client.
 * Connection is lazy — call socket.connect() when user is authenticated.
 *
 * Auth token is sent as auth param on handshake;
 * the backend validates it before accepting the connection.
 */
let socketInstance: Socket | null = null

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(WS_URL, {
      autoConnect: false, // connect only after authentication
      auth: (cb) => {
        const token = localStorage.getItem('access_token')
        cb({ token })
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
  }
  return socketInstance
}

export function disconnectSocket(): void {
  if (socketInstance?.connected) {
    socketInstance.disconnect()
  }
  socketInstance = null
}
