// components/CallButton.tsx
'use client'

import { useState } from 'react'

type State = 'idle' | 'calling' | 'ringing' | 'error'

export default function CallButton() {
  const [state, setState] = useState<State>('idle')

  async function initiateCall() {
    setState('calling')
    try {
      const res = await fetch('/api/calls/initiate', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setState('ringing')
      // Reset after 10s — user's phone should be ringing by then
      setTimeout(() => setState('idle'), 10_000)
    } catch (e) {
      console.error(e)
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  const label = { idle: 'Start check-in call', calling: 'Connecting...', ringing: 'Check your phone', error: 'Failed — retry' }[state]
  const bg    = { idle: '#60a5fa', calling: '#f59e0b', ringing: '#34d399', error: '#ef4444' }[state]

  return (
    <button
      onClick={initiateCall}
      disabled={state === 'calling' || state === 'ringing'}
      style={{
        padding: '10px 20px',
        background: bg,
        border: 'none',
        borderRadius: 8,
        color: '#050a14',
        fontWeight: 600,
        fontSize: 13,
        letterSpacing: '0.04em',
        cursor: state === 'idle' || state === 'error' ? 'pointer' : 'default',
        transition: 'background 0.2s',
      }}
    >
      {label}
    </button>
  )
}