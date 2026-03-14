
// // app/dashboard/DashboardClient.tsx
// 'use client'

// import { useState, useEffect } from 'react'
// import { createClient } from '@/lib/supabase/client'
// import EmotionalTerrain, { CallData } from '@/components/EmotionalTerrain'
// import CallButton from '@/components/CallButton'

// interface Props {
//   initialCalls: CallData[]
//   userId: string
// }

// export default function DashboardClient({ initialCalls, userId }: Props) {
//   const [calls, setCalls]           = useState<CallData[]>(initialCalls)
//   const [isCallActive, setIsCallActive] = useState(false)
//   const supabase = createClient()

//   useEffect(() => {
//     const channel = supabase
//       .channel('dashboard-calls-' + userId)
//       .on('postgres_changes', {
//         event: 'UPDATE',
//         schema: 'public',
//         table: 'calls',
//         filter: `user_id=eq.${userId}`,
//       }, (payload) => {
//         const row = payload.new as any

//         if (row.status === 'in_progress') {
//           setIsCallActive(true)
//         }

//         if (row.status === 'completed' || row.status === 'failed' || row.status === 'missed') {
//           setIsCallActive(false)
//         }

//         if (row.status === 'completed') {
//           setCalls(prev => {
//             const exists = prev.find(c => c.id === row.id)
//             const updated: CallData = {
//               id:         row.id,
//               mood:       row.mood_score         ?? 3,
//               volatility: row.sentiment_variance ?? 0.5,
//               technique:  'reflective',
//               label:      row.session_label      ?? 'New session',
//             }
//             return exists
//               ? prev.map(c => c.id === row.id ? updated : c)
//               : [...prev, updated]
//           })
//         }
//       })
//       .subscribe()

//     return () => { supabase.removeChannel(channel) }
//   }, [userId, supabase])

//   return (
//     <div style={{ width: '100vw', height: '100vh', background: '#050a14', position: 'relative' }}>
//       <EmotionalTerrain calls={calls.length > 0 ? calls : undefined} liveMode={isCallActive} />

//       <div style={{ position: 'absolute', top: 24, right: 24 }}>
//         <CallButton
//           isActive={isCallActive}
//           onCallStarted={() => setIsCallActive(true)}
//         />
//       </div>
//     </div>
//   )
// }
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import EmotionalTerrain, { CallData } from '@/components/EmotionalTerrain'
import CallButton from '@/components/CallButton'

interface Props {
  initialCalls: CallData[]
  userId: string
}

export default function DashboardClient({ initialCalls, userId }: Props) {
  const [calls, setCalls]               = useState<CallData[]>(initialCalls)
  const [isCallActive, setIsCallActive] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-calls-' + userId)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'calls',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const row = payload.new as any

        if (row.status === 'in_progress') setIsCallActive(true)

        if (row.status === 'completed' || row.status === 'failed' || row.status === 'missed') {
          setIsCallActive(false)
        }

        if (row.status === 'completed') {
          setCalls(prev => {
            const exists  = prev.find(c => c.id === row.id)
            const updated: CallData = {
              id:         row.id,
              mood:       row.mood_score         ?? 3,
              volatility: row.sentiment_variance ?? 0.5,
              technique:  'reflective',
              label:      row.session_label      ?? 'New session',
              date:       row.scheduled_at,
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
    <div style={{
      width:      '100vw',
      height:     '100vh',
      background: '#fafaf5',
      position:   'relative',
    }}>
      <EmotionalTerrain
        calls={calls.length > 0 ? calls : undefined}
        liveMode={isCallActive}
      />

      {/* Call button — bottom right, away from the legend */}
      <div style={{
        position: 'absolute',
        bottom:   28,
        right:    28,
      }}>
        <CallButton
          isActive={isCallActive}
          onCallStarted={() => setIsCallActive(true)}
        />
      </div>
    </div>
  )
}