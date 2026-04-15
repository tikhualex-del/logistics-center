import { useEffect, useRef } from 'react'
import type { Socket } from 'socket.io-client'
import { getSocket, type WsEventName } from '@/api/socket-client'
import { useAuthStore } from '@/store'

/**
 * Hook to subscribe to a WebSocket event.
 * Automatically connects when authenticated, disconnects on unmount.
 *
 * @example
 * useSocket('courier:location_updated', (payload) => {
 *   updateCourierPosition(payload)
 * })
 */
export function useSocket<T>(event: WsEventName, handler: (data: T) => void): void {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    if (!isAuthenticated) return

    const socket: Socket = getSocket()

    if (!socket.connected) {
      socket.connect()
    }

    const listener = (data: T) => handlerRef.current(data)
    socket.on(event, listener)

    return () => {
      socket.off(event, listener)
    }
  }, [event, isAuthenticated])
}
