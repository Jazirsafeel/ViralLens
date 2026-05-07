import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Platform } from '@/types'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface ToolkitResult {
  hashtags: string[]
  audioSuggestions: { style: string; description: string }[]
}

export async function POST(req: NextRequest) {
  try {
    const { content, platform } = await req.json()

    if (!content || content.trim().length < 10) {
      return NextResponse.json({ error: 'Content too short' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const platformLabel: Record<Platform, string> = {
      tiktok: 'TikTok',
      instagram: 'Instagram Reels',
      youtube: 'YouTube Shorts',
    }

    const platformContext = platform
      ? `The content is intended for ${platformLabel[platform as Platform] ?? platform}.`
      : 'The platform is unspecified — give general short-form video recommendations.'

    const systemPrompt = `You are a social media growth expert specializing in hashtag strategy and audio/music pairing for viral short-form video content.
${platformContext}
Analyze the content and return ONLY valid JSON — no markdown, no backticks, no preamble.
Return exactly this structure:
{
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8"],
  "audioSuggestions": [
    { "style": "<short style name e.g. 'Trending Hyperpop'>", "description": "<1-2 sentences on why this audio style fits this content and how to find it>" },
    { "style": "<short style name>", "description": "<1-2 sentences>" },
    { "style": "<short style name>", "description": "<1-2 sentences>" }
  ]
}
For hashtags: mix 3 broad trending tags, 3 niche relevant tags, and 2 community-specific tags. Always include the # symbol.
For audio: suggest specific genres, moods, or trending audio styles that match the content's energy.`

    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate growth toolkit for this content:\n\n${content.trim()}` },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Groq API error ${res.status}: ${err}`)
    }

    const data = await res.json()
    const raw: string = data.choices[0].message.content

    let result: ToolkitResult
    try {
      result = JSON.parse(raw)
    } catch {
      const clean = raw.replace(/```json|```/g, '').trim()
      result = JSON.parse(clean)
    }

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('Toolkit error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
