'use client'
import { useState, useMemo } from 'react'
import { Analysis, AnalysisResult, Platform, PLATFORM_LABELS } from '@/types'
import ScoreGauge from '@/components/ScoreGauge'
import MetricCard from '@/components/MetricCard'
import SuggestionList from '@/components/SuggestionList'
import { ToastContainer, useToast } from '@/components/Toast'

const PAGE_SIZE = 10
const METRICS = [
  { key: 'hookStrength' as const, label: 'Hook Strength', description: 'How compelling is the opening?' },
  { key: 'emotionalEngagement' as const, label: 'Emotional Engagement', description: 'Emotional response trigger?' },
  { key: 'clarity' as const, label: 'Clarity', description: 'Is the message clear?' },
  { key: 'retentionPotential' as const, label: 'Retention Potential', description: 'Will they stick around?' },
]

function scoreStyle(s: number) {
  const h = s >= 75, m = s >= 50
  return {
    color: h ? 'var(--green-text)' : m ? 'var(--yellow-text)' : 'var(--red-text)',
    bg: h ? 'var(--green-subtle)' : m ? 'var(--yellow-subtle)' : 'var(--red-subtle)',
    border: h ? 'var(--green-border)' : m ? 'var(--yellow-border)' : 'var(--red-border)',
    label: h ? 'High' : m ? 'Mid' : 'Low',
  }
}

export default function HistoryClient({ analyses: initial }: { analyses: Analysis[] }) {
  const [analyses, setAnalyses] = useState(initial)
  const [selected, setSelected] = useState<Analysis | null>(null)
  const [search, setSearch] = useState('')
  const [scoreFilter, setScoreFilter] = useState<'all'|'high'|'mid'|'low'>('all')
  const [dateFilter, setDateFilter] = useState('')
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<string | null>(null)
  const { toasts, addToast, removeToast } = useToast()

  const filtered = useMemo(() => analyses.filter(a => {
    const s = a.result.viralScore
    if (search && !a.content.toLowerCase().includes(search.toLowerCase())) return false
    if (scoreFilter === 'high' && s < 75) return false
    if (scoreFilter === 'mid' && (s < 50 || s >= 75)) return false
    if (scoreFilter === 'low' && s >= 50) return false
    if (dateFilter && new Date(a.created_at).toISOString().slice(0,10) !== dateFilter) return false
    return true
  }), [analyses, search, scoreFilter, dateFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  async function handleDelete(id: string) {
    setDeleting(id)
    const res = await fetch(`/api/analyses/${id}`, { method: 'DELETE' })
    if (res.ok) { setAnalyses(p => p.filter(a => a.id !== id)); if (selected?.id === id) setSelected(null); addToast('Deleted', 'success') }
    else addToast('Failed to delete', 'error')
    setDeleting(null)
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 14,
    color: 'var(--text-primary)',
    outline: 'none',
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="flex flex-col lg:flex-row gap-6">

        {/* List */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input type="text" placeholder="Search content..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} style={{ ...inputStyle, flex: 1 }} />
            <select value={scoreFilter} onChange={e => { setScoreFilter(e.target.value as any); setPage(1) }} style={inputStyle}>
              <option value="all">All scores</option>
              <option value="high">High (≥75)</option>
              <option value="mid">Mid (50–74)</option>
              <option value="low">Low (&lt;50)</option>
            </select>
            <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1) }} style={inputStyle} />
          </div>

          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
              No analyses match your filters.
            </div>
          ) : (
            <div className="space-y-2 animate-fade-in">
              {paginated.map(a => {
                const ss = scoreStyle(a.result.viralScore)
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className="group flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all"
                    style={{
                      background: 'var(--bg-surface)',
                      border: `1px solid ${selected?.id === a.id ? 'var(--accent-border)' : 'var(--border)'}`,
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center" style={{ background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color }}>
                      <span className="text-lg font-bold leading-none">{a.result.viralScore}</span>
                      <span className="text-[10px] mt-0.5 font-medium">{ss.label}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{a.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                          {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        {a.platform && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}>
                            {PLATFORM_LABELS[a.platform as Platform]}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(a.id) }}
                      disabled={deleting === a.id}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                      style={{ color: 'var(--text-faint)' }}
                    >
                      {deleting === a.id ? (
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="px-3 py-1.5 text-sm rounded-lg transition-all disabled:opacity-30" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                &larr; Prev
              </button>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="px-3 py-1.5 text-sm rounded-lg transition-all disabled:opacity-30" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                Next &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <>
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSelected(null)} />
            <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-3xl">
              <DetailView analysis={selected} onClose={() => setSelected(null)} />
            </div>
            <div className="hidden lg:block lg:w-[420px] flex-shrink-0">
              <DetailView analysis={selected} onClose={() => setSelected(null)} />
            </div>
          </>
        )}
      </div>
    </>
  )
}

function DetailView({ analysis, onClose }: { analysis: Analysis; onClose: () => void }) {
  const r: AnalysisResult = analysis.result
  const METRICS = [
    { key: 'hookStrength' as const, label: 'Hook Strength', description: 'How compelling is the opening?' },
    { key: 'emotionalEngagement' as const, label: 'Emotional Engagement', description: 'Emotional response trigger?' },
    { key: 'clarity' as const, label: 'Clarity', description: 'Is the message clear?' },
    { key: 'retentionPotential' as const, label: 'Retention Potential', description: 'Will they stick around?' },
  ]
  return (
    <div className="rounded-2xl p-5 space-y-5 animate-slide-up sticky top-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Full Result</span>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div>
        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Content</p>
        <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--text-secondary)' }}>{analysis.content}</p>
      </div>
      <div className="flex justify-center"><ScoreGauge score={r.viralScore} /></div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{r.summary}</p>
      <div className="grid grid-cols-2 gap-2">
        {METRICS.map(m => <MetricCard key={m.key} label={m.label} value={r[m.key]} description={m.description} />)}
      </div>
      {r.rewrittenHook && (
        <div className="rounded-xl p-3" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Improved hook</p>
          <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--accent-text)' }}>{r.rewrittenHook}</p>
        </div>
      )}
      <div>
        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Suggestions</p>
        <SuggestionList suggestions={r.suggestions} />
      </div>
    </div>
  )
}
