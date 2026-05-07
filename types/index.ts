export interface MetaSuggestions {
  title?: string
  caption?: string
  description?: string
  hashtags?: string
  thumbnailText?: string
  altText?: string
}

export interface AnalysisResult {
  viralScore: number
  hookStrength: number
  emotionalEngagement: number
  clarity: number
  retentionPotential: number
  summary: string
  suggestions: string[]
  rewrittenHook: string
  // Hook Analyzer fields (Phase 4)
  hookScore: number
  hookDiagnosis: string
  hookType: string
  // Per-field metadata suggestions
  metaSuggestions?: MetaSuggestions
}

export interface Analysis {
  id: string
  user_id: string
  content: string
  result: AnalysisResult
  platform?: string
  type?: string
  created_at: string
}

export type Platform = 'tiktok' | 'instagram' | 'youtube'

export const PLATFORM_LABELS: Record<Platform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram Reels',
  youtube: 'YouTube Shorts',
}
