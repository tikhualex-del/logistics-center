export type MessageRole = 'user' | 'assistant'

export interface AiMessage {
  id: string
  role: MessageRole
  content: string
  createdAt: string
}

export interface SendMessageInput {
  message: string
  conversationId?: string
}

export interface SendMessageResponse {
  conversationId: string
  message: AiMessage
}
