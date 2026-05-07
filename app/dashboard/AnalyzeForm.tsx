'use client'

import { useState, useCallback } from 'react'
import { AnalysisResult, Analysis, Platform, PLATFORM_LABELS, MetaSuggestions } from '@/types'
import ScoreGauge from '@/components/ScoreGauge'
import MetricCard from '@/components/MetricCard'
import SuggestionList from '@/components/SuggestionList'
import AnalysisSkeleton from '@/components/AnalysisSkeleton'
import EmptyState from '@/components/EmptyState'
import { ToastContainer, useToast } from '@/components/Toast'
import { CompareResult } from '@/app/api/compare/route'

interface Props { recentAnalyses: Analysis[] }
interface Caption { style: string; text: string }
interface ToolkitResult {
  hashtags: string[]
  audioSuggestions: { style: string; description: string }[]
}
interface ImageAnalysisResult {
  thumbnailScore: number; hookStrength: number; emotionalEngagement: number
  clarity: number; retentionPotential: number; summary: string
  suggestions: string[]; colorFeedback: string; textOverlayFeedback: string
  faceFeedback: string; metaSuggestions?: MetaSuggestions
}
type InputMode = 'text' | 'image' | 'video'
interface TextMeta { title: string; description: string; hashtags: string }
interface ImageMeta { description: string; altText: string; hashtags: string }
interface VideoMeta { title: string; caption: string; description: string; thumbnailText: string; hashtags: string }
interface VideoAnalysisResult {
  viralScore: number; hookStrength: number; emotionalEngagement: number
  clarity: number; retentionPotential: number; summary: string
  suggestions: string[]; rewrittenHook: string; hookScore: number
  hookDiagnosis: string; hookType: string; thumbnailScore: number
  colorFeedback: string; textOverlayFeedback: string; faceFeedback: string
  thumbnailSuggestions: string[]; transcript: string; hasTranscript: boolean
  metaSuggestions?: MetaSuggestions
}

const PLATFORM_META_CONFIG: Record<string, {
  showTitle: boolean; captionLabel: string; showAltText: boolean
  showThumbnailText: boolean; hashtagLimit: number; hashtagTip: string
}> = {
  '': { showTitle: true, captionLabel: 'Description', showAltText: false, showThumbnailText: false, hashtagLimit: 10, hashtagTip: 'General hashtags' },
  tiktok: { showTitle: false, captionLabel: 'Caption', showAltText: false, showThumbnailText: false, hashtagLimit: 5, hashtagTip: 'TikTok: 3–5 hashtags work best. Mix niche + trending.' },
  instagram: { showTitle: false, captionLabel: 'Caption', showAltText: true, showThumbnailText: false, hashtagLimit: 30, hashtagTip: 'Instagram: up to 30 hashtags. Mix sizes (big/medium/niche).' },
  youtube: { showTitle: true, captionLabel: 'Description', showAltText: false, showThumbnailText: true, hashtagLimit: 15, hashtagTip: 'YouTube: 3 hashtags shown above title. Add more in description for search.' },
}

const METRICS = [
  { key: 'hookStrength', label: 'Hook Strength', description: 'How compelling is the opening?' },
  { key: 'emotionalEngagement', label: 'Emotional Engagement', description: 'Does it trigger an emotional response?' },
  { key: 'clarity', label: 'Clarity', description: 'Is the message clear and concise?' },
  { key: 'retentionPotential', label: 'Retention Potential', description: 'Will viewers/readers stick around?' },
] as const

const PLATFORM_SHORT: Record<Platform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
}

const HOOK_TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Question Hook':    { bg: 'var(--blue-subtle)', color: 'var(--blue-text)', border: 'var(--blue-border)' },
  'Shock Hook':       { bg: 'var(--red-subtle)', color: 'var(--red-text)', border: 'var(--red-border)' },
  'Story Hook':       { bg: 'var(--accent-subtle)', color: 'var(--accent-text)', border: 'var(--accent-border)' },
  'Data Hook':        { bg: 'var(--blue-subtle)', color: 'var(--blue-text)', border: 'var(--blue-border)' },
  'Humor Hook':       { bg: 'var(--yellow-subtle)', color: 'var(--yellow-text)', border: 'var(--yellow-border)' },
  'Controversy Hook': { bg: 'var(--red-subtle)', color: 'var(--red-text)', border: 'var(--red-border)' },
  'Curiosity Hook':   { bg: 'var(--green-subtle)', color: 'var(--green-text)', border: 'var(--green-border)' },
  'Pain Hook':        { bg: 'var(--accent-subtle)', color: 'var(--accent-text)', border: 'var(--accent-border)' },
}

function hookScoreStyle(score: number) {
  if (score >= 8) return 'var(--green-text)'
  if (score >= 5) return 'var(--yellow-text)'
  return 'var(--red-text)'
}

function parseHashtags(raw: string) {
  return raw.split(/[\s,]+/).filter(t => t.trim()).map(t => t.startsWith('#') ? t : `#${t}`)
}

// ── Primitive UI helpers ── //
function Card({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
      {children}
    </h2>
  )
}

function Badge({ children, bg, color, border }: { children: React.ReactNode; bg: string; color: string; border: string }) {
  return (
    <span
      className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full"
      style={{ background: bg, color, border: `1px solid ${border}` }}
    >
      {children}
    </span>
  )
}

function PrimaryBtn({ onClick, disabled, children, fullWidth = false }: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode; fullWidth?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${fullWidth ? 'w-full' : ''} flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed`}
      style={{
        background: 'var(--accent)',
        color: '#fff',
        boxShadow: '0 2px 8px color-mix(in srgb, var(--accent) 25%, transparent)',
      }}
    >
      {children}
    </button>
  )
}

function SecondaryBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
      style={{
        background: 'var(--bg-surface-2)',
        border: '1px solid var(--border)',
        color: 'var(--text-secondary)',
      }}
    >
      {children}
    </button>
  )
}

function FieldLabel({ children, hint, optional }: { children: React.ReactNode; hint?: string; optional?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{children}</label>
      {optional && <span className="text-xs" style={{ color: 'var(--text-faint)' }}>optional</span>}
      {hint && <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
  )
}

function AISuggestionBox({ suggestion, onUse }: { suggestion: string; onUse: (v: string) => void }) {
  return (
    <div
      className="mt-2 flex items-start gap-2 p-3 rounded-xl"
      style={{
        background: 'var(--accent-subtle)',
        border: '1px solid var(--accent-border)',
      }}
    >
      <svg className="flex-shrink-0 mt-0.5 w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <p className="text-xs flex-1 leading-relaxed" style={{ color: 'var(--accent-text)' }}>{suggestion}</p>
      <button
        onClick={() => onUse(suggestion)}
        className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg transition-all"
        style={{
          background: 'var(--accent-border)',
          color: 'var(--accent-text)',
        }}
      >
        Use
      </button>
    </div>
  )
}

function MetaField({
  label, hint, value, onChange, placeholder, rows = 1, mono = false, optional = true,
  suggestion, onUseSuggestion,
}: {
  label: string; hint?: string; value: string; onChange: (v: string) => void
  placeholder?: string; rows?: number; mono?: boolean; optional?: boolean
  suggestion?: string; onUseSuggestion?: (v: string) => void
}) {
  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '10px 14px',
    width: '100%',
    fontSize: 13,
    color: 'var(--text-primary)',
    fontFamily: mono ? 'DM Mono, monospace' : undefined,
    resize: 'none' as const,
  }

  return (
    <div>
      <FieldLabel hint={hint} optional={optional}>{label}</FieldLabel>
      {rows > 1 ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={inputStyle} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
      )}
      {suggestion && onUseSuggestion && <AISuggestionBox suggestion={suggestion} onUse={onUseSuggestion} />}
    </div>
  )
}
// ── Spinner ── //
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  )
}

// ── Copy icon ── //
function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

// ── Platform icon SVGs ── //
function PlatformIcon({ platform }: { platform: Platform | '' }) {
  if (platform === 'tiktok') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z"/>
    </svg>
  )
  if (platform === 'instagram') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  )
  if (platform === 'youtube') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14c-1.88-.5-9.38-.5-9.38-.5s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z"/>
    </svg>
  )
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}


export default function AnalyzeForm({ recentAnalyses }: Props) {
  const [content, setContent] = useState('')
  const [platform, setPlatform] = useState<Platform | ''>('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [originalContent, setOriginalContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [captions, setCaptions] = useState<Caption[]>([])
  const [loadingCaptions, setLoadingCaptions] = useState(false)
  const [toolkit, setToolkit] = useState<ToolkitResult | null>(null)
  const [loadingToolkit, setLoadingToolkit] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [competitorContent, setCompetitorContent] = useState('')
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null)
  const [loadingCompare, setLoadingCompare] = useState(false)
  const [inputMode, setInputMode] = useState<InputMode>('text')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageResult, setImageResult] = useState<ImageAnalysisResult | null>(null)
  const [loadingImage, setLoadingImage] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [videoResult, setVideoResult] = useState<VideoAnalysisResult | null>(null)
  const [loadingVideo, setLoadingVideo] = useState(false)
  const [videoDragOver, setVideoDragOver] = useState(false)
  const [videoProgress, setVideoProgress] = useState('')
  const { toasts, addToast, removeToast } = useToast()
  const [textMeta, setTextMeta] = useState<TextMeta>({ title: '', description: '', hashtags: '' })
  const [imageMeta, setImageMeta] = useState<ImageMeta>({ description: '', altText: '', hashtags: '' })
  const [videoMeta, setVideoMeta] = useState<VideoMeta>({ title: '', caption: '', description: '', thumbnailText: '', hashtags: '' })
  const [metaOpen, setMetaOpen] = useState(false)

  async function handleAnalyze() {
    if (!content.trim() || content.trim().length < 10) { setError('Content must be at least 10 characters.'); return }
    setLoading(true); setError(''); setResult(null); setCaptions([]); setToolkit(null)
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, platform: platform || undefined, meta: { title: textMeta.title || undefined, description: textMeta.description || undefined, hashtags: textMeta.hashtags || undefined } }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Something went wrong'); addToast(data.error || 'Analysis failed', 'error') }
    else { setResult(data); setOriginalContent(content); addToast('Analysis complete', 'success'); if (data.metaSuggestions) setMetaOpen(true); fetchToolkit(content, platform || undefined) }
  }

  async function fetchToolkit(text: string, plt?: Platform | '') {
    setLoadingToolkit(true)
    const res = await fetch('/api/toolkit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text, platform: plt || undefined }) })
    const data = await res.json()
    setLoadingToolkit(false)
    if (res.ok) setToolkit(data)
  }

  async function handleGenerateCaptions() {
    setLoadingCaptions(true); setCaptions([])
    const res = await fetch('/api/captions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: originalContent }) })
    const data = await res.json()
    setLoadingCaptions(false)
    if (res.ok && data.captions) setCaptions(data.captions)
    else addToast('Failed to generate captions', 'error')
  }

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => addToast(`${label} copied`, 'success'))
  }, [addToast])

  function handleReAnalyze() {
    setResult(null); setCaptions([]); setToolkit(null); setCompareOpen(false)
    setCompareResult(null); setCompetitorContent(''); setImageResult(null)
    setImageFile(null); setImagePreview(null); setVideoResult(null)
    setVideoFile(null); setVideoPreview(null); setMetaOpen(false)
  }

  function copyAllMeta() {
    let parts: string[] = []
    if (inputMode === 'text') {
      if (textMeta.title) parts.push(`Title: ${textMeta.title}`)
      if (textMeta.description) parts.push(`\n${textMeta.description}`)
      if (textMeta.hashtags) parts.push(`\n${textMeta.hashtags}`)
    } else if (inputMode === 'image') {
      if (imageMeta.description) parts.push(imageMeta.description)
      if (imageMeta.altText) parts.push(`Alt: ${imageMeta.altText}`)
      if (imageMeta.hashtags) parts.push(`\n${imageMeta.hashtags}`)
    } else if (inputMode === 'video') {
      if (videoMeta.title) parts.push(`Title: ${videoMeta.title}`)
      if (videoMeta.caption) parts.push(videoMeta.caption)
      if (videoMeta.description) parts.push(`\n${videoMeta.description}`)
      if (videoMeta.thumbnailText) parts.push(`Thumbnail: ${videoMeta.thumbnailText}`)
      if (videoMeta.hashtags) parts.push(`\n${videoMeta.hashtags}`)
    }
    copyToClipboard(parts.join('\n'), 'All post metadata')
  }

  function handleImageFile(file: File) {
    if (!file.type.startsWith('image/')) { addToast('Please upload an image file', 'error'); return }
    if (file.size > 10 * 1024 * 1024) { addToast('Image must be under 10MB', 'error'); return }
    setImageFile(file); setImageResult(null)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleAnalyzeImage() {
    if (!imageFile) return
    setLoadingImage(true); setImageResult(null)
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      const base64 = dataUrl.split(',')[1]
      const res = await fetch('/api/analyze-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: imageFile.type, platform: platform || undefined, meta: { caption: imageMeta.description || undefined, altText: imageMeta.altText || undefined, hashtags: imageMeta.hashtags || undefined } }),
      })
      const data = await res.json()
      setLoadingImage(false)
      if (res.ok) { setImageResult(data); addToast('Image analyzed', 'success'); if (data.metaSuggestions) setMetaOpen(true) }
      else addToast(data.error || 'Image analysis failed', 'error')
    }
    reader.readAsDataURL(imageFile)
  }

  function handleVideoFile(file: File) {
    if (!file.type.startsWith('video/')) { addToast('Please upload a video file', 'error'); return }
    if (file.size > 25 * 1024 * 1024) { addToast('Video must be under 25MB', 'error'); return }
    setVideoFile(file); setVideoResult(null)
    const url = URL.createObjectURL(file)
    setVideoPreview(url)
  }

  async function handleAnalyzeVideo() {
    if (!videoFile) return
    setLoadingVideo(true); setVideoResult(null); setVideoProgress('Reading video file...')
    try {
      const videoBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => resolve((e.target?.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(videoFile)
      })
      setVideoProgress('Extracting first frame...')
      let frameBase64: string | null = null
      try {
        frameBase64 = await new Promise<string>((resolve, reject) => {
          const video = document.createElement('video')
          video.src = videoPreview!; video.crossOrigin = 'anonymous'; video.muted = true; video.currentTime = 0
          video.onloadeddata = () => {
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 360
            const ctx = canvas.getContext('2d')
            if (!ctx) { reject(new Error('No canvas context')); return }
            ctx.drawImage(video, 0, 0)
            resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1])
          }
          video.onerror = reject; video.load()
        })
      } catch { frameBase64 = null }
      setVideoProgress('Transcribing and analyzing...')
      const res = await fetch('/api/analyze-video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoBase64, mimeType: videoFile.type, fileName: videoFile.name, frameBase64, platform: platform || undefined, meta: { title: videoMeta.title || undefined, caption: videoMeta.caption || undefined, description: videoMeta.description || undefined, thumbnailText: videoMeta.thumbnailText || undefined, hashtags: videoMeta.hashtags || undefined } }),
      })
      const data = await res.json()
      setLoadingVideo(false); setVideoProgress('')
      if (res.ok) { setVideoResult(data); addToast('Video analyzed', 'success'); if (data.metaSuggestions) setMetaOpen(true) }
      else addToast(data.error || 'Video analysis failed', 'error')
    } catch { setLoadingVideo(false); setVideoProgress(''); addToast('Something went wrong', 'error') }
  }

  async function handleCompare() {
    if (competitorContent.trim().length < 10) { addToast('Competitor content must be at least 10 characters', 'error'); return }
    setLoadingCompare(true); setCompareResult(null)
    const res = await fetch('/api/compare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ yourContent: originalContent, theirContent: competitorContent, platform: platform || undefined }) })
    const data = await res.json()
    setLoadingCompare(false)
    if (res.ok) setCompareResult(data)
    else addToast(data.error || 'Compare failed', 'error')
  }

  function loadHistoricResult(a: Analysis) {
    setResult(a.result); setOriginalContent(a.content); setContent(a.content)
    setPlatform((a.platform as Platform) || ''); setCaptions([]); setToolkit(null)
  }

  // ── Divider ──
  const Divider = () => <div style={{ height: 1, background: 'var(--border)', margin: '0 -24px' }} />

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="space-y-6">

        {/* ══ INPUT CARD ══ */}
        <Card style={{ overflow: 'hidden' }}>
          <div className="p-6">

            {/* Mode Tabs */}
            <div
              className="flex p-1 rounded-xl mb-6 w-fit gap-0.5"
              style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}
            >
              {([
                { mode: 'text', label: 'Text / Caption', icon: (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                )},
                { mode: 'image', label: 'Thumbnail / Post', icon: (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )},
                { mode: 'video', label: 'Video', icon: (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.869v6.262a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )},
              ] as const).map(({ mode, label, icon }) => (
                <button
                  key={mode}
                  onClick={() => {
                    setInputMode(mode as InputMode)
                    if (mode !== 'text') { setResult(null); setCaptions([]); setToolkit(null) }
                    if (mode !== 'image') { setImageResult(null); setImageFile(null); setImagePreview(null) }
                    if (mode !== 'video') { setVideoResult(null); setVideoFile(null); setVideoPreview(null) }
                    setMetaOpen(false)
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                  style={{
                    background: inputMode === mode ? 'var(--bg-surface)' : 'transparent',
                    color: inputMode === mode ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: inputMode === mode ? 'var(--shadow-sm)' : 'none',
                    border: inputMode === mode ? '1px solid var(--border)' : '1px solid transparent',
                  }}
                >
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Platform Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                Platform
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPlatform('')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                  style={{
                    background: platform === '' ? 'var(--accent-subtle)' : 'var(--bg-surface-2)',
                    border: `1px solid ${platform === '' ? 'var(--accent-border)' : 'var(--border)'}`,
                    color: platform === '' ? 'var(--accent-text)' : 'var(--text-muted)',
                  }}
                >
                  <PlatformIcon platform="" />
                  General
                </button>
                {(Object.keys(PLATFORM_LABELS) as Platform[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                    style={{
                      background: platform === p ? 'var(--accent-subtle)' : 'var(--bg-surface-2)',
                      border: `1px solid ${platform === p ? 'var(--accent-border)' : 'var(--border)'}`,
                      color: platform === p ? 'var(--accent-text)' : 'var(--text-muted)',
                    }}
                  >
                    <PlatformIcon platform={p} />
                    {PLATFORM_SHORT[p]}
                  </button>
                ))}
              </div>
              {platform && (
                <p className="mt-2.5 text-xs" style={{ color: 'var(--accent-text)' }}>
                  {platform === 'tiktok' && 'Weighting hook strength and trend alignment for TikTok.'}
                  {platform === 'instagram' && 'Weighting visual appeal and caption quality for Instagram.'}
                  {platform === 'youtube' && 'Weighting retention and thumbnail strength for YouTube.'}
                </p>
              )}
            </div>

            {/* ── TEXT MODE ── */}
            {inputMode === 'text' && (
              <>
                <label className="block text-sm font-medium mb-2.5" style={{ color: 'var(--text-secondary)' }}>
                  Your content
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Paste your caption, script, post, or hook here..."
                  rows={6}
                  className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed"
                  style={{
                    background: 'var(--bg-surface-2)',
                    border: '1px solid var(--border)',
                    resize: 'none',
                    color: 'var(--text-primary)',
                  }}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{content.length}/5000</span>
                  {error && <span className="text-xs" style={{ color: 'var(--red-text)' }}>{error}</span>}
                </div>
                <div className="flex gap-3 mt-4">
                  <PrimaryBtn onClick={handleAnalyze} disabled={loading || content.trim().length < 10} fullWidth>
                    {loading ? <><Spinner /> Analyzing...</> : (
                      <>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Analyze content
                      </>
                    )}
                  </PrimaryBtn>
                  {result && (
                    <SecondaryBtn onClick={handleReAnalyze}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset
                    </SecondaryBtn>
                  )}
                </div>
              </>
            )}

            {/* ── IMAGE MODE ── */}
            {inputMode === 'image' && (
              <>
                <label className="block text-sm font-medium mb-2.5" style={{ color: 'var(--text-secondary)' }}>
                  Upload thumbnail or post image
                </label>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleImageFile(f) }}
                  className="relative rounded-xl transition-all duration-150"
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border-strong)'}`,
                    background: dragOver ? 'var(--accent-subtle)' : 'var(--bg-surface-2)',
                    padding: imagePreview ? 12 : 32,
                  }}
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-contain rounded-lg" />
                      <button
                        onClick={() => { setImageFile(null); setImagePreview(null); setImageResult(null) }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>{imageFile?.name}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Drop your thumbnail or post image here</p>
                      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>JPEG, PNG, WEBP — up to 10MB</p>
                      <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium px-4 py-2 rounded-lg transition-all" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Browse files
                        <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f) }} />
                      </label>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-4">
                  <PrimaryBtn onClick={handleAnalyzeImage} disabled={loadingImage || !imageFile} fullWidth>
                    {loadingImage ? <><Spinner /> Analyzing...</> : (
                      <>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Rate image
                      </>
                    )}
                  </PrimaryBtn>
                  {imageResult && (
                    <SecondaryBtn onClick={() => { setImageResult(null); setImageFile(null); setImagePreview(null) }}>
                      Clear
                    </SecondaryBtn>
                  )}
                </div>
              </>
            )}

            {/* ── VIDEO MODE ── */}
            {inputMode === 'video' && (
              <>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Upload your video
                </label>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                  MP4, MOV, or WEBM · max 25MB · AI transcribes audio and rates the first frame
                </p>
                <div
                  onDragOver={e => { e.preventDefault(); setVideoDragOver(true) }}
                  onDragLeave={() => setVideoDragOver(false)}
                  onDrop={e => { e.preventDefault(); setVideoDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleVideoFile(f) }}
                  className="relative rounded-xl transition-all duration-150"
                  style={{
                    border: `2px dashed ${videoDragOver ? 'var(--accent)' : 'var(--border-strong)'}`,
                    background: videoDragOver ? 'var(--accent-subtle)' : 'var(--bg-surface-2)',
                    padding: videoPreview ? 12 : 32,
                  }}
                >
                  {videoPreview ? (
                    <div className="relative">
                      <video src={videoPreview} className="w-full max-h-48 rounded-lg object-contain" style={{ background: '#000' }} controls muted />
                      <button onClick={() => { setVideoFile(null); setVideoPreview(null); setVideoResult(null) }} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                      <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>{videoFile?.name} · {videoFile ? (videoFile.size / 1024 / 1024).toFixed(1) : 0}MB</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.869v6.262a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Drop your video here</p>
                      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>TikTok, Reel, Short — any short-form video</p>
                      <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium px-4 py-2 rounded-lg transition-all" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Choose video
                        <input type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoFile(f) }} />
                      </label>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-4">
                  <PrimaryBtn onClick={handleAnalyzeVideo} disabled={loadingVideo || !videoFile} fullWidth>
                    {loadingVideo ? <><Spinner />{videoProgress || 'Analyzing...'}</> : (
                      <><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Analyze video</>
                    )}
                  </PrimaryBtn>
                  {videoResult && <SecondaryBtn onClick={() => { setVideoResult(null); setVideoFile(null); setVideoPreview(null) }}>Clear</SecondaryBtn>}
                </div>
              </>
            )}

            {/* ── METADATA PANEL (shared collapse) ── */}
            <div className="mt-4" style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <button
                onClick={() => setMetaOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 transition-all"
                style={{ background: 'var(--bg-surface-2)' }}
              >
                <div className="flex items-center gap-2.5">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Post metadata</span>
                  <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    {inputMode === 'text' ? 'title · description · hashtags' : inputMode === 'image' ? 'caption · hashtags' : 'title · caption · hashtags'}
                  </span>
                </div>
                <svg
                  width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-faint)" strokeWidth={2}
                  style={{ transform: metaOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {metaOpen && (
                <div className="p-4 space-y-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  {/* AI suggestions notice */}
                  {(result?.metaSuggestions || imageResult?.metaSuggestions || videoResult?.metaSuggestions) && (
                    <div className="flex items-center gap-2 text-xs p-3 rounded-lg" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      AI suggestions are ready — click <strong className="mx-0.5">Use</strong> to apply them
                    </div>
                  )}

                  {/* TEXT fields */}
                  {inputMode === 'text' && (
                    <>
                      {PLATFORM_META_CONFIG[platform].showTitle && (
                        <MetaField label={platform === 'youtube' ? 'Video title' : 'Title'} hint={platform === 'youtube' ? 'Under 60 chars' : undefined} value={textMeta.title} onChange={v => setTextMeta(m => ({ ...m, title: v }))} placeholder={platform === 'youtube' ? 'Your YouTube title...' : 'Post title...'} suggestion={result?.metaSuggestions?.title} onUseSuggestion={v => setTextMeta(m => ({ ...m, title: v }))} />
                      )}
                      <MetaField label={PLATFORM_META_CONFIG[platform].captionLabel} hint={platform === 'tiktok' ? 'Max 2,200 chars' : platform === 'instagram' ? 'First 125 chars shown' : platform === 'youtube' ? 'First 200 chars visible' : undefined} value={textMeta.description} onChange={v => setTextMeta(m => ({ ...m, description: v }))} placeholder="Write your caption or description..." rows={3} suggestion={result?.metaSuggestions?.caption || result?.metaSuggestions?.description} onUseSuggestion={v => setTextMeta(m => ({ ...m, description: v }))} />
                      <div>
                        <MetaField label="Hashtags" hint={PLATFORM_META_CONFIG[platform].hashtagTip} value={textMeta.hashtags} onChange={v => setTextMeta(m => ({ ...m, hashtags: v }))} placeholder="#viral #fyp #content" mono suggestion={result?.metaSuggestions?.hashtags} onUseSuggestion={v => setTextMeta(m => ({ ...m, hashtags: v }))} />
                        {textMeta.hashtags && <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{parseHashtags(textMeta.hashtags).length} hashtags</p>}
                      </div>
                    </>
                  )}

                  {/* IMAGE fields */}
                  {inputMode === 'image' && (
                    <>
                      <MetaField label="Caption" hint={platform === 'instagram' ? 'First 125 chars shown' : platform === 'tiktok' ? 'Max 2,200 chars' : undefined} value={imageMeta.description} onChange={v => setImageMeta(m => ({ ...m, description: v }))} placeholder="Write your caption here..." rows={3} suggestion={imageResult?.metaSuggestions?.caption} onUseSuggestion={v => setImageMeta(m => ({ ...m, description: v }))} />
                      {PLATFORM_META_CONFIG[platform ?? ''].showAltText && (
                        <MetaField label="Alt text" hint="Accessibility + SEO" value={imageMeta.altText} onChange={v => setImageMeta(m => ({ ...m, altText: v }))} placeholder="Describe the image for screen readers..." suggestion={imageResult?.metaSuggestions?.altText} onUseSuggestion={v => setImageMeta(m => ({ ...m, altText: v }))} />
                      )}
                      <div>
                        <MetaField label="Hashtags" hint={PLATFORM_META_CONFIG[platform ?? ''].hashtagTip} value={imageMeta.hashtags} onChange={v => setImageMeta(m => ({ ...m, hashtags: v }))} placeholder="#photography #content #viral" mono suggestion={imageResult?.metaSuggestions?.hashtags} onUseSuggestion={v => setImageMeta(m => ({ ...m, hashtags: v }))} />
                        {imageMeta.hashtags && <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{parseHashtags(imageMeta.hashtags).length} hashtags</p>}
                      </div>
                    </>
                  )}

                  {/* VIDEO fields */}
                  {inputMode === 'video' && (
                    <>
                      {PLATFORM_META_CONFIG[platform ?? ''].showTitle && (
                        <MetaField label="Title" hint={platform === 'youtube' ? 'Under 60 chars · appears in search' : undefined} value={videoMeta.title} onChange={v => setVideoMeta(m => ({ ...m, title: v }))} placeholder="Your video title..." suggestion={videoResult?.metaSuggestions?.title} onUseSuggestion={v => setVideoMeta(m => ({ ...m, title: v }))} />
                      )}
                      {platform !== 'youtube' && (
                        <MetaField label="Caption" hint={platform === 'tiktok' ? 'Max 2,200 chars' : platform === 'instagram' ? 'First 125 chars shown' : undefined} value={videoMeta.caption} onChange={v => setVideoMeta(m => ({ ...m, caption: v }))} placeholder="Caption / post text..." rows={2} suggestion={videoResult?.metaSuggestions?.caption} onUseSuggestion={v => setVideoMeta(m => ({ ...m, caption: v }))} />
                      )}
                      <MetaField label={platform === 'youtube' ? 'Description' : 'Extended description'} hint={platform === 'youtube' ? 'First 200 chars visible' : undefined} value={videoMeta.description} onChange={v => setVideoMeta(m => ({ ...m, description: v }))} placeholder="Description, links, chapters..." rows={3} suggestion={videoResult?.metaSuggestions?.description} onUseSuggestion={v => setVideoMeta(m => ({ ...m, description: v }))} />
                      {PLATFORM_META_CONFIG[platform ?? ''].showThumbnailText && (
                        <MetaField label="Thumbnail overlay text" hint="Under 6 words works best" value={videoMeta.thumbnailText} onChange={v => setVideoMeta(m => ({ ...m, thumbnailText: v }))} placeholder="e.g. I tried this for 30 days..." suggestion={videoResult?.metaSuggestions?.thumbnailText} onUseSuggestion={v => setVideoMeta(m => ({ ...m, thumbnailText: v }))} />
                      )}
                      <div>
                        <MetaField label="Hashtags" hint={PLATFORM_META_CONFIG[platform ?? ''].hashtagTip} value={videoMeta.hashtags} onChange={v => setVideoMeta(m => ({ ...m, hashtags: v }))} placeholder={platform === 'youtube' ? '#shorts #topic #niche' : '#fyp #viral #topic'} mono suggestion={videoResult?.metaSuggestions?.hashtags} onUseSuggestion={v => setVideoMeta(m => ({ ...m, hashtags: v }))} />
                        {videoMeta.hashtags && <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{parseHashtags(videoMeta.hashtags).length} hashtags</p>}
                      </div>
                    </>
                  )}

                  {/* Copy all button */}
                  {((inputMode === 'text' && (textMeta.title || textMeta.description || textMeta.hashtags)) ||
                    (inputMode === 'image' && (imageMeta.description || imageMeta.altText || imageMeta.hashtags)) ||
                    (inputMode === 'video' && (videoMeta.title || videoMeta.caption || videoMeta.description || videoMeta.hashtags))) && (
                    <button onClick={copyAllMeta} className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all" style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'var(--bg-surface-2)' }}>
                      <CopyIcon />
                      Copy all metadata
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* ══ LOADING STATES ══ */}
        {loading && inputMode === 'text' && <AnalysisSkeleton />}
        {loadingImage && <AnalysisSkeleton />}
        {loadingVideo && (
          <div className="space-y-3">
            <AnalysisSkeleton />
            {videoProgress && (
              <p className="text-center text-xs animate-pulse" style={{ color: 'var(--accent-text)' }}>{videoProgress}</p>
            )}
          </div>
        )}

        {/* ══ IMAGE RESULTS ══ */}
        {imageResult && inputMode === 'image' && !loadingImage && (
          <div className="space-y-5 animate-slide-up">
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                <ScoreGauge score={imageResult.thumbnailScore} />
                <div className="flex-1">
                  <h2 className="font-serif text-xl mb-2" style={{ color: 'var(--text-primary)' }}>Image Rating</h2>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{imageResult.summary}</p>
                </div>
              </div>
            </Card>
            <div>
              <SectionHeading>Visual Metrics</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {METRICS.map(m => <MetricCard key={m.key} label={m.label} value={imageResult[m.key as keyof ImageAnalysisResult] as number} description={m.description} />)}
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'Color & Contrast', text: imageResult.colorFeedback, icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg> },
                { label: 'Text Overlay', text: imageResult.textOverlayFeedback, icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> },
                { label: 'Face & Emotion', text: imageResult.faceFeedback, icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
              ].map(fb => (
                <Card key={fb.label} className="p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span style={{ color: 'var(--accent)' }}>{fb.icon}</span>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{fb.label}</p>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{fb.text}</p>
                </Card>
              ))}
            </div>
            <div>
              <SectionHeading>Improvement Suggestions</SectionHeading>
              <SuggestionList suggestions={imageResult.suggestions} onCopy={copyToClipboard} />
            </div>
          </div>
        )}

        {/* ══ VIDEO RESULTS ══ */}
        {videoResult && inputMode === 'video' && !loadingVideo && (
          <div className="space-y-5 animate-slide-up">
            {videoResult.hasTranscript ? (
              <Card className="p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Transcript</h2>
                  <Badge bg="var(--green-subtle)" color="var(--green-text)" border="var(--green-border)">Whisper AI</Badge>
                </div>
                <p className="text-xs leading-relaxed line-clamp-4" style={{ color: 'var(--text-secondary)' }}>{videoResult.transcript}</p>
              </Card>
            ) : (
              <div className="p-4 rounded-xl" style={{ background: 'var(--yellow-subtle)', border: '1px solid var(--yellow-border)' }}>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--yellow-text)' }}>No speech detected</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>The video may be silent or music-only. Visual analysis was still applied.</p>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Content Score', score: videoResult.viralScore, sub: videoResult.summary },
                { label: 'Thumbnail Score', score: videoResult.thumbnailScore, sub: videoResult.colorFeedback },
              ].map(({ label, score, sub }) => (
                <Card key={label} className="p-5 flex flex-col items-center gap-2">
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <ScoreGauge score={score} />
                  <p className="text-xs text-center leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{sub}</p>
                </Card>
              ))}
            </div>
            <div>
              <SectionHeading>Content Metrics</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {METRICS.map(m => <MetricCard key={m.key} label={m.label} value={videoResult[m.key as keyof VideoAnalysisResult] as number} description={m.description} />)}
              </div>
            </div>
            {videoResult.hookDiagnosis && (
              <Card className="p-6" style={{ borderColor: 'var(--accent-border)' }}>
                <div className="flex items-center gap-2.5 mb-4 flex-wrap">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Hook Analyzer</h2>
                  {videoResult.hookType && (
                    <Badge
                      bg={HOOK_TYPE_COLORS[videoResult.hookType]?.bg ?? 'var(--bg-surface-2)'}
                      color={HOOK_TYPE_COLORS[videoResult.hookType]?.color ?? 'var(--text-muted)'}
                      border={HOOK_TYPE_COLORS[videoResult.hookType]?.border ?? 'var(--border)'}
                    >{videoResult.hookType}</Badge>
                  )}
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="rounded-xl p-4 flex flex-col items-center justify-center text-center" style={{ background: 'var(--bg-surface-2)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Hook Score</p>
                    <p className="font-serif text-4xl" style={{ color: hookScoreStyle(videoResult.hookScore ?? 0) }}>
                      {videoResult.hookScore ?? '—'}<span className="text-xl" style={{ color: 'var(--text-faint)' }}>/10</span>
                    </p>
                  </div>
                  <div className="sm:col-span-2 rounded-xl p-4" style={{ background: 'var(--bg-surface-2)' }}>
                    <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Diagnosis</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{videoResult.hookDiagnosis}</p>
                  </div>
                </div>
                {videoResult.rewrittenHook && (
                  <div className="mt-4 rounded-xl p-4" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}>
                    <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Suggested opening rewrite</p>
                    <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--accent-text)' }}>{videoResult.rewrittenHook}</p>
                  </div>
                )}
              </Card>
            )}
            <div>
              <SectionHeading>Improvement Suggestions</SectionHeading>
              <SuggestionList suggestions={[...videoResult.suggestions, ...(videoResult.thumbnailSuggestions ?? [])]} onCopy={copyToClipboard} />
            </div>
          </div>
        )}

        {/* ══ TEXT RESULTS ══ */}
        {result && !loading && inputMode === 'text' && (
          <div className="space-y-5 animate-slide-up">

            {/* Score + Verdict */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                <ScoreGauge score={result.viralScore} />
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                    <h2 className="font-serif text-xl" style={{ color: 'var(--text-primary)' }}>Verdict</h2>
                    {platform && (
                      <Badge bg="var(--accent-subtle)" color="var(--accent-text)" border="var(--accent-border)">
                        <PlatformIcon platform={platform} />
                        <span className="ml-1">{PLATFORM_LABELS[platform]}</span>
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{result.summary}</p>
                </div>
              </div>
            </Card>

            {/* Hook Analyzer */}
            <Card className="p-6" style={{ borderColor: 'var(--accent-border)' }}>
              <div className="flex items-center gap-2.5 mb-4 flex-wrap">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Hook Analyzer</h2>
                {result.hookType && (
                  <Badge
                    bg={HOOK_TYPE_COLORS[result.hookType]?.bg ?? 'var(--bg-surface-2)'}
                    color={HOOK_TYPE_COLORS[result.hookType]?.color ?? 'var(--text-muted)'}
                    border={HOOK_TYPE_COLORS[result.hookType]?.border ?? 'var(--border)'}
                  >{result.hookType}</Badge>
                )}
              </div>

              {/* Opening hook quote */}
              <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                <p className="text-xs uppercase tracking-widest mb-1.5 font-medium" style={{ color: 'var(--text-faint)', letterSpacing: '0.1em' }}>Your opening hook</p>
                <p className="text-sm font-medium italic leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  &ldquo;{originalContent.split('\n')[0].substring(0, 200)}&rdquo;
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="rounded-xl p-4 flex flex-col items-center justify-center text-center" style={{ background: 'var(--bg-surface-2)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Hook Score</p>
                  <p className="font-serif text-4xl" style={{ color: hookScoreStyle(result.hookScore ?? 0) }}>
                    {result.hookScore ?? '—'}<span className="text-xl" style={{ color: 'var(--text-faint)' }}>/10</span>
                  </p>
                </div>
                <div className="sm:col-span-2 rounded-xl p-4" style={{ background: 'var(--bg-surface-2)' }}>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Diagnosis</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{result.hookDiagnosis ?? '—'}</p>
                </div>
              </div>

              {result.rewrittenHook && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Suggested rewrite</p>
                    <button onClick={() => copyToClipboard(result.rewrittenHook, 'Rewritten hook')} className="flex items-center gap-1 text-xs transition-all" style={{ color: 'var(--text-muted)' }}>
                      <CopyIcon />
                      Copy
                    </button>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}>
                    <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--accent-text)' }}>{result.rewrittenHook}</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Metrics */}
            <div>
              <SectionHeading>Metric Breakdown</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {METRICS.map(m => <MetricCard key={m.key} label={m.label} value={result[m.key]} description={m.description} />)}
              </div>
            </div>

            {/* Before/After hook comparison */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Hook Comparison</h2>
                <button onClick={() => copyToClipboard(result.rewrittenHook, 'Rewritten hook')} className="flex items-center gap-1.5 text-xs transition-all" style={{ color: 'var(--text-muted)' }}>
                  <CopyIcon />
                  Copy improved
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface-2)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--red)' }} />
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Original</p>
                  </div>
                  <p className="text-sm leading-relaxed line-through" style={{ color: 'var(--text-faint)' }}>
                    {originalContent.split('\n')[0]}
                  </p>
                </div>
                <div className="rounded-xl p-4" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--green)' }} />
                    <p className="text-xs font-medium" style={{ color: 'var(--accent-text)' }}>Improved</p>
                  </div>
                  <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--accent-text)' }}>
                    {result.rewrittenHook}
                  </p>
                </div>
              </div>
            </Card>

            {/* Suggestions */}
            <div>
              <SectionHeading>Improvement Suggestions</SectionHeading>
              <SuggestionList suggestions={result.suggestions} onCopy={copyToClipboard} />
            </div>

            {/* Caption Generator */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Caption Generator</h2>
                <Badge bg="var(--accent-subtle)" color="var(--accent-text)" border="var(--accent-border)">AI</Badge>
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Generate 3 alternative captions with different angles</p>

              {captions.length === 0 && !loadingCaptions && (
                <button
                  onClick={handleGenerateCaptions}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{ border: `1px dashed var(--accent-border)`, color: 'var(--accent-text)', background: 'var(--accent-subtle)' }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Generate alternative captions
                </button>
              )}

              {loadingCaptions && (
                <div className="space-y-3">
                  {[0,1,2].map(i => (
                    <div key={i} className="rounded-xl p-4 space-y-2" style={{ background: 'var(--bg-surface-2)' }}>
                      <div className="h-3 w-24 rounded skeleton" />
                      <div className="h-4 w-full rounded skeleton" />
                      <div className="h-4 w-4/5 rounded skeleton" />
                    </div>
                  ))}
                </div>
              )}

              {captions.length > 0 && (
                <div className="space-y-3">
                  {captions.map((cap, i) => (
                    <div key={i} className="rounded-xl p-4" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold" style={{ color: 'var(--accent-text)' }}>{cap.style}</span>
                        <button onClick={() => copyToClipboard(cap.text, cap.style)} className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <CopyIcon />Copy
                        </button>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{cap.text}</p>
                    </div>
                  ))}
                  <button onClick={handleGenerateCaptions} className="text-xs flex items-center gap-1.5 transition-all" style={{ color: 'var(--text-muted)' }}>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Regenerate
                  </button>
                </div>
              )}
            </Card>

            {/* Growth Toolkit */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Growth Toolkit</h2>
                <Badge bg="var(--green-subtle)" color="var(--green-text)" border="var(--green-border)">Auto-generated</Badge>
              </div>
              <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Hashtags and audio pairings tailored to your content</p>

              {loadingToolkit && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-7 w-24 rounded-full skeleton" />)}
                  </div>
                  <div className="space-y-2">
                    {[0,1,2].map(i => <div key={i} className="h-16 rounded-xl skeleton" />)}
                  </div>
                </div>
              )}

              {toolkit && !loadingToolkit && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Hashtags</h3>
                      <button onClick={() => copyToClipboard(toolkit.hashtags.join(' '), 'All hashtags')} className="flex items-center gap-1.5 text-xs transition-all" style={{ color: 'var(--text-muted)' }}>
                        <CopyIcon />Copy all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {toolkit.hashtags.map((tag, i) => (
                        <button
                          key={i}
                          onClick={() => copyToClipboard(tag, tag)}
                          className="px-3 py-1.5 rounded-full text-sm font-mono-vl transition-all"
                          style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--green-text)' }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Trending Audio Styles</h3>
                    <div className="space-y-2">
                      {toolkit.audioSuggestions.map((audio, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--accent-text)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{audio.style}</p>
                              <button onClick={() => copyToClipboard(audio.style, audio.style)} style={{ color: 'var(--text-faint)' }}><CopyIcon /></button>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{audio.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!toolkit && !loadingToolkit && (
                <button
                  onClick={() => fetchToolkit(originalContent, platform)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{ border: `1px dashed var(--green-border)`, color: 'var(--green-text)', background: 'var(--green-subtle)' }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                  Generate growth toolkit
                </button>
              )}
            </Card>

            {/* Competitor Comparison */}
            <Card className="p-6">
              <button onClick={() => { setCompareOpen(v => !v); setCompareResult(null) }} className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Compare with Competitor</h2>
                </div>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-faint)" strokeWidth={2} style={{ transform: compareOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {compareOpen && (
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Competitor content</label>
                    <textarea
                      value={competitorContent}
                      onChange={e => setCompetitorContent(e.target.value)}
                      placeholder="Paste their caption, script, or hook here..."
                      rows={4}
                      className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed"
                      style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', resize: 'none' }}
                    />
                  </div>
                  <PrimaryBtn onClick={handleCompare} disabled={loadingCompare || competitorContent.trim().length < 10} fullWidth>
                    {loadingCompare ? <><Spinner />Comparing...</> : 'Compare content'}
                  </PrimaryBtn>

                  {compareResult && (
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Your content', score: compareResult.yours.viralScore, better: compareResult.yours.viralScore >= compareResult.theirs.viralScore },
                          { label: 'Competitor', score: compareResult.theirs.viralScore, better: compareResult.theirs.viralScore > compareResult.yours.viralScore },
                        ].map(({ label, score, better }) => (
                          <div key={label} className="rounded-xl p-4 text-center" style={{ background: 'var(--bg-surface-2)' }}>
                            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                            <p className="font-serif text-4xl" style={{ color: better ? 'var(--green-text)' : 'var(--red-text)' }}>{score}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>/100</p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        {(['hookStrength', 'emotionalEngagement', 'clarity', 'retentionPotential'] as const).map(key => {
                          const labels: Record<string, string> = { hookStrength: 'Hook Strength', emotionalEngagement: 'Emotional Engagement', clarity: 'Clarity', retentionPotential: 'Retention Potential' }
                          const mine = compareResult.yours[key]
                          const theirs = compareResult.theirs[key]
                          const diff = mine - theirs
                          return (
                            <div key={key} className="flex items-center gap-3">
                              <p className="text-xs w-28 sm:w-40 flex-shrink-0 truncate" style={{ color: 'var(--text-muted)' }}>{labels[key]}</p>
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                {[{ val: mine, accent: true }, { val: theirs, accent: false }].map(({ val, accent }, i) => (
                                  <div key={i} className="relative rounded-lg h-7 overflow-hidden" style={{ background: 'var(--bg-surface-3)' }}>
                                    <div className="absolute inset-y-0 left-0 rounded-lg" style={{ width: `${val * 10}%`, background: accent ? 'var(--accent)' : 'var(--border-strong)', opacity: 0.6 }} />
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{val}/10</span>
                                  </div>
                                ))}
                              </div>
                              <div className="text-xs font-bold w-10 text-right flex-shrink-0" style={{ color: diff > 0 ? 'var(--green-text)' : diff < 0 ? 'var(--red-text)' : 'var(--text-faint)' }}>
                                {diff > 0 ? `+${diff}` : diff}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div className="p-4 rounded-xl" style={{ background: 'var(--yellow-subtle)', border: '1px solid var(--yellow-border)' }}>
                        <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--yellow-text)' }}>
                          {compareResult.theirs.viralScore > compareResult.yours.viralScore ? 'What they are doing better' : 'What you are doing better'}
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{compareResult.betterSummary}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            <div className="text-center">
              <a href="/history" className="text-xs transition-colors" style={{ color: 'var(--text-faint)' }}>
                View full analysis history &rarr;
              </a>
            </div>
          </div>
        )}

        {/* ══ EMPTY / RECENT ══ */}
        {!result && !loading && inputMode === 'text' && (
          recentAnalyses.length === 0 ? (
            <EmptyState />
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <SectionHeading>Recent Analyses</SectionHeading>
                <a href="/history" className="text-xs transition-all" style={{ color: 'var(--accent-text)' }}>View all &rarr;</a>
              </div>
              <div className="space-y-2">
                {recentAnalyses.map(a => {
                  const s = a.result.viralScore
                  const isH = s >= 75, isM = s >= 50
                  const scoreColor = isH ? 'var(--green-text)' : isM ? 'var(--yellow-text)' : 'var(--red-text)'
                  const scoreBg = isH ? 'var(--green-subtle)' : isM ? 'var(--yellow-subtle)' : 'var(--red-subtle)'
                  const scoreBorder = isH ? 'var(--green-border)' : isM ? 'var(--yellow-border)' : 'var(--red-border)'
                  return (
                    <div
                      key={a.id}
                      onClick={() => loadHistoricResult(a)}
                      className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold" style={{ background: scoreBg, border: `1px solid ${scoreBorder}`, color: scoreColor }}>
                        {s}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{a.content}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{new Date(a.created_at).toLocaleDateString()}</p>
                          {a.platform && (
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)' }}>
                              {(a.platform as string).charAt(0).toUpperCase() + (a.platform as string).slice(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="var(--text-faint)" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        )}
      </div>
    </>
  )
}
