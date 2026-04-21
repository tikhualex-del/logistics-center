import { apiClient } from '@/lib/api/client'
import type { SendMessageInput, SendMessageResponse } from './types'

export const aiApi = {
  sendMessage: (input: SendMessageInput): Promise<SendMessageResponse> =>
    apiClient.post('/ai/chat', input),
}
