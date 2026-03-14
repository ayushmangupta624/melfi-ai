// // app/api/calls/process/route.ts
// import { NextResponse } from 'next/server'
// import Anthropic from '@anthropic-ai/sdk'
// import OpenAI from 'openai'
// import { createServiceClient } from '@/lib/supabase/server'

// const claude   = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
// const embedder = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// export async function POST(req: Request) {
//   if (req.headers.get('x-internal-secret') !== process.env.INTERNAL_SECRET) {
//     return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
//   }

//   const { callId, userId, transcript } = await req.json()
//   const supabase = await createServiceClient()

//   // ── Analyse transcript ────────────────────────────────────────────────────
//   const analysis = await claude.messages.create({
//     model: 'claude-haiku-4-5-20251001',
//     max_tokens: 512,
//     messages: [{
//       role: 'user',
//       content: `Analyze this therapy call transcript. Return ONLY valid JSON, no markdown, no explanation.
// {
//   "mood_score": <number 1-10>,
//   "sentiment_variance": <number 0-1, how much mood shifted>,
//   "primary_technique": <"reflective_listening"|"cognitive_reframing"|"socratic_questioning"|"somatic_grounding"|"motivational_interviewing"|"psychoeducation">,
//   "session_label": <string, 3-5 words>,
//   "themes": <string[]>,
//   "entities": <string[], named people or places mentioned>,
//   "memory_summary": <string, 1-2 sentences worth remembering for next call>
// }

// Transcript:
// ${transcript}`,
//     }],
//   })

//   let parsed: any
//   try {
//     parsed = JSON.parse((analysis.content[0] as any).text)
//   } catch {
//     console.error('Failed to parse analysis JSON')
//     return NextResponse.json({ error: 'Parse failed' }, { status: 500 })
//   }

//   // ── Update call ───────────────────────────────────────────────────────────
//   await supabase.from('calls').update({
//     mood_score:         parsed.mood_score,
//     sentiment_variance: parsed.sentiment_variance,
//     primary_technique:  parsed.primary_technique,
//     session_label:      parsed.session_label,
//   }).eq('id', callId)

//   // ── Embed and store memory ────────────────────────────────────────────────
//   const embRes = await embedder.embeddings.create({
//     model: 'text-embedding-3-small',
//     input: parsed.memory_summary,
//   })

//   await supabase.from('memory_chunks').insert({
//     user_id:   userId,
//     call_id:   callId,
//     content:   parsed.memory_summary,
//     embedding: embRes.data[0].embedding,
//     themes:    parsed.themes,
//     entities:  parsed.entities,
//   })

//   // ── Reward signal ─────────────────────────────────────────────────────────
//   const { data: callData } = await supabase
//     .from('calls')
//     .select('duration_seconds')
//     .eq('id', callId)
//     .single()

//   const durationRatio = Math.min((callData?.duration_seconds ?? 0) / 300, 1.5)

//   await supabase.from('reward_signals').insert({
//     call_id:        callId,
//     user_id:        userId,
//     duration_ratio: durationRatio,
//   })

//   return NextResponse.json({ ok: true })
// }
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

  // ── Reward signal ─────────────────────────────────────────────────────────
  const { data: callData } = await supabase
    .from('calls')
    .select('duration_seconds')
    .eq('id', callId)
    .single()

  const durationRatio = Math.min((callData?.duration_seconds ?? 0) / 300, 1.5)

  await supabase.from('reward_signals').insert({
    call_id:        callId,
    user_id:        userId,
    duration_ratio: durationRatio,
  })

  return NextResponse.json({ ok: true })
}