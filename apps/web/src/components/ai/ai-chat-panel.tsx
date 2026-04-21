'use client'

import { useAiChat } from '@/features/ai/hooks'
import { AiMessageList } from './ai-message-list'
import { AiChatInput } from './ai-chat-input'

export function AiChatPanel() {
  const { messages, sendMessage, isPending } = useAiChat()

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      <AiMessageList messages={messages} />
      <AiChatInput onSend={sendMessage} disabled={isPending} />
    </div>
  )
}
