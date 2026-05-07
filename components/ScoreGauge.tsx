'use client'

interface ScoreGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export default function ScoreGauge({ score, size = 'md' }: ScoreGaugeProps) {
  const isHigh = score >= 75
  const isMid = score >= 50 && score < 75
  const isLow = score < 50

  const color = isHigh ? 'var(--green)' : isMid ? 'var(--yellow)' : 'var(--red)'
  const bgColor = isHigh ? 'var(--green-subtle)' : isMid ? 'var(--yellow-subtle)' : 'var(--red-subtle)'
  const ringBg = isHigh ? 'var(--green-border)' : isMid ? 'var(--yellow-border)' : 'var(--red-border)'

  const label = isHigh ? 'High Potential' : isMid ? 'Moderate' : 'Needs Work'

  const dims = size === 'sm' ? 96 : size === 'lg' ? 160 : 128
  const strokeW = size === 'sm' ? 7 : size === 'lg' ? 10 : 8
  const cx = dims / 2
  const r = cx - strokeW - 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  const fontSize = size === 'sm' ? 'text-2xl' : size === 'lg' ? 'text-4xl' : 'text-3xl'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dims, height: dims }}>
        {/* Glow background */}
        <div
          className="absolute inset-2 rounded-full"
          style={{ background: bgColor, opacity: 0.6 }}
        />
        <svg
          width={dims}
          height={dims}
          viewBox={`0 0 ${dims} ${dims}`}
          className="relative -rotate-90"
          style={{ filter: `drop-shadow(0 0 8px color-mix(in srgb, ${color} 30%, transparent))` }}
        >
          {/* Track */}
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke={ringBg}
            strokeWidth={strokeW}
          />
          {/* Progress */}
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-serif ${fontSize} font-normal leading-none`} style={{ color }}>
            {score}
          </span>
          <span className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>/100</span>
        </div>
      </div>
      <span
        className="text-xs font-medium tracking-wide uppercase"
        style={{ color, letterSpacing: '0.08em' }}
      >
        {label}
      </span>
    </div>
  )
}
