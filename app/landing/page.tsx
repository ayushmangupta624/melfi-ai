'use client'

import Link from 'next/link'
import EmotionalTerrain from '@/components/EmotionalTerrain'
import { useState, useEffect, useRef } from 'react'

// ── Drifting trochoid ─────────────────────────────────────────────────────────
interface CoilParams { organic: number; baseHoop: number; tweenSpeed: number; drawSpeed: number }
interface Drifter    { v: number; tgt: number; base: number; spread: number }
const mkD = (base: number, spread: number): Drifter => ({ v: base, tgt: base, base, spread })

function SidebarCoil({ color, p, runKey }: { color: string; p: CoilParams; runKey: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pRef      = useRef(p)
  useEffect(() => { pRef.current = p }, [p])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = 120, H = 9000
    canvas.width = W; canvas.height = H
    ctx.clearRect(0, 0, W, H)

    const pp      = pRef.current
    const wR      = mkD(pp.baseHoop / (2 * Math.PI), 3.5)
    const arm     = mkD(22, 9)
    const squeeze = mkD(1.0, 0.45)
    const offset  = mkD(0,   6)

    let t = 0, px = W / 2, py = 0, raf = 0

    const tick = (d: Drifter, minV = -Infinity) => {
      const { organic, tweenSpeed } = pRef.current
      d.v += (d.tgt - d.v) * (tweenSpeed * 0.018)
      if (Math.abs(d.tgt - d.v) < d.spread * 0.04) {
        d.tgt = d.base + (Math.random() - 0.5) * 2 * d.spread * (organic / 5)
        if (minV !== -Infinity) d.tgt = Math.max(minV, d.tgt)
      }
    }

    const step = () => {
      const steps = Math.max(1, Math.round(pRef.current.drawSpeed * 14))
      for (let s = 0; s < steps; s++) {
        t += 0.045
        tick(wR, 2); tick(arm, 4); tick(squeeze); tick(offset)
        const y       = wR.v * t + arm.v * squeeze.v * Math.cos(t) + offset.v
        const barEdge = 52 + 28 * Math.sin(y * (0.35 / 32))   // matches sineBarWidth formula
        const x       = barEdge + arm.v * Math.sin(t)
        ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.2
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'
        ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke()
        px = x; py = y
        if (y >= H) return
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, runKey])

  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '120px' }} />
}

// ── Diagonal purple sine-wave lines ──────────────────────────────────────────
const drift = (d: Drifter, speed: number, minV = -Infinity) => {
  d.v += (d.tgt - d.v) * speed
  if (Math.abs(d.tgt - d.v) < 0.5) {
    d.tgt = d.base + (Math.random() - 0.5) * 2 * d.spread
    if (minV !== -Infinity) d.tgt = Math.max(minV, d.tgt)
  }
}

function BackgroundLines() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    // 3 lines, each a sum of 3 sine components + diagonal slope
    const W0 = window.innerWidth
    const lines = [
      {
        startX: mkD(W0 * 0.35, W0 * 0.12), slope: mkD( 0.38, 0.12),
        a1: mkD(55,22), f1: mkD(0.0055,0.002), ph1: 0,
        a2: mkD(28,14), f2: mkD(0.013, 0.004), ph2: 1.4,
        a3: mkD(12, 7), f3: mkD(0.026, 0.007), ph3: 3.1,
        color: 'rgba(139,92,246,0.22)', width: 1.4, spd: 0.0006,
      },
      {
        startX: mkD(W0 * 0.65, W0 * 0.10), slope: mkD(-0.28, 0.10),
        a1: mkD(45,18), f1: mkD(0.0072,0.003), ph1: 2.2,
        a2: mkD(22,10), f2: mkD(0.018, 0.005), ph2: 0.7,
        a3: mkD(10, 5), f3: mkD(0.033, 0.009), ph3: 4.5,
        color: 'rgba(168,85,247,0.18)', width: 1.2, spd: 0.0004,
      },
      {
        startX: mkD(W0 * 0.15, W0 * 0.09), slope: mkD( 0.55, 0.18),
        a1: mkD(65,28), f1: mkD(0.0042,0.0015), ph1: 1.0,
        a2: mkD(18, 9), f2: mkD(0.022, 0.006),  ph2: 2.9,
        a3: mkD( 8, 4), f3: mkD(0.041, 0.010),  ph3: 5.8,
        color: 'rgba(109,40,217,0.16)', width: 1.6, spd: 0.0003,
      },
      {
        startX: mkD(W0 * 0.50, W0 * 0.11), slope: mkD(-0.45, 0.14),
        a1: mkD(38,16), f1: mkD(0.0065,0.002), ph1: 0.5,
        a2: mkD(20,10), f2: mkD(0.016, 0.005), ph2: 3.3,
        a3: mkD(9,  5), f3: mkD(0.030, 0.008), ph3: 1.7,
        color: 'rgba(139,92,246,0.14)', width: 1.0, spd: 0.0005,
      },
      {
        startX: mkD(W0 * 0.82, W0 * 0.08), slope: mkD( 0.22, 0.09),
        a1: mkD(50,20), f1: mkD(0.0048,0.002), ph1: 4.1,
        a2: mkD(25,12), f2: mkD(0.011, 0.004), ph2: 0.2,
        a3: mkD(11, 6), f3: mkD(0.023, 0.007), ph3: 2.5,
        color: 'rgba(192,132,252,0.18)', width: 1.3, spd: 0.0007,
      },
      {
        startX: mkD(W0 * 0.08, W0 * 0.07), slope: mkD( 0.70, 0.16),
        a1: mkD(42,17), f1: mkD(0.0080,0.003), ph1: 5.2,
        a2: mkD(16, 8), f2: mkD(0.019, 0.005), ph2: 1.1,
        a3: mkD(7,  3), f3: mkD(0.037, 0.009), ph3: 3.8,
        color: 'rgba(124,58,237,0.13)', width: 1.1, spd: 0.0004,
      },
      {
        startX: mkD(W0 * 0.92, W0 * 0.10), slope: mkD(-0.60, 0.15),
        a1: mkD(60,24), f1: mkD(0.0035,0.0012), ph1: 2.8,
        a2: mkD(30,13), f2: mkD(0.014, 0.004),  ph2: 0.9,
        a3: mkD(13, 6), f3: mkD(0.028, 0.008),  ph3: 4.6,
        color: 'rgba(167,139,250,0.16)', width: 1.5, spd: 0.0005,
      },
    ]

    let raf = 0
    const SPEED = 0.004

    const draw = () => {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      for (const ln of lines) {
        drift(ln.startX, SPEED * 0.3)
        drift(ln.slope,  SPEED * 0.2)
        drift(ln.a1, SPEED * 0.4, 5); drift(ln.a2, SPEED * 0.4, 3); drift(ln.a3, SPEED * 0.5, 2)
        drift(ln.f1, SPEED * 0.15, 0.001); drift(ln.f2, SPEED * 0.15, 0.002); drift(ln.f3, SPEED * 0.15, 0.003)
        ln.ph1 += ln.spd; ln.ph2 += ln.spd * 1.37; ln.ph3 += ln.spd * 0.71

        ctx.beginPath()
        ctx.strokeStyle = ln.color
        ctx.lineWidth   = ln.width
        ctx.lineCap = 'round'
        for (let y = 0; y <= H; y += 4) {
          const x = ln.startX.v + ln.slope.v * y
                  + ln.a1.v * Math.sin(ln.f1.v * y + ln.ph1)
                  + ln.a2.v * Math.sin(ln.f2.v * y + ln.ph2)
                  + ln.a3.v * Math.sin(ln.f3.v * y + ln.ph3)
          y === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1, pointerEvents: 'none' }}
    />
  )
}

// ── Theme ─────────────────────────────────────────────────────────────────────
const T = {
  bg:     '#FAFAF5', text:   '#1C1917', accent: '#C2410C',
  muted:  'rgba(28,25,23,0.45)', border: 'rgba(28,25,23,0.08)',
  altBg:  '#F2EDE4', coil:   'rgba(234,88,12,0.55)',
}

const PROJECT_NAME = 'MindSpace'
const DESCRIPTION  = "Talk through what's on your mind with an empathetic AI that listens, remembers, and grows with you — session by session."

const FEATURES = [
  { icon: '🎙️', title: 'voice-first sessions',  description: 'Speak naturally and let our AI listen. No typing, no forms — just a conversation.' },
  { icon: '🧠', title: 'adaptive techniques',    description: 'Reflective listening, cognitive reframing, Socratic questioning, and somatic approaches — tailored to you.' },
  { icon: '📈', title: 'emotional terrain',      description: 'Visualize your mood journey over time with a beautiful 3D emotional landscape unique to your sessions.' },
  { icon: '🔒', title: 'private & secure',       description: 'Your conversations are yours. End-to-end security powered by Supabase ensures your data stays private.' },
  { icon: '⚡', title: 'always available',       description: 'No scheduling, no waitlists. Start a session whenever you need — day or night.' },
  { icon: '🌱', title: 'grows with you',         description: 'The AI builds a memory of your history, so every session picks up right where you left off.' },
]

const TESTIMONIALS = [
  { quote: '"I was skeptical at first, but after a few sessions I started noticing real shifts in how I handle stress."', name: 'Alex M.',   role: 'Product Designer'  },
  { quote: '"Having something available at 2am when anxiety hits has been a game changer for me."',                      name: 'Jordan K.', role: 'Software Engineer' },
  { quote: '"The emotional terrain graph helped me see patterns I never would have noticed on my own."',                  name: 'Sam T.',    role: 'Graduate Student'  },
]

const SHADES = ['#D8D3CB','#C9C4BC','#E0DBD3','#D0CCC4','#BCBAB4','#DEDAD2','#C4C0B8','#E4E0D8','#CACCC6','#D4D0C8']

// Bar widths follow a sine wave: base 52px ± 28px amplitude
const sineBarWidth = (i: number) => Math.round(52 + 28 * Math.sin(i * 0.35))

// ── Slider helper ─────────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between text-xs" style={{ color: T.muted }}>
        <span>{label}</span>
        <span style={{ color: T.text, fontWeight: 600 }}>{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-orange-600 h-1 cursor-pointer"
      />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [runKey,    setRunKey]    = useState(0)
  const [p, setP] = useState<CoilParams>({ organic: 0.175, baseHoop: 56, tweenSpeed: 1, drawSpeed: 0.4 })

  const update = (key: keyof CoilParams, val: number) => {
    setP(prev => ({ ...prev, [key]: val }))
    if (key === 'baseHoop') setRunKey(k => k + 1)  // restart on baseHoop change
  }

  return (
    <div
      className="min-h-screen antialiased pl-28 relative"
      style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '16px', backgroundColor: T.bg, color: T.text }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
      `}</style>

      <BackgroundLines />

      {/* ── Sidebar ── */}
      {/* Outer div: no overflow clip so canvas/coil can extend right freely */}
      <div className="absolute left-0 top-0 h-full z-20 pointer-events-none overflow-hidden" style={{ width: '120px' }}>
        {/* Inner div: clips bars at page boundary so they don't cause infinite scroll */}
        <div className="overflow-hidden h-full" style={{ width: '80px' }}>
          <div className="flex flex-col" style={{ gap: '6px', padding: '12px 0' }}>
            {Array.from({ length: 1000 }).map((_, i) => (
              <div key={i} style={{
                backgroundColor: SHADES[i % SHADES.length],
                height: '26px',
                width: `${sineBarWidth(i)}px`,
                borderRadius: '0 6px 6px 0',
                flexShrink: 0,
              }} />
            ))}
          </div>
        </div>
        <SidebarCoil color={T.coil} p={p} runKey={runKey} />
      </div>

      {/* ── Coil controls panel ── */}
      <div className="fixed bottom-6 left-6 z-50" style={{ width: '200px' }}>
        <button
          onClick={() => setShowPanel(v => !v)}
          className="w-full text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
          style={{ backgroundColor: T.bg, borderColor: T.accent, color: T.accent }}
        >
          {showPanel ? '✕ close' : '⚙ coil params'}
        </button>

        {showPanel && (
          <div
            className="mt-2 rounded-2xl p-4 flex flex-col gap-3 border"
            style={{ backgroundColor: T.bg, borderColor: T.border, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
          >
            <Slider label="organic"        value={p.organic}    min={0}   max={10}  step={0.1} onChange={v => update('organic',    v)} />
            <Slider label="base hoop size" value={p.baseHoop}   min={20}  max={120} step={1}   onChange={v => update('baseHoop',   v)} />
            <Slider label="tween speed"    value={p.tweenSpeed} min={0.1} max={3}   step={0.1} onChange={v => update('tweenSpeed', v)} />
            <Slider label="draw speed"     value={p.drawSpeed}  min={0.2} max={4}   step={0.1} onChange={v => update('drawSpeed',  v)} />
            <button
              onClick={() => setRunKey(k => k + 1)}
              className="text-xs font-semibold py-1 rounded-full border mt-1"
              style={{ borderColor: T.accent, color: T.accent }}
            >
              ↺ redraw
            </button>
          </div>
        )}
      </div>

      {/* content sits above the fixed purple canvas (z-index:1) */}
      <div style={{ position: 'relative', zIndex: 2 }}>
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-30 py-5 px-8 border-b" style={{ backgroundColor: T.bg, borderColor: T.border }}>
        <div className="flex justify-between items-center w-full max-w-6xl mx-auto">
          <Link href="/landing" className="text-xl font-bold tracking-tight" style={{ color: T.text }}>{PROJECT_NAME}</Link>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" style={{ color: T.muted }} className="hover:opacity-100 transition-opacity">features</a>
            <a href="#stories"  style={{ color: T.muted }} className="hover:opacity-100 transition-opacity">stories</a>
            <Link href="/auth/login" style={{ color: T.muted }} className="hover:opacity-100 transition-opacity">login</Link>
            <Link href="/auth/sign-up" className="text-sm font-semibold px-5 py-2 rounded-full border transition-colors"
              style={{ borderColor: T.text, color: T.text }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = T.text; (e.currentTarget as HTMLElement).style.color = T.bg }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = T.text }}
            >get started</Link>
          </div>
          <button className="md:hidden flex flex-col gap-1.5" onClick={() => setMenuOpen(!menuOpen)}>
            <span className="block w-6 h-0.5" style={{ backgroundColor: T.text }} />
            <span className="block w-6 h-0.5" style={{ backgroundColor: T.text }} />
            <span className="block w-6 h-0.5" style={{ backgroundColor: T.text }} />
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden mt-4 flex flex-col gap-4 text-sm px-2 pb-4">
            <a href="#features" style={{ color: T.muted }}>features</a>
            <a href="#stories"  style={{ color: T.muted }}>stories</a>
            <Link href="/auth/login"   style={{ color: T.muted }}>login</Link>
            <Link href="/auth/sign-up" style={{ color: T.text }} className="font-semibold">get started</Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="pt-40 pb-24 px-8 max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <p className="text-sm font-medium mb-6" style={{ color: T.accent }}>AI · Voice · Mental Wellness</p>
          <h1 className="text-6xl md:text-7xl font-bold leading-tight tracking-tight mb-6" style={{ color: T.text }}>
            welcome to <span className="font-bold">{PROJECT_NAME.toLowerCase()}.</span>
          </h1>
          <p className="text-sm max-w-lg leading-relaxed mb-10" style={{ color: T.muted }}>{DESCRIPTION}</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/auth/sign-up" className="px-7 py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ backgroundColor: T.text, color: T.bg }}>start your first session</Link>
            <a href="#features" className="px-7 py-3 rounded-full border text-sm font-semibold transition-colors hover:opacity-70"
              style={{ borderColor: T.text, color: T.text }}>learn more</a>
          </div>
        </div>
        <div className="mt-20 w-full rounded-3xl overflow-hidden border" style={{ height: '520px', borderColor: T.border }}>
          <EmotionalTerrain />
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="px-8 py-24 border-t" style={{ borderColor: T.border }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-medium mb-4" style={{ color: T.accent }}>what we offer</p>
          <h2 className="text-4xl font-bold mb-4 tracking-tight">everything you need.</h2>
          <p className="text-sm max-w-md leading-relaxed mb-16" style={{ color: T.muted }}>
            Built around how people actually process emotions — through conversation, reflection, and time.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map(f => (
              <div key={f.title} className="border-t pt-6" style={{ borderColor: T.border }}>
                <div className="text-2xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="stories" className="px-8 py-24 border-t" style={{ borderColor: T.border, backgroundColor: T.altBg }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-medium mb-4" style={{ color: T.accent }}>stories</p>
          <h2 className="text-4xl font-bold mb-16 tracking-tight">people are feeling better.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="flex flex-col gap-4">
                <p className="text-sm leading-relaxed italic" style={{ color: T.muted }}>{t.quote}</p>
                <div className="border-t pt-4" style={{ borderColor: T.border }}>
                  <p className="font-bold text-sm">{t.name}</p>
                  <p className="text-xs" style={{ color: T.muted }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-8 py-28 border-t" style={{ borderColor: T.border }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-medium mb-4" style={{ color: T.accent }}>get started</p>
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 max-w-2xl leading-tight">ready to start feeling better?</h2>
          <p className="text-sm max-w-md leading-relaxed mb-10" style={{ color: T.muted }}>
            Join thousands of people using {PROJECT_NAME} to build emotional clarity, one session at a time.
          </p>
          <Link href="/auth/sign-up" className="inline-block px-8 py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ backgroundColor: T.text, color: T.bg }}>get started for free</Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t px-8 py-8" style={{ borderColor: T.border }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs" style={{ color: T.muted }}>
          <span className="font-semibold">{PROJECT_NAME}® 2026</span>
          <div className="flex gap-6">
            <a href="#" className="hover:opacity-100 transition-opacity">privacy</a>
            <a href="#" className="hover:opacity-100 transition-opacity">terms</a>
            <a href="#" className="hover:opacity-100 transition-opacity">contact</a>
          </div>
        </div>
      </footer>
      </div>{/* end z-index:2 content wrapper */}
    </div>
  )
}
