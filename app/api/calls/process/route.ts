import Groq from 'groq-sdk'
import { pipeline } from '@xenova/transformers'
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
let embedder: any = null

async function getEmbedder() {
  if (!embedder) embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  return embedder
}

async function embed(text: string): Promise<number[]> {
  const model = await getEmbedder()
  const output = await model(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data)
}

export async function POST(req: Request) {
  if (req.headers.get('x-internal-secret') !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { callId, userId, transcript } = await req.json()
  const supabase = await createServiceClient()

  // ── Analyse with Groq (free) ──────────────────────────────────────────────
  const analysis = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    response_format: { type: 'json_object' },
    messages: [{
      role: 'user',
      content: `Analyze this therapy call transcript. Return ONLY valid JSON:
{
  "mood_score": <number 1-10>,
  "sentiment_variance": <number 0-1>,
  "primary_technique": <"reflective_listening"|"cognitive_reframing"|"socratic_questioning"|"somatic_grounding"|"motivational_interviewing"|"psychoeducation">,
  "session_label": <string, 3-5 words>,
  "themes": <string[]>,
  "entities": <string[], named people or places>,
  "memory_summary": <string, 1-2 sentences for next session>
}

Transcript:
${transcript}`,
    }],
  })

  const parsed = JSON.parse(analysis.choices[0].message.content!)

  // ── Update call ───────────────────────────────────────────────────────────
  await supabase.from('calls').update({
    mood_score:         parsed.mood_score,
    sentiment_variance: parsed.sentiment_variance,
    primary_technique:  parsed.primary_technique,
    session_label:      parsed.session_label,
  }).eq('id', callId)

  // ── Embed and store memory (free, local) ──────────────────────────────────
  const embedding = await embed(parsed.memory_summary)

  await supabase.from('memory_chunks').insert({
    user_id:   userId,
    call_id:   callId,
    content:   parsed.memory_summary,
    embedding,
    themes:    parsed.themes,
    entities:  parsed.entities,
  })

  return NextResponse.json({ ok: true })
}