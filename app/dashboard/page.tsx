import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'
import { Suspense } from 'react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: calls } = await supabase
    .from('calls')
    .select('id, mood_score, sentiment_variance, primary_technique, session_label, status, scheduled_at')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('scheduled_at', { ascending: true })

  const { data: memories } = await supabase
    .from('memory_chunks')
    .select('call_id, content, created_at')
    .eq('user_id', user.id)

  const { data: profile } = await supabase
    .from('users')
    .select('fname')
    .eq('id', user.id)
    .single()

  const memoryMap = Object.fromEntries(
    (memories ?? []).map(m => [m.call_id, m.content])
  )

  const terrainCalls = (calls ?? []).map((c, i) => ({
    id:         c.id,
    mood:       (c.mood_score ?? 3) * 2,
    volatility: c.sentiment_variance ?? 0.5,
    technique:  mapTechnique(c.primary_technique),
    label:      c.session_label   ?? `Session ${i + 1}`,
    date:       c.scheduled_at,
    memory:     memoryMap[c.id] ?? null,
  }))

  // Unique session dates (YYYY-MM-DD) from memory_chunks, descending
  const sessionDates = [...new Set(
    (memories ?? []).map(m => m.created_at.substring(0, 10))
  )].sort().reverse()

  // Streak: consecutive days ending today or yesterday
  const todayStr     = new Date().toISOString().substring(0, 10)
  const yesterdayStr = new Date(Date.now() - 86_400_000).toISOString().substring(0, 10)
  const dateSet      = new Set(sessionDates)
  const startDate    = dateSet.has(todayStr) ? todayStr
                     : dateSet.has(yesterdayStr) ? yesterdayStr
                     : null

  let streakDays = 0
  if (startDate) {
    let d = new Date(startDate)
    while (dateSet.has(d.toISOString().substring(0, 10))) {
      streakDays++
      d = new Date(d.getTime() - 86_400_000)
    }
  }

  return (
    <Suspense fallback = {null}>
    <DashboardClient
      initialCalls={terrainCalls}
      userId={user.id}
      userName={profile?.fname ?? 'Friend'}
      streakDays={streakDays}
      sessionDates={sessionDates}
    />
    </Suspense>
  )
}

function mapTechnique(t: string | null): 'reflective' | 'reframing' | 'socratic' | 'somatic' {
  const map: Record<string, 'reflective' | 'reframing' | 'socratic' | 'somatic'> = {
    reflective_listening:      'reflective',
    cognitive_reframing:       'reframing',
    socratic_questioning:      'socratic',
    somatic_grounding:         'somatic',
    motivational_interviewing: 'reflective',
    psychoeducation:           'reframing',
  }
  return map[t ?? ''] ?? 'reflective'
}
