'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import StepName from './steps/StepName'
import StepPhone from './steps/StepPhone'
import StepTime from './steps/StepTime'
import StepBio from './steps/StepBio'
import StepDone from './steps/StepDone'

// ── Theme ─────────────────────────────────────────────────────────────────────
const T = {
  bg:     '#FAFAF5', text:   '#1C1917', accent: '#C2410C',
  muted:  'rgba(28,25,23,0.45)', border: 'rgba(28,25,23,0.08)',
}

// ── Sidebar coil ──────────────────────────────────────────────────────────────
interface Drifter { v: number; tgt: number; base: number; spread: number }
const mkD = (base: number, spread: number): Drifter => ({ v: base, tgt: base, base, spread })
const BAR_BASE = 52, BAR_AMP = 28, BAR_FREQ_PER_PX = 0.35 / 32

function SidebarCoil({ step }: { step: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const passesRef    = useRef<Array<{ canvas: HTMLCanvasElement; active: boolean }>>([])

  // Stop all passes on unmount
  useEffect(() => () => { passesRef.current.forEach(p => { p.active = false }) }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Each step gets its own canvas layered on top
    const canvas = document.createElement('canvas')
    const W = 120, H = 9000
    canvas.width = W; canvas.height = H
    Object.assign(canvas.style, { position: 'absolute', top: '0', left: '0', width: '120px' })
    container.appendChild(canvas)

    const ctx = canvas.getContext('2d')!
    const pass = { canvas, active: true, cleaned: false }
    passesRef.current.push(pass)
    const passIdx = passesRef.current.length - 1

    const color = COIL_COLORS[step] ?? COIL_COLORS.name
    const lineWidth = 2.2 + passIdx * 0.5
    const wR = mkD(56 / (2 * Math.PI), 3.5), arm = mkD(22, 9), squeeze = mkD(1.0, 0.45), offset = mkD(0, 6)
    let t = 0, px = W / 2, py = 0
    const tick = (d: Drifter, minV = -Infinity) => {
      d.v += (d.tgt - d.v) * 0.018
      if (Math.abs(d.tgt - d.v) < d.spread * 0.04) {
        d.tgt = d.base; if (minV !== -Infinity) d.tgt = Math.max(minV, d.tgt)
      }
    }
    const draw = () => {
      if (!pass.active) return
      for (let s = 0; s < 6; s++) {
        t += 0.045; tick(wR, 2); tick(arm, 4); tick(squeeze); tick(offset)
        const y = wR.v * t + arm.v * squeeze.v * Math.cos(t) + offset.v
        const x = BAR_BASE + BAR_AMP * Math.sin(y * BAR_FREQ_PER_PX) + arm.v * Math.sin(t)
        ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = lineWidth
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'
        ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke()
        px = x; py = y
        // Once this pass has drawn past the visible area, remove older passes beneath it
        if (!pass.cleaned && y >= window.innerHeight + 50) {
          pass.cleaned = true
          const idx = passesRef.current.indexOf(pass)
          if (idx > 0) {
            passesRef.current.slice(0, idx).forEach(p => { p.active = false; p.canvas.remove() })
            passesRef.current = passesRef.current.slice(idx)
          }
        }
        if (y >= H) return
      }
      requestAnimationFrame(draw)
    }
    requestAnimationFrame(draw)
  }, [step])

  return <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, width: '120px', height: '100%' }} />
}

// ── Purple background lines ───────────────────────────────────────────────────
const dp = (d: Drifter, speed: number, minV = -Infinity) => {
  d.v += (d.tgt - d.v) * speed
  if (Math.abs(d.tgt - d.v) < 0.5) { d.tgt = d.base + (Math.random() - 0.5) * 2 * d.spread; if (minV !== -Infinity) d.tgt = Math.max(minV, d.tgt) }
}

const STEP_PALETTES: Record<string, string[]> = {
  name:  ['rgba(139,92,246,0.22)','rgba(168,85,247,0.18)','rgba(109,40,217,0.16)','rgba(139,92,246,0.14)','rgba(192,132,252,0.18)','rgba(124,58,237,0.13)','rgba(167,139,250,0.16)'],
  phone: ['rgba(244,114,182,0.38)','rgba(236,72,153,0.30)','rgba(251,113,133,0.28)','rgba(244,114,182,0.24)','rgba(253,164,175,0.32)','rgba(251,113,133,0.22)','rgba(249,168,212,0.28)'],
  time:  ['rgba(52,211,153,0.22)','rgba(16,185,129,0.18)','rgba(110,231,183,0.16)','rgba(52,211,153,0.14)','rgba(167,243,208,0.18)','rgba(5,150,105,0.13)','rgba(110,231,183,0.16)'],
  bio:   ['rgba(56,189,248,0.36)','rgba(14,165,233,0.30)','rgba(125,211,252,0.28)','rgba(56,189,248,0.22)','rgba(186,230,253,0.32)','rgba(2,132,199,0.22)','rgba(125,211,252,0.28)'],
  done:  ['rgba(251,191,36,0.22)','rgba(245,158,11,0.18)','rgba(253,224,71,0.16)','rgba(251,191,36,0.14)','rgba(254,240,138,0.18)','rgba(217,119,6,0.13)','rgba(252,211,77,0.16)'],
}

const COIL_COLORS: Record<string, string> = {
  name:  'rgba(234,88,12,0.55)',
  phone: 'rgba(249,168,212,0.75)',
  time:  'rgba(167,243,208,0.75)',
  bio:   'rgba(125,211,252,0.75)',
  done:  'rgba(245,158,11,0.55)',
}

function BackgroundLines({ step }: { step: string }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const colorsRef  = useRef<string[]>(STEP_PALETTES[step] ?? STEP_PALETTES.name)

  useEffect(() => { colorsRef.current = STEP_PALETTES[step] ?? STEP_PALETTES.name }, [step])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)
    const W0 = window.innerWidth
    const lines = [
      { startX:mkD(W0*0.35,W0*0.12),slope:mkD(0.38,0.12),  a1:mkD(55,22),f1:mkD(0.0055,0.002),ph1:0,  a2:mkD(28,14),f2:mkD(0.013,0.004),ph2:1.4,a3:mkD(12,7),f3:mkD(0.026,0.007),ph3:3.1,width:1.4,spd:0.0006 },
      { startX:mkD(W0*0.65,W0*0.10),slope:mkD(-0.28,0.10), a1:mkD(45,18),f1:mkD(0.0072,0.003),ph1:2.2,a2:mkD(22,10),f2:mkD(0.018,0.005),ph2:0.7,a3:mkD(10,5),f3:mkD(0.033,0.009),ph3:4.5,width:1.2,spd:0.0004 },
      { startX:mkD(W0*0.15,W0*0.09),slope:mkD(0.55,0.18),  a1:mkD(65,28),f1:mkD(0.0042,0.0015),ph1:1.0,a2:mkD(18,9),f2:mkD(0.022,0.006),ph2:2.9,a3:mkD(8,4),f3:mkD(0.041,0.010),ph3:5.8,width:1.6,spd:0.0003 },
      { startX:mkD(W0*0.50,W0*0.11),slope:mkD(-0.45,0.14), a1:mkD(38,16),f1:mkD(0.0065,0.002),ph1:0.5,a2:mkD(20,10),f2:mkD(0.016,0.005),ph2:3.3,a3:mkD(9,5),f3:mkD(0.030,0.008),ph3:1.7,width:1.0,spd:0.0005 },
      { startX:mkD(W0*0.82,W0*0.08),slope:mkD(0.22,0.09),  a1:mkD(50,20),f1:mkD(0.0048,0.002),ph1:4.1,a2:mkD(25,12),f2:mkD(0.011,0.004),ph2:0.2,a3:mkD(11,6),f3:mkD(0.023,0.007),ph3:2.5,width:1.3,spd:0.0007 },
      { startX:mkD(W0*0.08,W0*0.07),slope:mkD(0.70,0.16),  a1:mkD(42,17),f1:mkD(0.0080,0.003),ph1:5.2,a2:mkD(16,8),f2:mkD(0.019,0.005),ph2:1.1,a3:mkD(7,3),f3:mkD(0.037,0.009),ph3:3.8,width:1.1,spd:0.0004 },
      { startX:mkD(W0*0.92,W0*0.10),slope:mkD(-0.60,0.15), a1:mkD(60,24),f1:mkD(0.0035,0.0012),ph1:2.8,a2:mkD(30,13),f2:mkD(0.014,0.004),ph2:0.9,a3:mkD(13,6),f3:mkD(0.028,0.008),ph3:4.6,width:1.5,spd:0.0005 },
    ]
    const S = 0.004; let raf = 0
    const draw = () => {
      const W = canvas.width, H = canvas.height; ctx.clearRect(0, 0, W, H)
      const palette = colorsRef.current
      for (let i = 0; i < lines.length; i++) {
        const ln = lines[i]
        dp(ln.startX,S*0.3); dp(ln.slope,S*0.2); dp(ln.a1,S*0.4,5); dp(ln.a2,S*0.4,3); dp(ln.a3,S*0.5,2)
        dp(ln.f1,S*0.15,0.001); dp(ln.f2,S*0.15,0.002); dp(ln.f3,S*0.15,0.003)
        ln.ph1+=ln.spd; ln.ph2+=ln.spd*1.37; ln.ph3+=ln.spd*0.71
        ctx.beginPath(); ctx.strokeStyle=palette[i]; ctx.lineWidth=ln.width; ctx.lineCap='round'
        for (let y=0; y<=H; y+=4) {
          const x=ln.startX.v+ln.slope.v*y+ln.a1.v*Math.sin(ln.f1.v*y+ln.ph1)+ln.a2.v*Math.sin(ln.f2.v*y+ln.ph2)+ln.a3.v*Math.sin(ln.f3.v*y+ln.ph3)
          y===0?ctx.moveTo(x,y):ctx.lineTo(x,y)
        }
        ctx.stroke()
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position:'fixed',top:0,left:0,width:'100vw',height:'100vh',zIndex:1,pointerEvents:'none' }} />
}

const sineBarWidth = (i: number) => Math.round(52 + 28 * Math.sin(i * 0.35))
const SHADES = ['#D8D3CB','#C9C4BC','#E0DBD3','#D0CCC4','#BCBAB4','#DEDAD2','#C4C0B8','#E4E0D8','#CACCC6','#D4D0C8']

// ── Types ─────────────────────────────────────────────────────────────────────
export type OnboardingData = {
  fname: string; lname: string; phone: string
  timezone: string; call_time_pref: string; bio: string
}

const STEPS = ['name', 'phone', 'time', 'bio', 'done'] as const
type Step = typeof STEPS[number]

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router   = useRouter()
  const supabase = createClient()
  const [step, setStep]     = useState<Step>('name')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [data, setData]     = useState<OnboardingData>({
    fname: '', lname: '', phone: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    call_time_pref: '09:00', bio: '',
  })

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('users').select('fname, phone').eq('id', user.id).single()
      if (profile?.fname && profile?.phone) router.push('/dashboard')
    }
    check()
  }, [])

  const update = (fields: Partial<OnboardingData>) => setData(prev => ({ ...prev, ...fields }))
  const next   = () => { const idx = STEPS.indexOf(step); if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]) }
  const back   = () => { const idx = STEPS.indexOf(step); if (idx > 0) setStep(STEPS[idx - 1]) }

  async function save() {
    setSaving(true); setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error: upsertError } = await supabase.from('users').upsert({
        id: user.id, email: user.email!, fname: data.fname.trim(), lname: data.lname.trim(),
        phone: data.phone.trim(), timezone: data.timezone, call_time_pref: data.call_time_pref,
        bio: data.bio.trim() || null,
      })
      if (upsertError) throw upsertError
      next()
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const stepIndex  = STEPS.indexOf(step)
  const totalSteps = STEPS.length - 1
  const progress   = (stepIndex / totalSteps) * 100

  return (
    <div style={{ minHeight: '100vh', backgroundColor: T.bg, fontFamily: "'Montserrat', sans-serif", position: 'relative', overflowX: 'hidden' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');`}</style>

      <BackgroundLines step={step} />

      {/* Sidebar */}
      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '120px', zIndex: 10, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: '80px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px 0' }}>
            {Array.from({ length: 1000 }).map((_, i) => (
              <div key={i} style={{ backgroundColor: SHADES[i % SHADES.length], height: '26px', width: `${sineBarWidth(i)}px`, borderRadius: '0 6px 6px 0', flexShrink: 0 }} />
            ))}
          </div>
        </div>
        <SidebarCoil step={step} />
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px 16px', paddingLeft: '120px' }}>

        {/* Progress bar */}
        {step !== 'done' && (
          <div style={{ width: '100%', maxWidth: 480, marginBottom: 48 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: T.muted, letterSpacing: '0.15em', fontWeight: 600 }}>SETUP</span>
              <span style={{ fontSize: 10, color: T.muted, letterSpacing: '0.15em' }}>{stepIndex}/{totalSteps}</span>
            </div>
            <div style={{ height: 2, background: T.border, borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${T.accent}, #f97316)`, borderRadius: 2, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}

        {/* Card */}
        <div style={{ width: '100%', maxWidth: 480, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 20, padding: '40px 40px 36px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 32px rgba(28,25,23,0.06)' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, rgba(194,65,12,0.05) 0%, transparent 70%)`, pointerEvents: 'none' }} />

          {step === 'name'  && <StepName  data={data} update={update} onNext={next} />}
          {step === 'phone' && <StepPhone data={data} update={update} onNext={next} onBack={back} />}
          {step === 'time'  && <StepTime  data={data} update={update} onNext={next} onBack={back} />}
          {step === 'bio'   && <StepBio   data={data} update={update} onNext={save}  onBack={back} saving={saving} />}
          {step === 'done'  && <StepDone  name={data.fname} />}

          {error && <p style={{ marginTop: 16, fontSize: 12, color: '#ef4444', textAlign: 'center' }}>{error}</p>}
        </div>

        <div style={{ marginTop: 32, fontSize: 10, color: T.muted, letterSpacing: '0.2em', fontWeight: 600 }}>
          MELFI
        </div>
      </div>
    </div>
  )
}
