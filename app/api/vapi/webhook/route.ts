import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.json()
  console.log('Webhook type:', body.message?.type)
  console.log('Call ID:', body.message?.call?.id)

  const { message } = body
  const type = message?.type
  const call = message?.call

  if (!call?.id) {
    console.log('No call ID, returning early')
    return NextResponse.json({ ok: true })
  }

  const supabase = await createServiceClient()

  const { data: callRecord } = await supabase
    .from('calls')
    .select('id, user_id')
    .eq('vapi_call_id', call.id)
    .single()

  console.log('Call record found:', callRecord?.id ?? 'NOT FOUND')

  if (!callRecord) return NextResponse.json({ ok: true })

  switch (type) {
    case 'call-started':
      await supabase
        .from('calls')
        .update({ status: 'in_progress', started_at: new Date().toISOString(), picked_up: true })
        .eq('id', callRecord.id)
      break

    // case 'transcript': {
    //   const { role, transcript, turnIndex } = message
    //   if (!transcript?.trim()) break
    //   await supabase.from('call_turns').insert({
    //     call_id:    callRecord.id,
    //     user_id:    callRecord.user_id,
    //     role:       role === 'assistant' ? 'assistant' : 'user',
    //     content:    transcript,
    //     turn_index: turnIndex ?? 0,
    //     spoken_at:  new Date().toISOString(),
    //   })
    //   break
    // }
    case 'conversation-update': {
        const messages = message.conversation ?? []
        for (const [index, msg] of messages.entries()) {
          if (!msg.content?.trim()) continue
          const { error } = await supabase.from('call_turns').upsert({
            call_id:    callRecord.id,
            user_id:    callRecord.user_id,
            role:       msg.role === 'assistant' ? 'assistant' : 'user',
            content:    msg.content,
            turn_index: index,
            spoken_at:  new Date().toISOString(),
          }, { onConflict: 'call_id,turn_index' })
          if (error) console.log('call_turns insert error:', error)
        }
        break
      }
      

    case 'end-of-call-report': {
      console.log('end-of-call-report received, triggering processing')
      const { transcript: fullTranscript, endedReason } = message

      await supabase
        .from('calls')
        .update({ status: 'completed', ended_at: new Date().toISOString() })
        .eq('id', callRecord.id)

    const baseUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : process.env.NEXT_PUBLIC_APP_URL
    

      const processRes = await fetch(`${baseUrl}/api/calls/process`, {
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
      console.log('Process route response:', processRes.status)
      break
    }

    case 'status-update': {
        const status = message.status
        if (status === 'in-progress') {
          await supabase
            .from('calls')
            .update({ started_at: new Date().toISOString(), picked_up: true })
            .eq('id', callRecord.id)
        }
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