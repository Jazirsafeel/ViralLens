'use client'

interface SuggestionListProps {
  suggestions: string[]
  onCopy?: (text: string, label: string) => void
}

export default function SuggestionList({ suggestions, onCopy }: SuggestionListProps) {
  return (
    <div className="space-y-2">
      {suggestions.map((s, i) => (
        <div
          key={i}
          className="flex gap-3 items-start p-4 rounded-xl group cursor-default"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span
            className="flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 font-mono-vl"
            style={{
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              color: 'var(--accent-text)',
              fontSize: 11,
            }}
          >
            {i + 1}
          </span>
          <p className="text-sm flex-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {s}
          </p>
          {onCopy && (
            <button
              onClick={() => onCopy(s, `Suggestion ${i + 1}`)}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg"
              style={{ color: 'var(--text-muted)' }}
              title="Copy"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
