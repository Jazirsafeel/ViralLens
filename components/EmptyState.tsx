'use client'

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div
        className="w-20 h-20 rounded-3xl mb-6 flex items-center justify-center"
        style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect x="6" y="22" width="5" height="8" rx="1.5" fill="var(--accent)" opacity="0.3"/>
          <rect x="13.5" y="16" width="5" height="14" rx="1.5" fill="var(--accent)" opacity="0.5"/>
          <rect x="21" y="10" width="5" height="20" rx="1.5" fill="var(--accent)" opacity="0.75"/>
          <circle cx="28" cy="8" r="3.5" fill="var(--accent)" opacity="0.9"/>
          <path d="M22 6 L28 4.5 L29.5 8" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7"/>
        </svg>
      </div>

      <h3
        className="font-serif text-xl mb-2"
        style={{ color: 'var(--text-primary)' }}
      >
        Ready to analyze
      </h3>
      <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Paste your caption, script, or content above and receive a detailed virality report.
      </p>
    </div>
  )
}
