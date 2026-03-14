// app/api/calls/rate/route.ts
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const service  = await createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { callId, rating } = await req.json()

  const { data: signal } = await supabase
    .from('reward_signals')
    .select('duration_ratio')
    .eq('call_id', callId)
    .single()

  const combinedReward =
    0.5 * (rating / 10) +
    0.3 * (signal?.duration_ratio ?? 0.5) +
    0.2 * 0.5  // pickup_next_day: neutral prior until tomorrow

  await service.from('reward_signals').update({
    rating,
    combined_reward: combinedReward,
  }).eq('call_id', callId)

  // Sync mood_score so terrain updates immediately
  await service.from('calls')
    .update({ mood_score: rating })
    .eq('id', callId)

  return NextResponse.json({ ok: true })
}