'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StepDone({ name }: { name: string }) {
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => router.push('/dashboard'), 2800)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>

      {/* Animated checkmark */}
      <div style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        border: '1px solid #f59e0b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 28px',
        animation: 'fadeIn 0.4s ease',
      }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M4 11L9 16L18 6"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: 'drawCheck 0.4s ease 0.2s both' }}
          />
        </svg>
      </div>

      <h2 style={{
        fontSize: 24,
        fontWeight: 500,
        color: '#dce8f5',
        letterSpacing: '-0.02em',
        margin: '0 0 10px',
      }}>
        You're all set, {name}.
      </h2>

      <p style={{
        fontSize: 13,
        color: '#2d4a6a',
        margin: '0 0 32px',
        lineHeight: 1.6,
      }}>
        Your first check-in call is ready whenever you are.
        Heading to your dashboard now.
      </p>

      {/* Loading bar */}
      <div style={{ height: 1, background: '#0d1e35', borderRadius: 1, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #1e3a5f, #f59e0b)',
          borderRadius: 1,
          animation: 'loadBar 2.8s linear forwards',
        }} />
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes drawCheck {
          from { stroke-dasharray: 0 40; }
          to   { stroke-dasharray: 40 0; }
        }
        @keyframes loadBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  )
}