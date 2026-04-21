'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  onSend: (message: string) => void
  disabled?: boolean
}

export function AiChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 border-t border-gray-200 p-3"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />
      <Button type="submit" size="sm" disabled={disabled || !value.trim()}>
        Send
      </Button>
    </form>
  )
}
