'use client'

interface MetricCardProps {
  label: string
  value: number
  max?: number
  description?: string
}

export default function MetricCard({ label, value, max = 10, description }: MetricCardProps) {
  const pct = (value / max) * 100
  const isHigh = pct >= 75
  const isMid = pct >= 50
  const color = isHigh ? 'var(--green)' : isMid ? 'var(--yellow)' : 'var(--red)'
  const bgColor = isHigh ? 'var(--green-subtle)' : isMid ? 'var(--yellow-subtle)' : 'var(--red-subtle)'

  return (
    <div
      className="rounded-2xl p-4 group"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <div
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: bgColor, color }}
        >
          {value}<span className="font-normal opacity-60">/{max}</span>
        </div>
      </div>

      {/* Bar track */}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: 4, background: 'var(--bg-surface-3)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: color,
            transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
            boxShadow: `0 0 6px color-mix(in srgb, ${color} 50%, transparent)`,
          }}
        />
      </div>

      {description && (
        <p className="text-xs mt-2.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      )}
    </div>
  )
}
