import { AnalysisResult } from '@/types'
import { Platform } from '@/types'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const BASE_SYSTEM_PROMPT = `You are a top-tier content strategist who evaluates short-form content for viral potential.
Analyze the content the user provides and return ONLY valid JSON — no markdown, no backticks, no preamble, no explanation.
The JSON must have exactly these fields:
{
  "viralScore": <integer 0-100>,
  "hookStrength": <integer 0-10>,
  "emotionalEngagement": <integer 0-10>,
  "clarity": <integer 0-10>,
  "retentionPotential": <integer 0-10>,
  "summary": "<2-3 sentence verdict on why this content will or won't go viral>",
  "suggestions": ["<specific actionable improvement>", "<specific actionable improvement>", "<specific actionable improvement>"],
  "rewrittenHook": "<rewritten opening line or hook that would perform better>",
  "hookScore": <integer 0-10, scoring only the opening hook/first sentence>,
  "hookDiagnosis": "<one-line diagnosis of what the hook is doing right or wrong>",
  "hookType": "<one of: Question Hook, Shock Hook, Story Hook, Data Hook, Humor Hook, Controversy Hook, Curiosity Hook, Pain Hook>",
  "metaSuggestions": {
    <only include keys for fields that were provided in the post metadata — omit keys entirely if not applicable>
  }
}`

const META_SUGGESTION_INSTRUCTIONS: Record<string, string> = {
  title:         `"title": "<improved title — punchy, curiosity-driven, under 60 chars, optimized for clicks>"`,
  caption:       `"caption": "<improved caption — engaging opener, clear CTA, emoji where natural, platform-appropriate length>"`,
  description:   `"description": "<improved description — strong first 2 lines visible before 'more', relevant keywords, links placeholder if useful>"`,
  hashtags:      `"hashtags": "<improved hashtag string — mix of 1-2 broad, 2-3 medium niche, 2-3 hyper-specific tags as space-separated #tags>"`,
  thumbnailText: `"thumbnailText": "<improved thumbnail overlay text — 3-6 bold words, creates curiosity or urgency>"`,
  altText:       `"altText": "<improved alt text — descriptive, includes keywords, under 125 chars>"`,
}

const PLATFORM_INSTRUCTIONS: Record<Platform, string> = {
  tiktok: `
Platform: TikTok
- Weight hook strength and trend alignment heavily — TikTok's algorithm rewards fast, punchy openers
- Evaluate whether the content would work as a 15–60 second video
- Check for trend hooks, sounds, or challenges that could boost discoverability
- Penalize slow intros or overly formal language
- Reward relatability, humor, and pattern interrupts`,

  instagram: `
Platform: Instagram Reels
- Weight visual appeal, caption quality, and hashtag strategy heavily
- Evaluate whether the content has a strong visual hook (describe what the first frame should look like)
- Check caption readability, emoji use, and call-to-action quality
- Evaluate hashtag potential (niche vs broad mix)
- Reward polished, aesthetic, and aspirational content`,

  youtube: `
Platform: YouTube Shorts
- Weight retention, thumbnail strength, and title hook heavily
- Evaluate whether the content sustains interest for 30–60 seconds without drop-off
- Check for a strong payoff at the end that rewards watching to completion
- Penalize content that gives away the answer in the first 3 seconds
- Reward educational value, clear titles, and satisfying conclusions`,
}

function buildSystemPrompt(platform?: Platform, metaKeys?: string[]): string {
  let prompt = BASE_SYSTEM_PROMPT
  if (platform) prompt += '\n' + PLATFORM_INSTRUCTIONS[platform]
  if (metaKeys && metaKeys.length > 0) {
    const fieldLines = metaKeys
      .filter(k => META_SUGGESTION_INSTRUCTIONS[k])
      .map(k => '    ' + META_SUGGESTION_INSTRUCTIONS[k])
      .join(',\n')
    prompt += `\n\nFor the metaSuggestions object, generate improved versions for ONLY these provided fields:\n${fieldLines}`
  }
  return prompt
}

export interface ContentMeta {
  title?: string
  caption?: string
  description?: string
  hashtags?: string
  altText?: string
  thumbnailText?: string
}

function buildMetaContext(meta: ContentMeta): string {
  const parts: string[] = []
  if (meta.title)         parts.push(`Title: ${meta.title}`)
  if (meta.caption)       parts.push(`Caption: ${meta.caption}`)
  if (meta.description)   parts.push(`Description: ${meta.description}`)
  if (meta.thumbnailText) parts.push(`Thumbnail overlay text: ${meta.thumbnailText}`)
  if (meta.altText)       parts.push(`Alt text: ${meta.altText}`)
  if (meta.hashtags)      parts.push(`Hashtags: ${meta.hashtags}`)
  if (parts.length === 0) return ''
  return `\n\n--- Post metadata (analyze and factor these into scores, suggestions, and metaSuggestions) ---\n${parts.join('\n')}`
}

function getMetaKeys(meta: ContentMeta): string[] {
  return Object.entries(meta)
    .filter(([, v]) => v && String(v).trim().length > 0)
    .map(([k]) => k)
}

export async function analyzeContent(content: string, platform?: Platform, meta?: ContentMeta): Promise<AnalysisResult> {
  const metaKeys = meta ? getMetaKeys(meta) : []
  const systemPrompt = buildSystemPrompt(platform, metaKeys)
  const metaContext = meta ? buildMetaContext(meta) : ''

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
        { role: 'user', content: `Analyze this content:\n\n${content}${metaContext}` },
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
    return JSON.parse(raw) as AnalysisResult
  } catch {
    const clean = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as AnalysisResult
  }
}
