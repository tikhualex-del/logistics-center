import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { AiChatPanel } from '@/components/ai/ai-chat-panel'

export const metadata: Metadata = { title: 'AI Assistant' }

export default function AiAssistantPage() {
  return (
    <div className="flex h-full flex-col space-y-4">
      <PageHeader title="AI Assistant" description="Ask questions about your logistics data" />
      <AiChatPanel />
    </div>
  )
}
