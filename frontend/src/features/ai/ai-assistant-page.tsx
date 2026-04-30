import { useMemo, useState, type FormEvent, type ReactElement } from 'react'
import { Bot, Send, Sparkles, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/store'

interface AiMessage {
  id: string
  role: 'assistant' | 'user'
  text: string
}

const INITIAL_MESSAGES: readonly AiMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'Опишите операционную задачу: построить маршруты, найти риск SLA или подготовить сводку по курьерам.',
  },
]

const SUGGESTIONS = [
  'Покажи заказы под риском SLA',
  'Собери маршруты из новых заказов',
  'Найди курьеров без GPS',
  'Подготовь краткую сводку дня',
] as const

export function AiAssistantPage(): ReactElement {
  const selectedOrderIds = useUiStore((state) => state.selectedOrderIds)
  const clearOrderSelection = useUiStore((state) => state.clearOrderSelection)
  const [messages, setMessages] = useState<AiMessage[]>([...INITIAL_MESSAGES])
  const [draft, setDraft] = useState('')
  const canSend = draft.trim().length > 0
  const selectedOrdersLabel = useMemo(
    () => `${selectedOrderIds.length} заказов выбрано`,
    [selectedOrderIds.length],
  )

  function sendMessage(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: 'user',
        text,
      },
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'AI backend еще не подключен. Команда сохранена как UI-сценарий для будущей интеграции.',
      },
    ])
    setDraft('')
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-4 overflow-hidden bg-background p-4 md:p-6">
      <div className="border-b border-border pb-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          AI помощник
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Операционный чат
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          UI-only примитивы из legacy сохранены до подключения AI API.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-h-0 flex-col rounded-lg border border-border bg-card">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
          <form
            onSubmit={sendMessage}
            className="flex gap-2 border-t border-border p-3"
          >
            <label htmlFor="ai-assistant-input" className="sr-only">
              Команда AI
            </label>
            <input
              id="ai-assistant-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Напишите команду..."
              className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
            />
            <Button type="submit" disabled={!canSend}>
              <Send aria-hidden="true" />
              Отправить
            </Button>
          </form>
        </div>

        <aside className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Быстрые команды
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setDraft(suggestion)}
                  className="rounded-md bg-muted px-3 py-2 text-left text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Контекст</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {selectedOrdersLabel}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              disabled={selectedOrderIds.length === 0}
              onClick={clearOrderSelection}
            >
              Очистить выбор
            </Button>
          </div>
        </aside>
      </div>
    </section>
  )
}

function MessageBubble({ message }: { message: AiMessage }): ReactElement {
  const isUser = message.role === 'user'

  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={[
          'max-w-[80%] rounded-lg px-3 py-2 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'border border-border bg-background text-foreground',
        ].join(' ')}
      >
        <div className="mb-1 flex items-center gap-1.5 text-xs opacity-75">
          {isUser ? (
            <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Bot className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {isUser ? 'Вы' : 'AI'}
          {!isUser && <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
        </div>
        <p>{message.text}</p>
      </div>
    </div>
  )
}
