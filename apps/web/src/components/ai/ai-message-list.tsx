import { clsx } from 'clsx'
import type { AiMessage } from '@/features/ai/types'

interface Props {
  messages: AiMessage[]
}

export function AiMessageList({ messages }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <p className="text-center text-sm text-gray-400 mt-8">
          Ask anything about your orders, couriers, or routes.
        </p>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={clsx(
                'max-w-[75%] rounded-lg px-4 py-2 text-sm',
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900',
              )}
            >
              {msg.content}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
