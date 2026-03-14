'use client'

import { useState, useEffect } from 'react'

type State = 'idle' | 'calling' | 'ringing' | 'error'

interface Props {
  isActive?: boolean
  onCallStarted?: () => void
}

export default function CallButton({ isActive, onCallStarted }: Props) {
  const [state, setState] = useState<State>('idle')

  useEffect(() => {
    if (!isActive) setState('idle')
  }, [isActive])
  

  async function initiateCall() {
    setState('calling')
    onCallStarted?.()
    try {
      const res  = await fetch('/api/calls/initiate', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setState('ringing')
      setTimeout(() => setState('idle'), 10_000)
    } catch (e) {
      console.error(e)
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  if (isActive) {
    return (
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        10,
        padding:    '10px 18px',
        background: 'rgba(194,65,12,0.06)',
        border:     '1px solid rgba(194,65,12,0.2)',
        borderRadius: 8,
        fontFamily: '"DM Mono", monospace',
      }}>
        <div style={{
          width:        7,
          height:       7,
          borderRadius: '50%',
          background:   '#ea580c',
          flexShrink:   0,
          animation:    'cbPulse 1.4s ease-in-out infinite',
        }} />
        <span style={{ fontSize: 11, color: '#ea580c', letterSpacing: '0.12em' }}>
          SESSION IN PROGRESS
        </span>
        <style>{`
          @keyframes cbPulse {
            0%,100%{opacity:1;transform:scale(1)}
            50%{opacity:0.35;transform:scale(1.5)}
          }
        `}</style>
      </div>
    )
  }

  const configs = {
    idle:    { label: 'Start check-in call', bg: '#c2410c', hover: '#b91c1c', color: '#fafaf5', border: 'transparent' },
    calling: { label: 'Connecting...',       bg: 'transparent', hover: 'transparent', color: '#c2410c', border: 'rgba(194,65,12,0.3)' },
    ringing: { label: 'Check your phone',    bg: 'transparent', hover: 'transparent', color: '#c2410c', border: 'rgba(194,65,12,0.3)' },
    error:   { label: 'Failed — retry',      bg: 'transparent', hover: 'transparent', color: 'rgba(28,25,23,0.5)', border: 'rgba(28,25,23,0.15)' },
  }
  const cfg = configs[state]

  return (
    <button
      onClick={initiateCall}
      disabled={state === 'calling' || state === 'ringing'}
      style={{
        padding:       '10px 20px',
        background:    cfg.bg,
        border:        `1px solid ${cfg.border}`,
        borderRadius:  8,
        color:         cfg.color,
        fontWeight:    500,
        fontSize:      12,
        letterSpacing: '0.08em',
        fontFamily:    '"DM Mono", monospace',
        cursor:        state === 'idle' || state === 'error' ? 'pointer' : 'default',
        transition:    'all 0.15s',
      }}
      onMouseEnter={e => { if (state === 'idle') (e.currentTarget as HTMLButtonElement).style.background = cfg.hover }}
      onMouseLeave={e => { if (state === 'idle') (e.currentTarget as HTMLButtonElement).style.background = cfg.bg }}
    >
      {cfg.label}
    </button>
  )
}