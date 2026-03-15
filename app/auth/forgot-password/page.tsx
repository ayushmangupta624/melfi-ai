'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/forgot-password-form'

interface Drifter { v: number; tgt: number; base: number; spread: number }
const mkD = (base: number, spread: number): Drifter => ({ v: base, tgt: base, base, spread })

const dp = (d: Drifter, speed: number, minV = -Infinity) => {
  d.v += (d.tgt - d.v) * speed
  if (Math.abs(d.tgt - d.v) < 0.5) {
    d.tgt = d.base + (Math.random() - 0.5) * 2 * d.spread
    if (minV !== -Infinity) d.tgt = Math.max(minV, d.tgt)
  }
}

function BackgroundLines() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)
    const W0 = window.innerWidth
    const lines = [
      { startX:mkD(W0*0.35,W0*0.12),slope:mkD(0.38,0.12),  a1:mkD(55,22),f1:mkD(0.0055,0.002),ph1:0,  a2:mkD(28,14),f2:mkD(0.013,0.004),ph2:1.4,a3:mkD(12,7),f3:mkD(0.026,0.007),ph3:3.1,color:'rgba(139,92,246,0.22)', width:1.4,spd:0.0006},
      { startX:mkD(W0*0.65,W0*0.10),slope:mkD(-0.28,0.10), a1:mkD(45,18),f1:mkD(0.0072,0.003),ph1:2.2,a2:mkD(22,10),f2:mkD(0.018,0.005),ph2:0.7,a3:mkD(10,5),f3:mkD(0.033,0.009),ph3:4.5,color:'rgba(168,85,247,0.18)', width:1.2,spd:0.0004},
      { startX:mkD(W0*0.15,W0*0.09),slope:mkD(0.55,0.18),  a1:mkD(65,28),f1:mkD(0.0042,0.0015),ph1:1.0,a2:mkD(18,9),f2:mkD(0.022,0.006),ph2:2.9,a3:mkD(8,4),f3:mkD(0.041,0.010),ph3:5.8,color:'rgba(109,40,217,0.16)', width:1.6,spd:0.0003},
      { startX:mkD(W0*0.50,W0*0.11),slope:mkD(-0.45,0.14), a1:mkD(38,16),f1:mkD(0.0065,0.002),ph1:0.5,a2:mkD(20,10),f2:mkD(0.016,0.005),ph2:3.3,a3:mkD(9,5),f3:mkD(0.030,0.008),ph3:1.7,color:'rgba(139,92,246,0.14)', width:1.0,spd:0.0005},
      { startX:mkD(W0*0.82,W0*0.08),slope:mkD(0.22,0.09),  a1:mkD(50,20),f1:mkD(0.0048,0.002),ph1:4.1,a2:mkD(25,12),f2:mkD(0.011,0.004),ph2:0.2,a3:mkD(11,6),f3:mkD(0.023,0.007),ph3:2.5,color:'rgba(192,132,252,0.18)',width:1.3,spd:0.0007},
      { startX:mkD(W0*0.08,W0*0.07),slope:mkD(0.70,0.16),  a1:mkD(42,17),f1:mkD(0.0080,0.003),ph1:5.2,a2:mkD(16,8),f2:mkD(0.019,0.005),ph2:1.1,a3:mkD(7,3),f3:mkD(0.037,0.009),ph3:3.8,color:'rgba(124,58,237,0.13)', width:1.1,spd:0.0004},
      { startX:mkD(W0*0.92,W0*0.10),slope:mkD(-0.60,0.15), a1:mkD(60,24),f1:mkD(0.0035,0.0012),ph1:2.8,a2:mkD(30,13),f2:mkD(0.014,0.004),ph2:0.9,a3:mkD(13,6),f3:mkD(0.028,0.008),ph3:4.6,color:'rgba(167,139,250,0.16)',width:1.5,spd:0.0005},
    ]
    const S = 0.004; let raf = 0
    const draw = () => {
      const W = canvas.width, H = canvas.height; ctx.clearRect(0, 0, W, H)
      for (const ln of lines) {
        dp(ln.startX,S*0.3); dp(ln.slope,S*0.2); dp(ln.a1,S*0.4,5); dp(ln.a2,S*0.4,3); dp(ln.a3,S*0.5,2)
        dp(ln.f1,S*0.15,0.001); dp(ln.f2,S*0.15,0.002); dp(ln.f3,S*0.15,0.003)
        ln.ph1+=ln.spd; ln.ph2+=ln.spd*1.37; ln.ph3+=ln.spd*0.71
        ctx.beginPath(); ctx.strokeStyle=ln.color; ctx.lineWidth=ln.width; ctx.lineCap='round'
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

function SidebarCoil() {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const container = containerRef.current; if (!container) return
    const canvas = document.createElement('canvas')
    const W = 120, H = 9000
    canvas.width = W; canvas.height = H
    Object.assign(canvas.style, { position:'absolute',top:'0',left:'0',width:'120px' })
    container.appendChild(canvas)
    const ctx = canvas.getContext('2d')!
    const wR = mkD(56/(2*Math.PI),3.5), arm = mkD(22,9), squeeze = mkD(1.0,0.45), offset = mkD(0,6)
    let t = 0, px = W/2, py = 0, active = true
    const tick = (d: Drifter, minV = -Infinity) => {
      d.v += (d.tgt - d.v) * 0.018
      if (Math.abs(d.tgt - d.v) < d.spread * 0.04) { d.tgt = d.base; if (minV !== -Infinity) d.tgt = Math.max(minV, d.tgt) }
    }
    const draw = () => {
      if (!active) return
      for (let s = 0; s < 6; s++) {
        t += 0.045; tick(wR,2); tick(arm,4); tick(squeeze); tick(offset)
        const y = wR.v*t + arm.v*squeeze.v*Math.cos(t) + offset.v
        const x = 52 + 28*Math.sin(y*(0.35/32)) + arm.v*Math.sin(t)
        ctx.beginPath(); ctx.strokeStyle='rgba(234,88,12,0.55)'; ctx.lineWidth=2.2
        ctx.lineCap='round'; ctx.lineJoin='round'
        ctx.moveTo(px,py); ctx.lineTo(x,y); ctx.stroke()
        px=x; py=y; if (y>=H) return
      }
      requestAnimationFrame(draw)
    }
    requestAnimationFrame(draw)
    return () => { active = false; canvas.remove() }
  }, [])
  return <div ref={containerRef} style={{ position:'absolute',top:0,left:0,width:'120px',height:'100%' }} />
}

const SHADES = ['#D8D3CB','#C9C4BC','#E0DBD3','#D0CCC4','#BCBAB4','#DEDAD2','#C4C0B8','#E4E0D8','#CACCC6','#D4D0C8']
const sineBarWidth = (i: number) => Math.round(52 + 28 * Math.sin(i * 0.35))

export default function ForgotPasswordPage() {
  return (
    <div style={{ minHeight:'100vh',backgroundColor:'#FAFAF5',fontFamily:"'Montserrat', sans-serif",position:'relative',overflowX:'hidden' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');`}</style>

      <BackgroundLines />

      <div style={{ position:'absolute',left:0,top:0,height:'100%',width:'120px',zIndex:10,pointerEvents:'none',overflow:'hidden' }}>
        <div style={{ height:'100%',width:'80px',overflow:'hidden' }}>
          <div style={{ display:'flex',flexDirection:'column',gap:'6px',padding:'12px 0' }}>
            {Array.from({ length: 1000 }).map((_,i) => (
              <div key={i} style={{ backgroundColor:SHADES[i%SHADES.length],height:'26px',width:`${sineBarWidth(i)}px`,borderRadius:'0 6px 6px 0',flexShrink:0 }} />
            ))}
          </div>
        </div>
        <SidebarCoil />
      </div>

      <div style={{ position:'relative',zIndex:2,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',padding:'24px 16px',paddingLeft:'120px' }}>
        <Link href="/landing" style={{ marginBottom:32,display:'block' }}>
          <img src="/melfi-removebg-preview.png" alt="Melfi" style={{ height:72,width:'auto' }} />
        </Link>
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
