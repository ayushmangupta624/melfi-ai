// app/dashboard/DashboardClient.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import EmotionalTerrain, { CallData } from '@/components/EmotionalTerrain'
import CallButton from '@/components/CallButton'
import PostCallRating from '@/components/PostCallRating'

interface Props {
  initialCalls: CallData[]
  userId: string
}

export default function DashboardClient({ initialCalls, userId }: Props) {
  const [calls, setCalls]               = useState<CallData[]>(initialCalls)
  const [pendingRating, setPendingRating] = useState<string | null>(null)
  const supabase = createClient()

  // Realtime: watch for completed calls → prompt rating
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-calls-' + userId)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'calls',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const row = payload.new as any
        if (row.status === 'completed' && row.mood_score == null) {
          setPendingRating(row.id)
        }
        if (row.status === 'completed' && row.mood_score != null) {
          // Terrain update after rating submitted
          setCalls(prev => {
            const exists = prev.find(c => c.id === row.id)
            const updated: CallData = {
              id:         row.id,
              mood:       row.mood_score      ?? 3,
              volatility: row.sentiment_variance ?? 0.5,
              technique:  'reflective',
              label:      row.session_label   ?? 'New session',
            }
            return exists
              ? prev.map(c => c.id === row.id ? updated : c)
              : [...prev, updated]
          })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050a14', position: 'relative' }}>
      <EmotionalTerrain calls={calls.length > 0 ? calls : undefined} liveMode />

      {/* Call trigger — top right */}
      <div style={{ position: 'absolute', top: 24, right: 24 }}>
        <CallButton />
      </div>

      {/* Post-call rating overlay */}
      {pendingRating && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(5,10,20,0.85)', backdropFilter: 'blur(8px)',
        }}>
          <PostCallRating
            callId={pendingRating}
            onDone={() => setPendingRating(null)}
          />
        </div>
      )}
    </div>
  )
}