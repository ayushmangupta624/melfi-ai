// // app/api/calls/initiate/route.ts
// import { NextResponse } from 'next/server'
// import { createClient, createServiceClient } from '@/lib/supabase/server'

// export async function POST() {
//   const supabase = await createClient()
//   const service  = await createServiceClient()

//   const { data: { user } } = await supabase.auth.getUser()
//   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

//   const { data: profile } = await supabase
//     .from('users')
//     .select('phone, fname')
//     .eq('id', user.id)
//     .single()

//   if (!profile?.phone) {
//     return NextResponse.json({ error: 'No phone number on file' }, { status: 400 })
//   }

//   // Fetch top 5 memory chunks for context injection
//   const { data: memories } = await supabase
//     .from('memory_chunks')
//     .select('content')
//     .eq('user_id', user.id)
//     .order('created_at', { ascending: false })
//     .limit(5)

//   const memoryContext = memories?.length
//     ? memories.map(m => `- ${m.content}`).join('\n')
//     : 'This is the first session. No prior context.'

//   // Create call record
//   const { data: callRecord, error } = await service
//     .from('calls')
//     .insert({ user_id: user.id, status: 'scheduled', scheduled_at: new Date().toISOString() })
//     .select()
//     .single()

//   if (error || !callRecord) {
//     return NextResponse.json({ error: 'Failed to create call record' }, { status: 500 })
//   }

//   // Hit Vapi
//   const vapiRes = await fetch('https://api.vapi.ai/call/phone', {
//     method: 'POST',
//     headers: {
//       Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
//       assistantId:   process.env.VAPI_ASSISTANT_ID,
//       customer:      { number: profile.phone },
//       assistantOverrides: {
//         model: {
//           messages: [{
//             role: 'system',
//             content: `You are calling ${profile.fname} for their daily check-in.\nWhat you know about them:\n${memoryContext}`,
//           }],
//         },
//         metadata: { supabase_call_id: callRecord.id },
//       },
//     }),
//   })

//   const vapiCall = await vapiRes.json()

//   if (!vapiCall.id) {
//     await service.from('calls').update({ status: 'failed' }).eq('id', callRecord.id)
//     console.log('Vapi response:', JSON.stringify(vapiCall, null, 2))  // add this
//     return NextResponse.json({ error: 'Vapi failed to initiate call' }, { status: 500 })
//   }


//   await service
//     .from('calls')
//     .update({ vapi_call_id: vapiCall.id, status: 'in_progress' })
//     .eq('id', callRecord.id)

//   return NextResponse.json({ callId: callRecord.id, vapiCallId: vapiCall.id })
// }
// app/api/calls/initiate/route.ts
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const service  = await createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('phone, fname')
    .eq('id', user.id)
    .single()

  if (!profile?.phone) {
    return NextResponse.json({ error: 'No phone number on file' }, { status: 400 })
  }

  const { data: memories } = await supabase
    .from('memory_chunks')
    .select('content')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const memoryContext = memories?.length
    ? memories.map(m => `- ${m.content}`).join('\n')
    : 'This is the first session. No prior context.'

  const { data: callRecord, error } = await service
    .from('calls')
    .insert({ user_id: user.id, status: 'scheduled', scheduled_at: new Date().toISOString() })
    .select()
    .single()

  if (error || !callRecord) {
    return NextResponse.json({ error: 'Failed to create call record' }, { status: 500 })
  }

  const vapiRes = await fetch('https://api.vapi.ai/call/phone', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
      assistantId:   process.env.VAPI_ASSISTANT_ID,
      customer:      { number: profile.phone },
      assistantOverrides: {
        variableValues: {
          memory: memoryContext,
        },
        firstMessage: `Hey ${profile.fname}, it's your daily check-in. How are you feeling today?`,
        metadata: { supabase_call_id: callRecord.id },
      },
    }),
  })

  const vapiCall = await vapiRes.json()
  console.log('Vapi response:', JSON.stringify(vapiCall, null, 2))

  if (!vapiCall.id) {
    await service.from('calls').update({ status: 'failed' }).eq('id', callRecord.id)
    return NextResponse.json({ error: 'Vapi failed to initiate call' }, { status: 500 })
  }

  await service
    .from('calls')
    .update({ vapi_call_id: vapiCall.id, status: 'in_progress' })
    .eq('id', callRecord.id)

  return NextResponse.json({ callId: callRecord.id, vapiCallId: vapiCall.id })
}