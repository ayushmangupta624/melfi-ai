// components/PostCallRating.tsx
'use client'

import { useState } from 'react'

export default function PostCallRating({ callId, onDone }: { callId: string, onDone: () => void }) {
  const [rating, setRating]     = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function submit() {
    if (!rating) return
    await fetch('/api/calls/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId, rating }),
    })
    setSubmitted(true)
    setTimeout(onDone, 1500)
  }

  return (
    <div style={{ textAlign: 'center', fontFamily: '"DM Mono", monospace' }}>
      {submitted ? (
        <p style={{ color: '#34d399', fontSize: 16 }}>Logged. See you tomorrow.</p>
      ) : (
        <>
          <p style={{ color: '#e2e8f0', fontSize: 14, marginBottom: 20, letterSpacing: '0.06em' }}>
            HOW HEARD DID YOU FEEL?
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} onClick={() => setRating(n)} style={{
                width: 40, height: 40, borderRadius: 6,
                background: rating === n ? '#60a5fa' : 'transparent',
                border: `1px solid ${rating === n ? '#60a5fa' : '#1a3060'}`,
                color: rating === n ? '#050a14' : '#60a5fa',
                fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={submit}
            disabled={!rating}
            style={{
              marginTop: 24, padding: '10px 32px',
              background: rating ? '#60a5fa' : '#1a3060',
              border: 'none', borderRadius: 8,
              color: rating ? '#050a14' : '#4a6080',
              fontSize: 13, fontWeight: 600, cursor: rating ? 'pointer' : 'default',
              transition: 'all 0.15s',
            }}
          >
            Submit
          </button>
        </>
      )}
    </div>
  )
}