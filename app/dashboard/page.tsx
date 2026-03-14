// 'use client'
// import EmotionalTerrain from '@/components/EmotionalTerrain'

// export default function Dashboard() {

//   const handleClick = async () => {
    

//   }
  

//   return (
//     <main style={{ width: '100vw', height: '100vh' }}>
//       <EmotionalTerrain />
//       <button onClick={handleClick}>Call</button>
//     </main>
//   )
// }
// app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

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
  .select('call_id, content')
  .eq('user_id', user.id)

  const memoryMap = Object.fromEntries(
    (memories ?? []).map(m => [m.call_id, m.content])
  )
  


  // Map DB shape → terrain shape
  // const terrainCalls = (calls ?? []).map((c, i) => ({
  //   id:         c.id,
  //   mood:       c.mood_score      ?? 3,
  //   volatility: c.sentiment_variance ?? 0.5,
  //   technique:  mapTechnique(c.primary_technique),
  //   label:      c.session_label   ?? `Session ${i + 1}`,
  // }))
  const terrainCalls = (calls ?? []).map((c, i) => ({
    id:         c.id,
    mood:       (c.mood_score ?? 3) * 2,
    volatility: c.sentiment_variance ?? 0.5,
    technique:  mapTechnique(c.primary_technique),
    label:      c.session_label   ?? `Session ${i + 1}`,
    date:       c.scheduled_at,   
    memory:     memoryMap[c.id] ?? null,

  }))

  return <DashboardClient initialCalls={terrainCalls} userId={user.id} />
}

function mapTechnique(t: string | null): 'reflective' | 'reframing' | 'socratic' | 'somatic' {
  const map: Record<string, 'reflective' | 'reframing' | 'socratic' | 'somatic'> = {
    reflective_listening:    'reflective',
    cognitive_reframing:     'reframing',
    socratic_questioning:    'socratic',
    somatic_grounding:       'somatic',
    motivational_interviewing: 'reflective',
    psychoeducation:           'reframing',
  }
  return map[t ?? ''] ?? 'reflective'
}