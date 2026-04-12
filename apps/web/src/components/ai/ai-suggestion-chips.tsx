'use client'

interface Props {
  suggestions: string[]
  onSelect: (suggestion: string) => void
}

export function AiSuggestionChips({ suggestions, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2 px-3 pb-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onSelect(suggestion)}
          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
