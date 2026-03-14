// app/api/vapi/webhook/route.ts
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { message } = body                    // vapi will wrap everything in a message obj
  const type = message?.type
  const call = message?.call

  if (!call?.id) return NextResponse.json({ ok: true })

  const supabase = await createServiceClient()

  const { data: callRecord } = await supabase
    .from('calls')
    .select('id, user_id')
    .eq('vapi_call_id', call.id)
    .single()

  if (!callRecord) return NextResponse.json({ ok: true })

  switch (type) {
    case 'call-started':
      await supabase
        .from('calls')
        .update({ status: 'in_progress', started_at: new Date().toISOString(), picked_up: true })
        .eq('id', callRecord.id)
      break

    case 'transcript': {
      const { role, transcript, turnIndex } = message
      if (!transcript?.trim()) break
      await supabase.from('call_turns').insert({
        call_id:    callRecord.id,
        user_id:    callRecord.user_id,
        role:       role === 'assistant' ? 'assistant' : 'user',
        content:    transcript,
        turn_index: turnIndex ?? 0,
        spoken_at:  new Date().toISOString(),
      })
      break
    }

    case 'end-of-call-report': {
      // This is the most useful Vapi event — fires once at end with full transcript
      const { transcript: fullTranscript, recordingUrl, endedReason } = message

      await supabase
        .from('calls')
        .update({ status: 'completed', ended_at: new Date().toISOString() })
        .eq('id', callRecord.id)

      // Kick off async post-processing — fire and forget
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/calls/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.INTERNAL_SECRET!,
        },
        body: JSON.stringify({
          callId:     callRecord.id,
          userId:     callRecord.user_id,
          transcript: fullTranscript,
        }),
      })
      break
    }

    case 'call-failed':
      await supabase
        .from('calls')
        .update({ status: message.endedReason === 'no-answer' ? 'missed' : 'failed' })
        .eq('id', callRecord.id)
      break
  }

  return NextResponse.json({ ok: true })
}