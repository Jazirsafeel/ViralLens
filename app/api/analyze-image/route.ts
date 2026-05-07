import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MetaSuggestions } from '@/types'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface ImageAnalysisResult {
  thumbnailScore: number
  hookStrength: number
  emotionalEngagement: number
  clarity: number
  retentionPotential: number
  summary: string
  suggestions: string[]
  colorFeedback: string
  textOverlayFeedback: string
  faceFeedback: string
  metaSuggestions?: MetaSuggestions
}

const SYSTEM_PROMPT = `You are an expert social media thumbnail analyst and visual content strategist.
Analyze the uploaded image as a social media thumbnail or visual post and return ONLY valid JSON — no markdown, no backticks, no preamble.
The JSON must have exactly these fields:
{
  "thumbnailScore": <integer 0-100, overall thumbnail virality score>,
  "hookStrength": <integer 0-10, how compelling is the visual hook in first glance>,
  "emotionalEngagement": <integer 0-10, emotional reaction the image triggers>,
  "clarity": <integer 0-10, how clear and readable the image is>,
  "retentionPotential": <integer 0-10, likelihood a viewer pauses to watch/read>,
  "summary": "<2-3 sentence verdict on why this thumbnail will or won't perform well>",
  "suggestions": ["<specific actionable improvement>", "<specific actionable improvement>", "<specific actionable improvement>"],
  "colorFeedback": "<1-2 sentences on color palette, contrast, and visual hierarchy — what works and what to change>",
  "textOverlayFeedback": "<1-2 sentences on any text in the image — readability, size, placement, font choice — or 'No text overlay detected' if none>",
  "faceFeedback": "<1-2 sentences on facial expression, eye contact, or emotion conveyed — or 'No face detected' if no person is visible>",
  "metaSuggestions": {
    <only include keys for fields provided in post metadata — omit keys entirely if not provided>
    "caption": "<improved caption if provided>",
    "hashtags": "<improved hashtag string as space-separated #tags if provided>",
    "altText": "<improved alt text under 125 chars if provided>"
  }
}`

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType, platform, meta } = await req.json()

    if (!imageBase64 || !mediaType) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 })
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(mediaType)) {
      return NextResponse.json({ error: 'Unsupported image type. Use JPEG, PNG, WEBP, or GIF.' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const platformNote = platform
      ? `\nThis image is intended for ${
          platform === 'tiktok' ? 'TikTok' :
          platform === 'instagram' ? 'Instagram Reels' :
          'YouTube Shorts'
        }. Weight your scoring accordingly.`
      : ''

    // Build metadata context
    const metaParts: string[] = []
    if (meta?.caption)       metaParts.push(`Caption: ${meta.caption}`)
    if (meta?.description)   metaParts.push(`Description: ${meta.description}`)
    if (meta?.altText)       metaParts.push(`Alt text: ${meta.altText}`)
    if (meta?.hashtags)      metaParts.push(`Hashtags: ${meta.hashtags}`)
    const metaNote = metaParts.length > 0
      ? `\n\n--- Post metadata (factor these into your analysis and suggestions) ---\n${metaParts.join('\n')}`
      : ''

    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        temperature: 0.5,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: SYSTEM_PROMPT + platformNote + metaNote + '\n\nAnalyze this thumbnail/image:',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mediaType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Groq API error ${res.status}: ${err}`)
    }

    const data = await res.json()
    const raw: string = data.choices[0].message.content

    let result: ImageAnalysisResult
    try {
      result = JSON.parse(raw)
    } catch {
      const clean = raw.replace(/```json|```/g, '').trim()
      result = JSON.parse(clean)
    }

    // Save to analyses table with type: 'image'
    await supabase.from('analyses').insert({
      user_id: session.user.id,
      content: '[Image upload]',
      result: {
        viralScore: result.thumbnailScore,
        hookStrength: result.hookStrength,
        emotionalEngagement: result.emotionalEngagement,
        clarity: result.clarity,
        retentionPotential: result.retentionPotential,
        summary: result.summary,
        suggestions: result.suggestions,
        rewrittenHook: '',
        hookScore: result.hookStrength,
        hookDiagnosis: result.colorFeedback,
        hookType: 'Visual Hook',
      },
      platform: platform ?? null,
      type: 'image',
    })

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('Image analyze error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
