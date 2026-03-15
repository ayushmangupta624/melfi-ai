'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import EmotionalTerrain, { CallData } from '@/components/EmotionalTerrain'
import CallButton from '@/components/CallButton'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  initialCalls: CallData[]
  userId: string
  userName: string
  streakDays: number
  sessionDates: string[] // YYYY-MM-DD, descending
}

type View = 'dashboard' | 'terrain' | 'insights'

const TECHNIQUE_LABELS: Record<string, string> = {
  reflective: 'Reflective Listening',
  reframing:  'Cognitive Reframing',
  socratic:   'Socratic Questioning',
  somatic:    'Somatic Grounding',
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function IconDashboard({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function IconTerrain({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20l6-11 4 6 3-4 5 9H3z" />
    </svg>
  )
}

function IconInsights({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV_ITEMS: { id: View; label: string; Icon: React.FC<{ size?: number; color?: string }> }[] = [
    { id: 'terrain',   label: 'Terrain',   Icon: IconTerrain   },
  { id: 'dashboard', label: 'Dashboard', Icon: IconDashboard },
  { id: 'insights',  label: 'Insights',  Icon: IconInsights  },
]

function Sidebar({ userName, activeView, setActiveView }: {
  userName: string; activeView: View; setActiveView: (v: View) => void
}) {
  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: 'white',
      borderRight: '1px solid #f0ebe5',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 18px', borderBottom: '1px solid #f0ebe5' }}>
        <img src="/melfi-removebg-preview.png" alt="Melfi" style={{ height: 100, width: 'auto', display: 'block' }} />
      </div>

      {/* User */}
      <div style={{ padding: '14px 20px 16px', borderBottom: '1px solid #f0ebe5' }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#1c1917', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {userName}
        </div>
        <div style={{ fontSize: 11, color: '#a8a29e', marginTop: 2 }}>Member</div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 10px', flex: 1 }}>
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = activeView === id
          return (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 12px', borderRadius: 10,
                border: 'none', cursor: 'pointer', marginBottom: 2,
                background: active ? '#fff7ed' : 'transparent',
                color: active ? '#c2410c' : '#78716c',
                fontSize: 13, fontWeight: active ? 600 : 500,
                textAlign: 'left',
              }}
            >
              <Icon size={16} color={active ? '#c2410c' : '#78716c'} />
              {label}
              {active && (
                <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#c2410c' }} />
              )}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

// ─── Shared: Ring + MetricCard ────────────────────────────────────────────────
function Ring({ percent, color = '#c2410c' }: { percent: number; color?: string }) {
  const r = 26, circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.max(0, Math.min(100, percent)) / 100)
  return (
    <svg width={64} height={64} style={{ flexShrink: 0 }}>
      <circle cx={32} cy={32} r={r} fill="none" stroke="#f0ebe5" strokeWidth={5} />
      <circle cx={32} cy={32} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 32 32)" />
      <text x={32} y={36} textAnchor="middle" fontSize={11} fontWeight="600" fill={color}>
        {Math.round(percent)}%
      </text>
    </svg>
  )
}

function MetricCard({ icon, title, value, suffix, sub, percent, color }: {
  icon: string; title: string; value: string | number
  suffix?: string; sub?: string; percent: number; color?: string
}) {
  return (
    <div style={{ background: 'white', borderRadius: 18, padding: '20px 22px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 13, color: '#78716c', fontWeight: 500 }}>
          <span style={{ marginRight: 6 }}>{icon}</span>{title}
        </span>
        <Ring percent={percent} color={color} />
      </div>
      <div style={{ marginTop: 4 }}>
        <span style={{ fontSize: 34, fontWeight: 700, color: '#1c1917', letterSpacing: '-1px', lineHeight: 1 }}>{value}</span>
        {suffix && <span style={{ fontSize: 13, color: '#a8a29e', marginLeft: 3 }}>{suffix}</span>}
      </div>
      {sub && <div style={{ fontSize: 12, color: '#78716c', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

// ─── Dashboard: chart + profile + recent sessions ────────────────────────────
function MoodChart({ calls }: { calls: CallData[] }) {
  const recent = calls.slice(-12)
  if (recent.length === 0) {
    return (
      <div style={{
        background: 'white', borderRadius: 18, padding: 24,
        boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260,
      }}>
        <span style={{ color: '#c4b5a5', fontSize: 14 }}>No sessions yet — start your first check-in</span>
      </div>
    )
  }
  const chartH = 140, chartW = 440, padL = 28, padB = 30
  const slotW  = chartW / recent.length
  const barW   = Math.max(Math.min(slotW * 0.32, 14), 5)
  return (
    <div style={{ background: 'white', borderRadius: 18, padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: '#1c1917' }}>Session History</span>
        <div style={{ display: 'flex', gap: 16 }}>
          {[['#c2410c', 'Mood'], ['#fbbf24', 'Stability']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#78716c' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />{l}
            </div>
          ))}
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${chartW + padL + 10} ${chartH + padB + 10}`} style={{ overflow: 'visible' }}>
        {[0, 2.5, 5, 7.5, 10].map(v => {
          const y = chartH - (v / 10) * chartH
          return (
            <g key={v}>
              <line x1={padL} x2={chartW + padL} y1={y} y2={y} stroke="#f5f0eb" strokeWidth={1} />
              <text x={padL - 4} y={y + 4} fontSize={9} fill="#c4b5a5" textAnchor="end">{v}</text>
            </g>
          )
        })}
        {recent.map((c, i) => {
          const moodH   = ((c.mood / 2) / 10) * chartH
          const stabilH = (1 - c.volatility) * chartH
          const cx      = padL + i * slotW + slotW / 2
          const label   = c.date
            ? new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : `S${i + 1}`
          return (
            <g key={c.id}>
              <rect x={cx - barW - 1} y={chartH - moodH}   width={barW} height={moodH}   rx={3} fill="#c2410c" opacity={0.85} />
              <rect x={cx + 1}        y={chartH - stabilH} width={barW} height={stabilH} rx={3} fill="#fbbf24" opacity={0.85} />
              <text x={cx} y={chartH + 17} fontSize={8} fill="#c4b5a5" textAnchor="middle">{label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ProfileCard({ userName, totalSessions, avgMood, avgStability, topTechnique }: {
  userName: string; totalSessions: number; avgMood: number; avgStability: number; topTechnique?: string
}) {
  const initial = (userName || 'U').charAt(0).toUpperCase()
  return (
    <div style={{ background: 'white', borderRadius: 18, padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #c2410c 0%, #fbbf24 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: 'white', fontWeight: 700, flexShrink: 0,
        }}>{initial}</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#1c1917' }}>{userName}</div>
          <div style={{ fontSize: 12, color: '#a8a29e' }}>Melfi Member</div>
        </div>
      </div>
      <div style={{ height: 1, background: '#f5f0eb', margin: '0 0 16px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', gap: 8, marginBottom: 16 }}>
        {([
          [totalSessions, 'Sessions'],
          [totalSessions > 0 ? avgMood.toFixed(1) : '—', 'Avg Mood'],
          [totalSessions > 0 ? Math.round(avgStability * 100) + '%' : '—', 'Stable'],
        ] as [string | number, string][]).map(([val, label]) => (
          <div key={label}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1c1917' }}>{val}</div>
            <div style={{ fontSize: 10, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
      {/* <div style={{ background: '#fafaf5', borderRadius: 10, padding: '10px 14px' }}>
        {topTechnique ? (
          <>
            <div style={{ fontSize: 11, color: '#a8a29e', marginBottom: 3 }}>Top Technique</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#c2410c' }}>{TECHNIQUE_LABELS[topTechnique] ?? topTechnique}</div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: '#a8a29e', textAlign: 'center' }}>Complete your first session to see insights</div>
        )}
      </div> */}
    </div>
  )
}

function RecentSessionCard({ call, index }: { call: CallData; index: number }) {
  const mood       = call.mood / 2
  const stability  = Math.round((1 - call.volatility) * 100)
  const date       = call.date
    ? new Date(call.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : `Session ${index + 1}`
  const moodColor  = mood >= 7 ? '#16a34a' : mood >= 4 ? '#d97706' : '#dc2626'
  return (
    <div style={{ background: 'white', borderRadius: 14, padding: '16px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#a8a29e' }}>{date}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: moodColor, background: moodColor + '18', borderRadius: 20, padding: '2px 8px' }}>
          Mood {mood.toFixed(1)}
        </span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginBottom: 6 }}>{call.label}</div>
      {call.memory && (
        <div style={{
          fontSize: 12, color: '#78716c', fontStyle: 'italic',
          borderLeft: '2px solid #fbbf24', paddingLeft: 8,
          display: '-webkit-box', overflow: 'hidden',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        } as React.CSSProperties}>
          {call.memory}
        </div>
      )}
      <div style={{ marginTop: 8, fontSize: 11, color: '#a8a29e' }}>
        {stability}% stable · {TECHNIQUE_LABELS[call.technique] ?? call.technique}
      </div>
    </div>
  )
}

// ─── Dashboard View ───────────────────────────────────────────────────────────
function DashboardView({ calls, isCallActive, setIsCallActive, userName }: {
  calls: CallData[]; isCallActive: boolean; setIsCallActive: (v: boolean) => void; userName: string
}) {
  const metrics = useMemo(() => {
    if (!calls.length) return { avgMood: 0, avgStability: 0, topTechnique: undefined as string | undefined, thisMonth: 0 }
    const avgMood      = calls.reduce((s, c) => s + c.mood / 2, 0) / calls.length
    const avgStability = calls.reduce((s, c) => s + (1 - c.volatility), 0) / calls.length
    const techCounts   = calls.reduce((acc, c) => ({ ...acc, [c.technique]: (acc[c.technique] ?? 0) + 1 }), {} as Record<string, number>)
    const topTechnique = Object.entries(techCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    const now          = new Date()
    const thisMonth    = calls.filter(c => {
      if (!c.date) return false
      const d = new Date(c.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    return { avgMood, avgStability, topTechnique, thisMonth }
  }, [calls])

  const recentSessions = [...calls].reverse().slice(0, 3)

  return (
    <div style={{ padding: '28px 36px 48px' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#a8a29e', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>Overview</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#1c1917' }}>
            Welcome, <span style={{ color: '#c2410c' }}>{userName}</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isCallActive && (
            <div style={{
              fontSize: 12, fontWeight: 600, color: '#c2410c',
              background: '#fff7ed', borderRadius: 20, padding: '6px 14px',
              border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#c2410c', display: 'inline-block' }} />
              Session in progress
            </div>
          )}
          <CallButton isActive={isCallActive} onCallStarted={() => setIsCallActive(true)} />
        </div>
      </header>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 22 }}>
        <MetricCard icon="" title="Total Sessions" value={calls.length} suffix="sessions"
          percent={Math.min(calls.length / 30 * 100, 100)} color="#c2410c"
          sub={metrics.thisMonth > 0 ? `+${metrics.thisMonth} this month` : 'Start your first session'} />
        <MetricCard icon="" title="Avg Mood Score"
          value={calls.length > 0 ? metrics.avgMood.toFixed(1) : '—'} suffix={calls.length > 0 ? '/10' : ''}
          percent={calls.length > 0 ? (metrics.avgMood / 10) * 100 : 0} color="#f97316"
          sub={calls.length > 0 ? (metrics.avgMood >= 6 ? 'Positive trend' : 'Keep going') : undefined} />
        <MetricCard icon="" title="Session Stability"
          value={calls.length > 0 ? Math.round(metrics.avgStability * 100) : '—'} suffix={calls.length > 0 ? '%' : ''}
          percent={calls.length > 0 ? metrics.avgStability * 100 : 0} color="#7c3aed"
          sub={calls.length > 0 ? (metrics.avgStability >= 0.7 ? 'Very consistent' : 'Building rhythm') : undefined} />
        <MetricCard icon="" title="This Month" value={metrics.thisMonth} suffix="sessions"
          percent={Math.min(metrics.thisMonth / 10 * 100, 100)} color="#059669"
          sub={metrics.thisMonth > 0 ? `${metrics.thisMonth} check-in${metrics.thisMonth !== 1 ? 's' : ''}` : 'None yet this month'} />
      </div>

      {/* Chart + Profile */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 22 }}>
        <MoodChart calls={calls} />
        <ProfileCard userName={userName} totalSessions={calls.length} avgMood={metrics.avgMood}
          avgStability={metrics.avgStability} topTechnique={metrics.topTechnique} />
      </div>

      {/* Emotional Terrain card */}
      <div style={{ background: 'white', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', marginBottom: 22 }}>
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f5f0eb' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#1c1917' }}>Emotional Terrain</div>
            <div style={{ fontSize: 12, color: '#a8a29e', marginTop: 2 }}>3D visualization of your mood landscape over time</div>
          </div>
          {isCallActive && <span style={{ fontSize: 12, fontWeight: 600, color: '#c2410c' }}>● Live</span>}
        </div>
        <div style={{ height: 420 }}>
          <EmotionalTerrain calls={calls} liveMode={isCallActive} />
        </div>
      </div>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div>
          <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 600, color: '#1c1917' }}>Recent Sessions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {recentSessions.map((call, i) => (
              <RecentSessionCard key={call.id} call={call} index={calls.length - 1 - i} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Terrain View ─────────────────────────────────────────────────────────────
function TerrainView({ calls, isCallActive, setIsCallActive }: {
  calls: CallData[]; isCallActive: boolean; setIsCallActive: (v: boolean) => void
}) {
  return (
    <div style={{ width: '100%', height: '100vh', background: '#0d0d0d', position: 'relative' }}>
      <EmotionalTerrain calls={calls.length > 0 ? calls : undefined} liveMode={isCallActive} />
      <div style={{ position: 'absolute', bottom: 28, right: 28 }}>
        <CallButton isActive={isCallActive} onCallStarted={() => setIsCallActive(true)} />
      </div>
    </div>
  )
}

// ─── Insights View ────────────────────────────────────────────────────────────
function SessionCalendar({ sessionDates }: { sessionDates: string[] }) {
  const dateSet  = new Set(sessionDates)
  const today    = new Date()
  const todayStr = today.toISOString().substring(0, 10)
  const days     = Array.from({ length: 35 }, (_, i) => {
    const d   = new Date(today)
    d.setDate(d.getDate() - (34 - i))
    const str = d.toISOString().substring(0, 10)
    return { str, hasSession: dateSet.has(str), isToday: str === todayStr }
  })
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, color: '#c4b5a5', paddingBottom: 6 }}>{d}</div>
        ))}
        {days.map(({ str, hasSession, isToday }) => (
          <div key={str} title={str} style={{
            aspectRatio: '1', borderRadius: 5,
            background: hasSession ? '#c2410c' : '#f5f0eb',
            outline: isToday ? '2px solid #c2410c' : 'none',
            outlineOffset: 1,
            opacity: hasSession ? 1 : 0.55,
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f5f0eb', opacity: 0.6 }} />
        <span style={{ fontSize: 11, color: '#a8a29e' }}>No session</span>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: '#c2410c', marginLeft: 8 }} />
        <span style={{ fontSize: 11, color: '#a8a29e' }}>Completed</span>
      </div>
    </div>
  )
}

function InsightsView({ calls, streakDays, sessionDates }: {
  calls: CallData[]; streakDays: number; sessionDates: string[]
}) {
  const avgMood      = calls.length > 0 ? calls.reduce((s, c) => s + c.mood / 2, 0) / calls.length : 0
  const avgStability = calls.length > 0 ? calls.reduce((s, c) => s + (1 - c.volatility), 0) / calls.length : 0
  const bestMood     = calls.length > 0 ? Math.max(...calls.map(c => c.mood / 2)) : 0
  const sparkData    = calls.slice(-10).map(c => c.mood / 2)

  const today   = new Date()
  const dateSet = new Set(sessionDates)
  const last7   = Array.from({ length: 7 }, (_, i) => {
    const d   = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    const str = d.toISOString().substring(0, 10)
    return { str, hasSession: dateSet.has(str), label: ['S','M','T','W','T','F','S'][d.getDay()] }
  })

  const spW = 300
  const spH = 100
  const spPad = 10
  const spInnerH = spH - spPad * 2

  return (
    <div style={{ padding: '28px 36px 48px' }}>
      <div style={{ marginBottom: 30 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#a8a29e', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>Analytics</div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#1c1917' }}>Your Progress</h1>
      </div>

      {/* Top 4 stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 24 }}>

        {/* Streak */}
        <div style={{ background: 'white', borderRadius: 18, padding: '20px 22px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 13, color: '#78716c', fontWeight: 500, marginBottom: 10 }}>🔥 Daily Streak</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: '#c2410c', lineHeight: 1, letterSpacing: '-2px' }}>
            {streakDays}
          </div>
          <div style={{ fontSize: 12, color: '#a8a29e', marginTop: 4, marginBottom: 14 }}>
            {streakDays === 1 ? 'day' : 'days'} in a row
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {last7.map(({ str, hasSession, label }) => (
              <div key={str} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                  height: 22, borderRadius: 4,
                  background: hasSession ? '#c2410c' : '#f5f0eb',
                  opacity: hasSession ? 1 : 0.5,
                  marginBottom: 3,
                }} />
                <div style={{ fontSize: 9, color: '#c4b5a5' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Avg mood */}
        <div style={{ background: 'white', borderRadius: 18, padding: '20px 22px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 13, color: '#78716c', fontWeight: 500, marginBottom: 10 }}>😊 Avg Mood Score</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: '#f97316', lineHeight: 1, letterSpacing: '-2px' }}>
            {calls.length > 0 ? avgMood.toFixed(1) : '—'}
          </div>
          <div style={{ fontSize: 12, color: '#a8a29e', marginTop: 4, marginBottom: 14 }}>out of 10</div>
          <div style={{ height: 6, background: '#f5f0eb', borderRadius: 99 }}>
            <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #fbbf24, #f97316)', width: `${(avgMood / 10) * 100}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: '#c4b5a5' }}>0</span>
            <span style={{ fontSize: 10, color: '#c4b5a5' }}>10</span>
          </div>
        </div>

        {/* Stability */}
        <div style={{ background: 'white', borderRadius: 18, padding: '20px 22px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 13, color: '#78716c', fontWeight: 500, marginBottom: 10 }}>🧘 Avg Stability</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: '#7c3aed', lineHeight: 1, letterSpacing: '-2px' }}>
            {calls.length > 0 ? Math.round(avgStability * 100) : '—'}
            {calls.length > 0 && <span style={{ fontSize: 22 }}>%</span>}
          </div>
          <div style={{ fontSize: 12, color: '#a8a29e', marginTop: 4, marginBottom: 14 }}>
            {avgStability >= 0.7 ? 'Very consistent' : avgStability >= 0.4 ? 'Building rhythm' : calls.length > 0 ? 'Still calibrating' : 'No sessions yet'}
          </div>
          <div style={{ height: 6, background: '#f5f0eb', borderRadius: 99 }}>
            <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #a78bfa, #7c3aed)', width: `${avgStability * 100}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: '#c4b5a5' }}>0%</span>
            <span style={{ fontSize: 10, color: '#c4b5a5' }}>100%</span>
          </div>
        </div>

        {/* Best session */}
        <div style={{ background: 'white', borderRadius: 18, padding: '20px 22px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 13, color: '#78716c', fontWeight: 500, marginBottom: 10 }}>🏆 Best Session</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: '#059669', lineHeight: 1, letterSpacing: '-2px' }}>
            {calls.length > 0 ? bestMood.toFixed(1) : '—'}
          </div>
          <div style={{ fontSize: 12, color: '#a8a29e', marginTop: 4, marginBottom: 14 }}>peak mood / 10</div>
          <div style={{ fontSize: 12, color: '#78716c' }}>
            {calls.length > 0
              ? `Across ${calls.length} session${calls.length !== 1 ? 's' : ''}`
              : 'Complete sessions to track'}
          </div>
        </div>
      </div>

      {/* Calendar + Sparkline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={{ background: 'white', borderRadius: 18, padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#1c1917', marginBottom: 4 }}>Activity Calendar</div>
          <div style={{ fontSize: 12, color: '#a8a29e', marginBottom: 20 }}>Last 35 days of check-ins</div>
          <SessionCalendar sessionDates={sessionDates} />
        </div>

        <div style={{ background: 'white', borderRadius: 18, padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#1c1917', marginBottom: 4 }}>Mood Trend</div>
          <div style={{ fontSize: 12, color: '#a8a29e', marginBottom: 20 }}>Last {sparkData.length} sessions</div>
          {sparkData.length > 1 ? (() => {
            const n   = sparkData.length
            const pts = sparkData.map((v, i) => ({
              x: spPad + i * ((spW - spPad * 2) / (n - 1)),
              y: spPad + spInnerH - (v / 10) * spInnerH,
            }))
            const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
            const areaD = `${lineD} L ${pts[n-1].x} ${spH} L ${pts[0].x} ${spH} Z`
            return (
              <svg width="100%" viewBox={`0 0 ${spW} ${spH + 20}`} style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c2410c" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#c2410c" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 5, 10].map(v => {
                  const y = spPad + spInnerH - (v / 10) * spInnerH
                  return (
                    <g key={v}>
                      <line x1={spPad} x2={spW - spPad} y1={y} y2={y} stroke="#f5f0eb" strokeWidth={1} />
                      <text x={0} y={y + 4} fontSize={9} fill="#c4b5a5">{v}</text>
                    </g>
                  )
                })}
                <path d={areaD} fill="url(#mg)" />
                <path d={lineD} fill="none" stroke="#c2410c" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                {pts.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={3} fill="white" stroke="#c2410c" strokeWidth={2} />
                ))}
              </svg>
            )
          })() : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: '#c4b5a5', fontSize: 13 }}>
              {sparkData.length === 0 ? 'Complete sessions to see your mood trend' : 'Need at least 2 sessions'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function DashboardClient({ initialCalls, userId, userName, streakDays, sessionDates }: Props) {
  const [calls, setCalls]               = useState<CallData[]>(initialCalls)
  const [isCallActive, setIsCallActive] = useState(false)
  const [activeView, setActiveView]     = useState<View>('dashboard')
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
        if (['completed', 'failed', 'missed'].includes(row.status)) setIsCallActive(false)
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
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: '#fafaf5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <Sidebar userName={userName} activeView={activeView} setActiveView={setActiveView} />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {activeView === 'dashboard' && (
          <DashboardView calls={calls} isCallActive={isCallActive} setIsCallActive={setIsCallActive} userName={userName} />
        )}
        {activeView === 'terrain' && (
          <TerrainView calls={calls} isCallActive={isCallActive} setIsCallActive={setIsCallActive} />
        )}
        {activeView === 'insights' && (
          <InsightsView calls={calls} streakDays={streakDays} sessionDates={sessionDates} />
        )}
      </main>
    </div>
  )
}
