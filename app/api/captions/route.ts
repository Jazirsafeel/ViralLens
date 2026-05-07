import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const CAPTION_SYSTEM_PROMPT = `You are a viral content strategist. Generate alternative social media captions for the given content.
Return ONLY valid JSON — no markdown, no backticks, no preamble.
Format:
{
  "captions": [
    { "style": "Curiosity-driven", "text": "..." },
    { "style": "Bold & Direct", "text": "..." },
    { "style": "Story-based", "text": "..." }
  ]
}`

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json()
    if (!content || content.trim().length < 10) {
      return NextResponse.json({ error: 'Content too short' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.85,
        messages: [
          { role: 'system', content: CAPTION_SYSTEM_PROMPT },
          { role: 'user', content: `Generate 3 alternative captions for this content:\n\n${content.trim()}` },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Groq API error ${res.status}: ${err}`)
    }

    const data = await res.json()
    const raw: string = data.choices[0].message.content

    try {
      return NextResponse.json(JSON.parse(raw))
    } catch {
      const clean = raw.replace(/```json|```/g, '').trim()
      return NextResponse.json(JSON.parse(clean))
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
