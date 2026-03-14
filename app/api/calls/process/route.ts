import Groq from 'groq-sdk'
// import { pipeline } from '@xenova/transformers'
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
// let embedder: any = null

// async function getEmbedder() {
//   if (!embedder) embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
//   return embedder
// }

// async function embed(text: string): Promise<number[]> {
//   const model = await getEmbedder()
//   const output = await model(text, { pooling: 'mean', normalize: true })
//   return Array.from(output.data)
// }
// async function embed(text: string): Promise<number[]> {
//   const res = await fetch(
//     'https://router.huggingface.co/hf-inference/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
//     {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${process.env.HF_API_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
//     }
//   )
//   const data = await res.json()
//   // HF returns a nested array for sentence transformers — flatten it
//   return Array.isArray(data[0]) ? data[0] : data
// }

async function embed(text: string): Promise<number[]> {
  const res = await fetch(
    'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    }
  )
  const text2 = await res.text()
  console.log('HF raw response:', text2)
  const data = JSON.parse(text2)
  return Array.isArray(data[0]) ? data[0] : data
}

export async function POST(req: Request) {
  if (req.headers.get('x-internal-secret') !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { callId, userId, transcript } = await req.json()
  console.log('process: callId', callId, 'userId', userId)
  console.log('process: transcript length', transcript?.length ?? 0)

  const supabase = await createServiceClient()

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
  console.log('process: groq parsed', JSON.stringify(parsed))

  const { error: callUpdateError } = await supabase.from('calls').update({
    mood_score:         parsed.mood_score,
    sentiment_variance: parsed.sentiment_variance,
    primary_technique:  parsed.primary_technique,
    session_label:      parsed.session_label,
  }).eq('id', callId)
  console.log('process: call update error', callUpdateError)

  const embedding = await embed(parsed.memory_summary)
  console.log('process: embedding length', embedding?.length)

  const { error: memoryError } = await supabase.from('memory_chunks').insert({
    user_id:   userId,
    call_id:   callId,
    content:   parsed.memory_summary,
    embedding,
    themes:    parsed.themes,
    entities:  parsed.entities,
  })
  console.log('process: memory insert error', memoryError)

  return NextResponse.json({ ok: true })
}