'use client'

import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { aiApi } from './api'
import type { AiMessage } from './types'

export function useAiChat() {
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [conversationId, setConversationId] = useState<string | undefined>()

  const { mutate, isPending } = useMutation({
    mutationFn: aiApi.sendMessage,
    onSuccess: (data) => {
      setConversationId(data.conversationId)
      setMessages((prev) => [...prev, data.message])
    },
  })

  const sendMessage = useCallback(
    (content: string) => {
      const userMessage: AiMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMessage])
      mutate({ message: content, conversationId })
    },
    [mutate, conversationId],
  )

  return { messages, sendMessage, isPending }
}
