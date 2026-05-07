import { NextRequest, NextResponse } from 'next/server'
import { analyzeContent } from '@/lib/grok'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AnalysisResult, Platform } from '@/types'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface CompareResult {
  yours: AnalysisResult
  theirs: AnalysisResult
  betterSummary: string
}

async function generateBetterSummary(
  yours: AnalysisResult,
  theirs: AnalysisResult,
  yourContent: string,
  theirContent: string
): Promise<string> {
  const prompt = `You are a content strategist comparing two pieces of short-form content.

Your content scored ${yours.viralScore}/100.
Competitor content scored ${theirs.viralScore}/100.

Your content: "${yourContent.substring(0, 300)}"
Competitor content: "${theirContent.substring(0, 300)}"

Score breakdown comparison:
- Hook Strength: yours ${yours.hookStrength}/10 vs theirs ${theirs.hookStrength}/10
- Emotional Engagement: yours ${yours.emotionalEngagement}/10 vs theirs ${theirs.emotionalEngagement}/10
- Clarity: yours ${yours.clarity}/10 vs theirs ${theirs.clarity}/10
- Retention Potential: yours ${yours.retentionPotential}/10 vs theirs ${theirs.retentionPotential}/10

Write 2-3 sentences summarizing exactly what the competitor is doing better (or what you are doing better if you scored higher). Be specific, actionable, and direct. No fluff. Return only the summary text — no JSON, no labels.`

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.6,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) return 'Unable to generate comparison summary.'
  const data = await res.json()
  return data.choices[0].message.content.trim()
}

export async function POST(req: NextRequest) {
  try {
    const { yourContent, theirContent, platform } = await req.json()

    if (!yourContent?.trim() || yourContent.trim().length < 10) {
      return NextResponse.json({ error: 'Your content is too short (min 10 chars)' }, { status: 400 })
    }
    if (!theirContent?.trim() || theirContent.trim().length < 10) {
      return NextResponse.json({ error: 'Competitor content is too short (min 10 chars)' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const validPlatform = ['tiktok', 'instagram', 'youtube'].includes(platform)
      ? (platform as Platform)
      : undefined

    // Run both analyses in parallel
    const [yours, theirs] = await Promise.all([
      analyzeContent(yourContent.trim(), validPlatform),
      analyzeContent(theirContent.trim(), validPlatform),
    ])

    const betterSummary = await generateBetterSummary(yours, theirs, yourContent, theirContent)

    const result: CompareResult = { yours, theirs, betterSummary }
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('Compare error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
