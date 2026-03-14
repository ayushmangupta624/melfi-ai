'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CallData {
  id: number | string
  mood: number        // 1–5
  volatility: number  // 0–1.5
  technique: 'reflective' | 'reframing' | 'socratic' | 'somatic'
  label: string
}

interface EmotionalTerrainProps {
  calls?: CallData[]
  liveMode?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SAMPLE_CALLS: CallData[] = [
  { id: 1,  mood: 3.2, volatility: 0.8, technique: 'reflective', label: 'Work stress surfaced'    },
  { id: 2,  mood: 2.8, volatility: 1.1, technique: 'somatic',    label: 'Sleep issues emerged'    },
  { id: 3,  mood: 3.5, volatility: 0.6, technique: 'reframing',  label: 'Reframe attempt'         },
  { id: 4,  mood: 2.1, volatility: 1.4, technique: 'socratic',   label: 'Hard day'                },
  { id: 5,  mood: 2.4, volatility: 1.2, technique: 'reflective', label: 'Opened up about family'  },
  { id: 6,  mood: 3.8, volatility: 0.5, technique: 'reframing',  label: 'Breakthrough moment'     },
  { id: 7,  mood: 4.1, volatility: 0.4, technique: 'socratic',   label: 'Self-insight session'    },
  { id: 8,  mood: 3.6, volatility: 0.7, technique: 'reflective', label: 'Stable check-in'         },
  { id: 9,  mood: 2.9, volatility: 0.9, technique: 'somatic',    label: 'Anxiety spike'           },
  { id: 10, mood: 4.3, volatility: 0.3, technique: 'reframing',  label: 'Perspective shift'       },
  { id: 11, mood: 4.5, volatility: 0.2, technique: 'socratic',   label: 'Best session yet'        },
  { id: 12, mood: 4.2, volatility: 0.4, technique: 'reflective', label: 'Feeling heard'           },
  { id: 13, mood: 3.9, volatility: 0.5, technique: 'reframing',  label: 'Growth visible'          },
  { id: 14, mood: 4.6, volatility: 0.2, technique: 'socratic',   label: 'Clarity on values'       },
  { id: 15, mood: 4.8, volatility: 0.1, technique: 'reflective', label: 'Model converging'        },
]

const TECHNIQUE_COLORS: Record<string, string> = {
  reflective: '#60a5fa',
  reframing:  '#34d399',
  socratic:   '#f59e0b',
  somatic:    '#c084fc',
}

const TECHNIQUE_LABELS: Record<string, string> = {
  reflective: 'Reflective listening',
  reframing:  'Cognitive reframing',
  socratic:   'Socratic questioning',
  somatic:    'Somatic grounding',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmotionalTerrain({ calls = SAMPLE_CALLS, liveMode = false }: EmotionalTerrainProps) {
  const mountRef    = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef    = useRef<THREE.Scene | null>(null)
  const cameraRef   = useRef<THREE.PerspectiveCamera | null>(null)
  const terrainRef  = useRef<THREE.Mesh | null>(null)
  const wireRef     = useRef<THREE.Mesh | null>(null)
  const ribbonRef   = useRef<THREE.Mesh | null>(null)
  const markersRef  = useRef<THREE.Mesh[]>([])
  const stemsRef    = useRef<THREE.Line[]>([])
  const ringsRef    = useRef<THREE.Mesh[]>([])
  const frameRef    = useRef<number>(0)
  const tooltipRef  = useRef<HTMLDivElement>(null)
  const callsRef    = useRef<CallData[]>(calls)
  const autoRotRef  = useRef(true)

  // Keep callsRef in sync when prop changes
  useEffect(() => {
    callsRef.current = calls
  }, [calls])

  // ── Scene builders (defined before initScene so they're in scope) ──────────

  const buildTerrain = useCallback((scene: THREE.Scene) => {
    // Dispose previous
    if (terrainRef.current) { scene.remove(terrainRef.current); terrainRef.current.geometry.dispose(); (terrainRef.current.material as THREE.Material).dispose() }
    if (wireRef.current)    { scene.remove(wireRef.current);    wireRef.current.geometry.dispose();    (wireRef.current.material as THREE.Material).dispose() }

    const data = callsRef.current
    const cols = data.length
    const rows = 20
    const segX = cols - 1
    const segZ = rows - 1

    const geo = new THREE.PlaneGeometry(cols * 1.6, 12, segX, segZ)
    geo.rotateX(-Math.PI / 2)

    const pos = geo.attributes.position as THREE.BufferAttribute
    const originalY = new Float32Array(pos.count)
    const colors    = new Float32Array(pos.count * 3)
    const color     = new THREE.Color()

    for (let vi = 0; vi < pos.count; vi++) {
      const xi   = vi % (segX + 1)
      const zi   = Math.floor(vi / (segX + 1))
      const call = data[Math.min(xi, cols - 1)]

      const mood = call.mood
      const vol  = call.volatility
      const zNorm        = (zi / segZ) * 2 - 1
      const ridgeProfile = Math.exp(-zNorm * zNorm * 2.5)
      const noise        = (Math.sin(xi * 2.1 + zi * 1.7) * 0.5 + Math.cos(xi * 1.3 - zi * 2.3) * 0.5) * vol * 0.8
      const height       = (mood / 5) * 5 * ridgeProfile + noise

      pos.setY(vi, height)
      originalY[vi] = height

      const moodNorm = mood / 5
      const volNorm  = Math.min(vol / 1.5, 1)

      if (volNorm > 0.65) {
        color.setRGB(0.85 + volNorm * 0.1, 0.88 + volNorm * 0.08, 0.95)
      } else if (moodNorm > 0.6) {
        color.setRGB(0.6 + moodNorm * 0.4, 0.35 + moodNorm * 0.35, 0.05 + moodNorm * 0.05)
      } else if (moodNorm < 0.4) {
        color.setRGB(0.05 + moodNorm * 0.1, 0.08 + moodNorm * 0.2, 0.25 + moodNorm * 0.5)
      } else {
        color.setRGB(0.1 + moodNorm * 0.25, 0.25 + moodNorm * 0.3, 0.4 + moodNorm * 0.2)
      }

      colors[vi * 3]     = color.r
      colors[vi * 3 + 1] = color.g
      colors[vi * 3 + 2] = color.b
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.userData.originalY = originalY
    geo.computeVertexNormals()

    const mat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      shininess: 35,
      specular: new THREE.Color(0x334466),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    })

    const terrain = new THREE.Mesh(geo, mat)
    terrain.receiveShadow = true
    terrain.castShadow    = true
    terrain.position.x    = -(cols * 1.6) / 2 + 0.8
    scene.add(terrain)
    terrainRef.current = terrain

    const wire = new THREE.Mesh(
      geo.clone(),
      new THREE.MeshBasicMaterial({ color: 0x1a3060, wireframe: true, transparent: true, opacity: 0.12 })
    )
    wire.position.copy(terrain.position)
    scene.add(wire)
    wireRef.current = wire
  }, [])

  const buildMarkers = useCallback((scene: THREE.Scene) => {
    // Dispose previous
    markersRef.current.forEach(m => scene.remove(m))
    stemsRef.current.forEach(s => scene.remove(s))
    ringsRef.current.forEach(r => scene.remove(r))
    markersRef.current = []
    stemsRef.current   = []
    ringsRef.current   = []

    const data     = callsRef.current
    const cols     = data.length
    const terrainX = -(cols * 1.6) / 2 + 0.8

    data.forEach((call, i) => {
      const x        = i * 1.6 + terrainX
      const peakY    = (call.mood / 5) * 5 + 0.5
      const hexColor = TECHNIQUE_COLORS[call.technique] ?? '#ffffff'
      const threeColor = new THREE.Color(hexColor)

      // Octahedron
      const marker = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.22, 0),
        new THREE.MeshPhongMaterial({ color: threeColor, emissive: threeColor, emissiveIntensity: 0.5, shininess: 80, transparent: true, opacity: 0.9 })
      )
      marker.position.set(x, peakY + 0.6, 0)
      marker.castShadow = true
      marker.userData   = { callId: call.id, mood: call.mood, volatility: call.volatility, technique: call.technique, label: call.label, baseY: peakY + 0.6, color: hexColor }
      scene.add(marker)
      markersRef.current.push(marker)

      // Stem
      const stem = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, peakY, 0), new THREE.Vector3(x, peakY + 0.55, 0)]),
        new THREE.LineBasicMaterial({ color: threeColor, transparent: true, opacity: 0.35 })
      )
      scene.add(stem)
      stemsRef.current.push(stem)

      // Ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.32, 0.38, 16),
        new THREE.MeshBasicMaterial({ color: threeColor, side: THREE.DoubleSide, transparent: true, opacity: 0.2 })
      )
      ring.position.set(x, peakY + 0.6, 0)
      ring.rotation.x = Math.PI / 2
      scene.add(ring)
      ringsRef.current.push(ring)
    })
  }, [])

  const buildRewardRibbon = useCallback((scene: THREE.Scene) => {
    if (ribbonRef.current) { scene.remove(ribbonRef.current); ribbonRef.current.geometry.dispose(); (ribbonRef.current.material as THREE.Material).dispose() }

    const data     = callsRef.current
    const terrainX = -(data.length * 1.6) / 2 + 0.8

    const points = data.map((call, i) => {
      const reward = (call.mood / 5) * 0.5 + (1 - Math.min(call.volatility / 1.5, 1)) * 0.5
      return new THREE.Vector3(i * 1.6 + terrainX, reward * 3 + 7, -8)
    })

    if (points.length < 2) return

    const avgReward      = data.reduce((s, c) => s + (c.mood / 5) * 0.5 + (1 - Math.min(c.volatility / 1.5, 1)) * 0.5, 0) / data.length
    const radiusVariation = Math.max(0.06, 0.25 - avgReward * 0.18)

    const ribbon = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), data.length * 4, radiusVariation, 8, false),
      new THREE.MeshPhongMaterial({ color: 0x34d399, emissive: 0x0d6640, emissiveIntensity: 0.4, shininess: 60, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    )
    scene.add(ribbon)
    ribbonRef.current = ribbon
  }, [])

  const rebuildAll = useCallback(() => {
    const scene = sceneRef.current
    if (!scene) return
    buildTerrain(scene)
    buildMarkers(scene)
    buildRewardRibbon(scene)
  }, [buildTerrain, buildMarkers, buildRewardRibbon])

  // ── Expose live update to Supabase hook ────────────────────────────────────
  const addLiveCall = useCallback((newCall: CallData) => {
    callsRef.current = [...callsRef.current, newCall]
    rebuildAll()
  }, [rebuildAll])

  useEffect(() => {
    (window as any).__therapistRL_addCall = addLiveCall
    return () => { delete (window as any).__therapistRL_addCall }
  }, [addLiveCall])

  // ── Main scene init ────────────────────────────────────────────────────────
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const W = container.clientWidth
    const H = container.clientHeight

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x050a14)
    scene.fog        = new THREE.FogExp2(0x050a14, 0.018)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200)
    camera.position.set(0, 12, 22)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Lights
    scene.add(new THREE.AmbientLight(0x1a2540, 2.5))
    const sun = new THREE.DirectionalLight(0xffd4a0, 1.8)
    sun.position.set(10, 20, 10); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024)
    scene.add(sun)
    const rim = new THREE.DirectionalLight(0x4080ff, 0.6)
    rim.position.set(-15, 5, -10); scene.add(rim)
    const fill = new THREE.PointLight(0x60a5fa, 0.8, 40)
    fill.position.set(0, 8, 0); scene.add(fill)

    // Stars
    const starVerts: number[] = []
    for (let i = 0; i < 1200; i++) {
      starVerts.push((Math.random() - 0.5) * 200, Math.random() * 60 + 10, (Math.random() - 0.5) * 200)
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3))
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.6 })))

    // Grid
    const grid = new THREE.GridHelper(40, 40, 0x1a2a4a, 0x0d1a2e)
    grid.position.y = -0.5; scene.add(grid)

    // Build geometry
    buildTerrain(scene)
    buildMarkers(scene)
    buildRewardRibbon(scene)

    // ── Orbit (manual) ──────────────────────────────────────────────────────
    let isDragging = false
    let prevMouse  = { x: 0, y: 0 }
    const spherical = { theta: 0, phi: Math.PI / 3.5, radius: 26 }

    function updateCamera() {
      camera.position.set(
        spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta),
        spherical.radius * Math.cos(spherical.phi),
        spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)
      )
      camera.lookAt(0, 1, 0)
    }

    const onMouseDown = (e: MouseEvent) => { isDragging = true; autoRotRef.current = false; prevMouse = { x: e.clientX, y: e.clientY }; container.style.cursor = 'grabbing' }
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      spherical.theta -= (e.clientX - prevMouse.x) * 0.005
      spherical.phi    = Math.max(0.3, Math.min(Math.PI / 2.2, spherical.phi + (e.clientY - prevMouse.y) * 0.004))
      prevMouse = { x: e.clientX, y: e.clientY }
      updateCamera()
    }
    const onMouseUp   = () => { isDragging = false; container.style.cursor = 'grab' }
    const onWheel     = (e: WheelEvent) => { spherical.radius = Math.max(10, Math.min(50, spherical.radius + e.deltaY * 0.02)); updateCamera() }

    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    container.addEventListener('wheel', onWheel)

    // ── Raycaster / tooltip ─────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster()
    const mouse2D   = new THREE.Vector2()

    const onContainerMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouse2D.x  = ((e.clientX - rect.left) / rect.width)  *  2 - 1
      mouse2D.y  = ((e.clientY - rect.top)  / rect.height) * -2 + 1
      raycaster.setFromCamera(mouse2D, camera)
      const hits = raycaster.intersectObjects(markersRef.current)
      if (hits.length > 0) {
        showTooltip(hits[0].object.userData, e.clientX - rect.left, e.clientY - rect.top)
        container.style.cursor = 'pointer'
      } else {
        hideTooltip()
        if (!isDragging) container.style.cursor = 'grab'
      }
    }
    const onMouseLeave = () => hideTooltip()
    container.addEventListener('mousemove', onContainerMouseMove)
    container.addEventListener('mouseleave', onMouseLeave)

    // ── Resize ──────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const nW = container.clientWidth
      const nH = container.clientHeight
      renderer.setSize(nW, nH)
      camera.aspect = nW / nH
      camera.updateProjectionMatrix()
    })
    ro.observe(container)

    // ── Animation loop ──────────────────────────────────────────────────────
    let t = 0
    function animate() {
      frameRef.current = requestAnimationFrame(animate)
      t += 0.008

      if (autoRotRef.current) { spherical.theta += 0.002; updateCamera() }

      if (terrainRef.current) {
        const pos  = terrainRef.current.geometry.attributes.position as THREE.BufferAttribute
        const orig = terrainRef.current.geometry.userData.originalY as Float32Array | undefined
        if (orig) {
          for (let i = 0; i < pos.count; i++) pos.setY(i, orig[i] + Math.sin(t + i * 0.15) * 0.04)
          pos.needsUpdate = true
          terrainRef.current.geometry.computeVertexNormals()
        }
      }

      markersRef.current.forEach((m, i) => {
        m.position.y  = (m.userData.baseY as number) + Math.sin(t * 1.2 + i * 0.8) * 0.15
        m.rotation.y += 0.01
      })

      renderer.render(scene, camera)
    }
    animate()

    // ── Cleanup ─────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameRef.current)
      ro.disconnect()
      container.removeEventListener('mousedown', onMouseDown)
      container.removeEventListener('mousemove', onContainerMouseMove)
      container.removeEventListener('mouseleave', onMouseLeave)
      container.removeEventListener('wheel', onWheel)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      renderer.dispose()
      if (renderer.domElement.parentNode) renderer.domElement.remove()
      sceneRef.current  = null
      rendererRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — scene init runs once

  // ── Tooltip helpers ────────────────────────────────────────────────────────
  function showTooltip(data: Record<string, any>, x: number, y: number) {
    const el = tooltipRef.current
    if (!el) return
    el.style.display = 'block'
    el.style.left    = `${x + 16}px`
    el.style.top     = `${Math.max(8, y - 60)}px`
    ;(el.querySelector('.tt-dot')       as HTMLElement).style.background = data.color
    ;(el.querySelector('.tt-label')     as HTMLElement).textContent      = data.label ?? `Call #${data.callId}`
    ;(el.querySelector('.tt-technique') as HTMLElement).textContent      = TECHNIQUE_LABELS[data.technique] ?? data.technique
    ;(el.querySelector('.tt-mood')      as HTMLElement).textContent      = `Mood ${(data.mood as number)?.toFixed(1)}/5`
    ;(el.querySelector('.tt-vol')       as HTMLElement).textContent      = `Volatility ${(data.volatility as number)?.toFixed(2)}`
  }

  function hideTooltip() {
    if (tooltipRef.current) tooltipRef.current.style.display = 'none'
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 520, background: '#050a14', borderRadius: 12, overflow: 'hidden', fontFamily: '"DM Mono", "Fira Code", monospace' }}>

      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* Title */}
      <div style={{ position: 'absolute', top: 20, left: 24, pointerEvents: 'none' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.18em', color: '#60a5fa', textTransform: 'uppercase', marginBottom: 4 }}>Emotional Terrain</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#e2e8f0', letterSpacing: '-0.02em' }}>{calls.length} sessions</div>
        <div style={{ fontSize: 11, color: '#4a6080', marginTop: 2 }}>X · time &nbsp;·&nbsp; Y · mood &nbsp;·&nbsp; Z · volatility</div>
      </div>

      {/* Legend */}
      <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'none' }}>
        {Object.entries(TECHNIQUE_COLORS).map(([key, hex]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: hex, boxShadow: `0 0 6px ${hex}` }} />
            <span style={{ fontSize: 10, color: '#4a6080', letterSpacing: '0.08em' }}>{TECHNIQUE_LABELS[key]}</span>
          </div>
        ))}
      </div>

      {/* Reward ribbon label */}
      <div style={{ position: 'absolute', bottom: 52, right: 20, pointerEvents: 'none', textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 10, color: '#34d399', letterSpacing: '0.1em' }}>REWARD RIBBON</span>
          <div style={{ width: 24, height: 3, background: 'linear-gradient(90deg, #0d6640, #34d399)', borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 10, color: '#2a5040', marginTop: 2 }}>model confidence over time</div>
      </div>

      {/* Controls hint */}
      <div style={{ position: 'absolute', bottom: 20, left: 24, pointerEvents: 'none' }}>
        <span style={{ fontSize: 10, color: '#2a3a5a', letterSpacing: '0.08em' }}>DRAG · ORBIT &nbsp;·&nbsp; SCROLL · ZOOM &nbsp;·&nbsp; HOVER · INSPECT</span>
      </div>

      {/* Live badge */}
      {liveMode && (
        <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.2s ease-in-out infinite' }} />
          <span style={{ fontSize: 11, color: '#ef4444', letterSpacing: '0.12em' }}>LIVE</span>
        </div>
      )}

      {/* Tooltip */}
      <div ref={tooltipRef} style={{ display: 'none', position: 'absolute', background: 'rgba(5,10,20,0.92)', border: '1px solid #1a3060', borderRadius: 8, padding: '10px 14px', pointerEvents: 'none', backdropFilter: 'blur(8px)', minWidth: 180 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div className="tt-dot" style={{ width: 8, height: 8, borderRadius: '50%' }} />
          <span className="tt-label" style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }} />
        </div>
        <div className="tt-technique" style={{ fontSize: 11, color: '#60a5fa', marginBottom: 4, letterSpacing: '0.06em' }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <span className="tt-mood" style={{ fontSize: 11, color: '#94a3b8' }} />
          <span className="tt-vol"  style={{ fontSize: 11, color: '#94a3b8' }} />
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }`}</style>
    </div>
  )
}

// ─── Supabase live hook ───────────────────────────────────────────────────────

export function useSupabaseLiveTerrain(supabase: any, userId: string | undefined) {
  useEffect(() => {
    if (!supabase || !userId) return
    const channel = supabase
      .channel('live-terrain-' + userId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calls', filter: `user_id=eq.${userId}` }, (payload: any) => {
        const row  = payload.new
        const call: CallData = {
          id:         row.id,
          mood:       row.mood_score        ?? 3,
          volatility: row.sentiment_variance ?? 0.5,
          technique:  row.primary_technique  ?? 'reflective',
          label:      row.session_label      ?? `Call ${row.id}`,
        }
        ;(window as any).__therapistRL_addCall?.(call)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, userId])
}