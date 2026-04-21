import AxiosMockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import httpClient, { refreshClient } from './http-client'
import { authUser, resetAuthState } from '@/test/auth-test-helpers'
import { useAuthStore } from '@/store/auth.store'

describe('httpClient auth refresh', () => {
  let apiMock: AxiosMockAdapter
  let refreshMock: AxiosMockAdapter

  beforeEach(() => {
    resetAuthState()
    apiMock = new AxiosMockAdapter(httpClient)
    refreshMock = new AxiosMockAdapter(refreshClient)
  })

  afterEach(() => {
    apiMock.restore()
    refreshMock.restore()
    resetAuthState()
  })

  it('refreshes an expired access token, updates auth state, and retries the original request', async () => {
    useAuthStore.getState().setAuth(authUser, 'old-token')

    refreshMock.onPost('/auth/refresh').reply(200, {
      data: {
        accessToken: 'new-token',
      },
    })
    apiMock.onGet('/orders').replyOnce(401)
    apiMock.onGet('/orders').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer new-token')
      return [
        200,
        {
          data: [{ id: 'order-1' }],
          meta: { requestId: 'req-1', timestamp: '2026-04-21T00:00:00.000Z' },
        },
      ]
    })

    const response = await httpClient.get('/orders')

    expect(response.data.data).toEqual([{ id: 'order-1' }])
    expect(localStorage.getItem('access_token')).toBe('new-token')
    expect(useAuthStore.getState().accessToken).toBe('new-token')
    expect(refreshMock.history.post).toHaveLength(1)
    expect(apiMock.history.get).toHaveLength(2)
  })
})
