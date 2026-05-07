import { NextRequest, NextResponse } from 'next/server'
import { analyzeContent, ContentMeta } from '@/lib/grok'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Platform } from '@/types'

const VALID_PLATFORMS: Platform[] = ['tiktok', 'instagram', 'youtube']

export async function POST(req: NextRequest) {
  try {
    const { content, platform, meta } = await req.json()

    if (!content || content.trim().length < 10) {
      return NextResponse.json({ error: 'Content too short (min 10 chars)' }, { status: 400 })
    }

    if (content.trim().length > 5000) {
      return NextResponse.json({ error: 'Content too long (max 5000 chars)' }, { status: 400 })
    }

    const validPlatform: Platform | undefined =
      platform && VALID_PLATFORMS.includes(platform) ? platform : undefined

    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await analyzeContent(content.trim(), validPlatform, meta as ContentMeta | undefined)

    const { error: dbError } = await supabase.from('analyses').insert({
      user_id: session.user.id,
      content: content.trim(),
      result,
      platform: validPlatform ?? null,
      type: 'text',
    })

    if (dbError) {
      console.error('DB insert error:', dbError)
    }

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('Analyze error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
