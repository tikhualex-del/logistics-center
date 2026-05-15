import AxiosMockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import httpClient from './http-client'
import { buildOrderFilters, getOrders } from './orders.api'

describe('orders API filters', () => {
  let apiMock: AxiosMockAdapter

  beforeEach(() => {
    localStorage.clear()
    apiMock = new AxiosMockAdapter(httpClient)
  })

  afterEach(() => {
    apiMock.restore()
    localStorage.clear()
  })

  it('sends backend-supported order filters as query params', async () => {
    apiMock.onGet('/orders').reply((config) => {
      expect(config.params).toEqual({
        date: '2026-04-16',
        status: 'confirmed',
        zoneId: 'zone-1',
        search: 'Petrov',
        timeWindowFrom: '09:00',
        timeWindowTo: '13:00',
      })

      return [
        200,
        {
          data: [{ id: 'order-1' }],
          meta: {
            requestId: 'req-1',
            timestamp: '2026-04-16T00:00:00.000Z',
          },
        },
      ]
    })

    const orders = await getOrders(
      buildOrderFilters({
        date: '2026-04-16',
        status: 'confirmed',
        zoneId: 'zone-1',
        search: '  Petrov  ',
        timeWindowFrom: '09:00',
        timeWindowTo: '13:00',
      }),
    )

    expect(orders).toEqual([{ id: 'order-1' }])
  })

  it('omits empty optional filters', () => {
    expect(
      buildOrderFilters({
        date: '2026-04-16',
        status: null,
        zoneId: null,
        search: '   ',
        timeWindowFrom: null,
        timeWindowTo: null,
      }),
    ).toEqual({ date: '2026-04-16' })
  })
})
