import { NextRequest, NextResponse } from 'next/server'
import { analyzeContent, ContentMeta } from '@/lib/grok'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Platform, MetaSuggestions } from '@/types'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'

// Whisper-supported extensions mapped from common MIME types
const MIME_TO_EXT: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/mpeg': 'mpeg',
  'video/webm': 'webm',
  'video/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/flac': 'flac',
  'audio/opus': 'opus',
}

const FRAME_SYSTEM_PROMPT = `You are an expert social media thumbnail analyst.
Analyze this video frame (first frame) as a thumbnail and return ONLY valid JSON — no markdown, no backticks.
{
  "thumbnailScore": <integer 0-100>,
  "colorFeedback": "<1-2 sentences on color, contrast, visual hierarchy>",
  "textOverlayFeedback": "<1-2 sentences on text in frame, or 'No text overlay detected'>",
  "faceFeedback": "<1-2 sentences on facial expression/emotion, or 'No face detected'>",
  "thumbnailSuggestions": ["<improvement>", "<improvement>"]
}`

export interface VideoAnalysisResult {
  // Transcript analysis
  viralScore: number
  hookStrength: number
  emotionalEngagement: number
  clarity: number
  retentionPotential: number
  summary: string
  suggestions: string[]
  rewrittenHook: string
  hookScore: number
  hookDiagnosis: string
  hookType: string
  // Visual / thumbnail analysis
  thumbnailScore: number
  colorFeedback: string
  textOverlayFeedback: string
  faceFeedback: string
  thumbnailSuggestions: string[]
  // Meta
  transcript: string
  hasTranscript: boolean
  metaSuggestions?: MetaSuggestions
}

async function transcribeAudio(videoBase64: string, mimeType: string, fileName: string): Promise<string> {
  // Convert base64 to binary
  const binaryStr = atob(videoBase64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }

  // Whisper rejects files whose extension isn't in its supported list.
  // Derive a safe extension from the MIME type; fall back to mp4.
  const safeExt = MIME_TO_EXT[mimeType] ?? 'mp4'
  const baseName = (fileName || 'video').replace(/\.[^.]+$/, '')
  const safeFileName = `${baseName}.${safeExt}`

  const blob = new Blob([bytes], { type: mimeType })
  const formData = new FormData()
  formData.append('file', blob, safeFileName)
  formData.append('model', 'whisper-large-v3')
  formData.append('response_format', 'text')

  const res = await fetch(GROQ_WHISPER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Whisper error ${res.status}: ${err}`)
  }

  return await res.text()
}

async function analyzeFrame(frameBase64: string, thumbnailText?: string): Promise<{
  thumbnailScore: number
  colorFeedback: string
  textOverlayFeedback: string
  faceFeedback: string
  thumbnailSuggestions: string[]
}> {
  const thumbNote = thumbnailText
    ? `\nThe creator intends to use this thumbnail overlay text: "${thumbnailText}". Factor this into your textOverlayFeedback.`
    : ''

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      temperature: 0.4,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: FRAME_SYSTEM_PROMPT + thumbNote },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${frameBase64}` },
            },
          ],
        },
      ],
    }),
  })

  if (!res.ok) throw new Error(`Frame analysis error ${res.status}`)

  const data = await res.json()
  const raw: string = data.choices[0].message.content
  try {
    return JSON.parse(raw)
  } catch {
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  }
}

export async function POST(req: NextRequest) {
  try {
    const { videoBase64, mimeType, fileName, frameBase64, platform, meta } = await req.json()

    if (!videoBase64 || !mimeType) {
      return NextResponse.json({ error: 'Video data is required' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const validPlatform = ['tiktok', 'instagram', 'youtube'].includes(platform)
      ? (platform as Platform)
      : undefined

    // Run transcription and frame analysis in parallel
    const [transcript, frameResult] = await Promise.all([
      transcribeAudio(videoBase64, mimeType, fileName || 'video.mp4'),
      frameBase64
        ? analyzeFrame(frameBase64, meta?.thumbnailText)
        : Promise.resolve({
            thumbnailScore: 50,
            colorFeedback: 'No frame provided for visual analysis.',
            textOverlayFeedback: 'No frame provided.',
            faceFeedback: 'No frame provided.',
            thumbnailSuggestions: [],
          }),
    ])

    const hasTranscript = transcript.trim().length > 10

    // Analyze the transcript with existing text analysis
    const contentForAnalysis = hasTranscript
      ? transcript.trim()
      : 'No speech detected in this video.'

    const textResult = await analyzeContent(contentForAnalysis, validPlatform, meta as ContentMeta | undefined)

    const result: VideoAnalysisResult = {
      ...textResult,
      thumbnailScore: frameResult.thumbnailScore,
      colorFeedback: frameResult.colorFeedback,
      textOverlayFeedback: frameResult.textOverlayFeedback,
      faceFeedback: frameResult.faceFeedback,
      thumbnailSuggestions: frameResult.thumbnailSuggestions,
      transcript: transcript.trim(),
      hasTranscript,
      metaSuggestions: textResult.metaSuggestions,
    }

    // Save to analyses table
    await supabase.from('analyses').insert({
      user_id: session.user.id,
      content: hasTranscript ? transcript.trim().substring(0, 500) : '[Video - no speech]',
      result: {
        viralScore: result.viralScore,
        hookStrength: result.hookStrength,
        emotionalEngagement: result.emotionalEngagement,
        clarity: result.clarity,
        retentionPotential: result.retentionPotential,
        summary: result.summary,
        suggestions: result.suggestions,
        rewrittenHook: result.rewrittenHook,
        hookScore: result.hookScore,
        hookDiagnosis: result.hookDiagnosis,
        hookType: result.hookType,
      },
      platform: validPlatform ?? null,
      type: 'video',
    })

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('Video analyze error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
