'use client'

export default function AnalysisSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Score skeleton */}
      <div
        className="rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <div className="w-32 h-32 rounded-full skeleton flex-shrink-0" />
        <div className="flex-1 w-full space-y-3 pt-2">
          <div className="h-5 w-20 rounded-lg skeleton" />
          <div className="h-4 w-full rounded-lg skeleton" />
          <div className="h-4 w-5/6 rounded-lg skeleton" />
          <div className="h-4 w-4/6 rounded-lg skeleton" />
        </div>
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[0,1,2,3].map(i => (
          <div
            key={i}
            className="rounded-2xl p-4 space-y-3"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex justify-between">
              <div className="h-4 w-28 rounded skeleton" />
              <div className="h-5 w-12 rounded-full skeleton" />
            </div>
            <div className="h-1 w-full rounded-full skeleton" />
            <div className="h-3 w-36 rounded skeleton" />
          </div>
        ))}
      </div>

      {/* Hook skeleton */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <div className="h-5 w-32 rounded skeleton" />
        <div className="h-16 w-full rounded-xl skeleton" />
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="h-20 rounded-xl skeleton" />
          <div className="sm:col-span-2 h-20 rounded-xl skeleton" />
        </div>
      </div>

      {/* Suggestions skeleton */}
      <div className="space-y-2">
        <div className="h-5 w-44 rounded skeleton mb-3" />
        {[0,1,2].map(i => (
          <div
            key={i}
            className="flex gap-3 items-start p-4 rounded-xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="w-5 h-5 rounded-full skeleton flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-full rounded skeleton" />
              <div className="h-4 w-3/4 rounded skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
