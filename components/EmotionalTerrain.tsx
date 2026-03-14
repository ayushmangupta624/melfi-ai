// 'use client'

// import { useEffect, useRef, useCallback } from 'react'
// import * as THREE from 'three'

// export interface CallData {
//   id: number | string
//   mood: number
//   volatility: number
//   technique: 'reflective' | 'reframing' | 'socratic' | 'somatic'
//   label: string
//   date?: string
//   memory?: string   // content from memory_chunks table
// }

// interface EmotionalTerrainProps {
//   calls?: CallData[]
//   liveMode?: boolean
// }

// const SAMPLE_CALLS: CallData[] = [
//   { id: 1,  mood: 3.2, volatility: 0.8, technique: 'reflective', label: 'Work stress surfaced',           date: '2026-02-14', memory: 'Felt overwhelmed by deadlines and avoided confronting the root cause at work.' },
//   { id: 2,  mood: 2.8, volatility: 1.1, technique: 'somatic',    label: 'Sleep issues emerged',           date: '2026-02-15', memory: 'Sleep has been broken for weeks. Exhaustion is making everything harder to cope with.' },
//   { id: 3,  mood: 3.5, volatility: 0.6, technique: 'reframing',  label: 'Started questioning the job',    date: '2026-02-16', memory: 'Began questioning whether the job itself is the real issue, or just the symptom.' },
//   { id: 4,  mood: 2.1, volatility: 1.4, technique: 'socratic',   label: 'Hard day',                       date: '2026-02-17', memory: 'A difficult conversation about a relationship that has been quietly falling apart.' },
//   { id: 5,  mood: 2.4, volatility: 1.2, technique: 'reflective', label: 'Opened up about family',         date: '2026-02-18', memory: 'Opened up about family pressure for the first time. More there than initially admitted.' },
//   { id: 6,  mood: 3.8, volatility: 0.5, technique: 'reframing',  label: 'Reframed the job situation',     date: '2026-02-19', memory: 'Reframed the job as a choice rather than a trap. Felt a small but real shift.' },
//   { id: 7,  mood: 4.1, volatility: 0.4, technique: 'socratic',   label: 'Anxiety was about control',      date: '2026-02-20', memory: 'Realised the anxiety is fundamentally about control, not outcomes. Important insight.' },
//   { id: 8,  mood: 3.6, volatility: 0.7, technique: 'reflective', label: 'Stable check-in',                date: '2026-02-21', memory: 'Talked through the week without catastrophising. Steadier than previous sessions.' },
//   { id: 9,  mood: 2.9, volatility: 0.9, technique: 'somatic',    label: 'Anxiety spike',                  date: '2026-02-22', memory: 'Anxiety spiked before a big presentation. Body tension was the first sign.' },
//   { id: 10, mood: 4.3, volatility: 0.3, technique: 'reframing',  label: 'Shifted perspective on success', date: '2026-02-23', memory: 'Shifted perspective on what success actually means. Less tied to external validation.' },
//   { id: 11, mood: 4.5, volatility: 0.2, technique: 'socratic',   label: 'Best session yet',               date: '2026-02-24', memory: 'Clearest session yet. Values came into sharp focus for the first time.' },
//   { id: 12, mood: 4.2, volatility: 0.4, technique: 'reflective', label: 'Felt genuinely heard',           date: '2026-02-25', memory: 'Felt genuinely heard. Something in the dynamic has shifted over recent calls.' },
//   { id: 13, mood: 3.9, volatility: 0.5, technique: 'reframing',  label: 'Progress on boundaries',         date: '2026-02-26', memory: 'Made real progress on setting boundaries with family. Harder in practice than theory.' },
//   { id: 14, mood: 4.6, volatility: 0.2, technique: 'socratic',   label: 'Named what matters',             date: '2026-02-27', memory: 'Named the things that actually matter. Shorter list than expected.' },
//   { id: 15, mood: 4.8, volatility: 0.1, technique: 'reflective', label: 'Calm. Something settled.',       date: '2026-02-28', memory: 'Something has settled. Hard to name exactly but palpably different from session one.' },
// ]

// function moodToHex(mood: number): string {
//   const t = Math.max(0, Math.min(1, (mood - 1) / 9))
//   if (t < 0.35) {
//     const r = Math.round(180 + t * 60); const g = Math.round(100 + t * 60); const b = Math.round(90 + t * 20)
//     return `rgb(${r},${g},${b})`
//   } else if (t < 0.7) {
//     const tt = (t - 0.35) / 0.35
//     const r = Math.round(194 + tt * 40); const g = Math.round(100 + tt * 52); const b = Math.round(30 - tt * 10)
//     return `rgb(${r},${g},${b})`
//   } else {
//     const tt = (t - 0.7) / 0.3
//     const r = Math.round(234 + tt * 12); const g = Math.round(152 + tt * 48); const b = Math.round(20 + tt * 20)
//     return `rgb(${r},${g},${b})`
//   }
// }

// function moodToThreeColor(mood: number): THREE.Color { return new THREE.Color(moodToHex(mood)) }

// function formatDate(d?: string): string {
//   if (!d) return ''
//   try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
//   catch { return d }
// }

// // ── Vertex shader ─────────────────────────────────────────────────────────────
// const vertexShader = `
//   uniform float uTime;
//   attribute float aOrigY;
//   attribute float aVol;
//   attribute float aMood;
//   varying float vHeight;
//   varying float vMood;
//   varying float vVol;
//   varying vec3  vNormal;
//   varying vec3  vWorldPos;

//   vec3 hash3(vec3 p) {
//     p = vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));
//     return -1.0 + 2.0*fract(sin(p)*43758.5453123);
//   }
//   float snoise(vec3 p) {
//     vec3 i=floor(p);vec3 f=fract(p);vec3 u=f*f*(3.0-2.0*f);
//     return mix(mix(mix(dot(hash3(i),f),dot(hash3(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),
//                    mix(dot(hash3(i+vec3(0,1,0)),f-vec3(0,1,0)),dot(hash3(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
//                mix(mix(dot(hash3(i+vec3(0,0,1)),f-vec3(0,0,1)),dot(hash3(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),
//                    mix(dot(hash3(i+vec3(0,1,1)),f-vec3(0,1,1)),dot(hash3(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);
//   }

//   void main() {
//     vec3 pos = position;
//     float micro  = snoise(vec3(pos.x*0.7,pos.z*0.7,uTime*0.07))*0.10*aVol;
//     float fine   = snoise(vec3(pos.x*2.0,pos.z*2.0,uTime*0.04))*0.03*aVol;
//     float breath = sin(uTime*0.45+pos.x*0.35+pos.z*0.25)*0.025;
//     pos.y = aOrigY + micro + fine + breath;
//     vHeight   = pos.y;
//     vMood     = aMood;
//     vVol      = aVol;
//     vNormal   = normalize(normalMatrix * normal);
//     vWorldPos = (modelMatrix * vec4(pos,1.0)).xyz;
//     gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
//   }
// `

// // ── Fragment shader ───────────────────────────────────────────────────────────
// const fragmentShader = `
//   uniform float uTime;
//   uniform float uMaxHeight;
//   varying float vHeight;
//   varying float vMood;
//   varying float vVol;
//   varying vec3  vNormal;
//   varying vec3  vWorldPos;

//   float contour(float val, float spacing, float w) {
//     float v = mod(val, spacing);
//     return smoothstep(0.0,w,v)*(1.0-smoothstep(spacing-w,spacing,v));
//   }

//   void main() {
//     float t = clamp(vMood/10.0, 0.0, 1.0);
//     float heightNorm = clamp(vHeight/max(uMaxHeight,0.1), 0.0, 1.0);

//     // Light warm palette
//     vec3 colBase = vec3(0.98,0.97,0.95);
//     vec3 colLow  = vec3(0.86,0.72,0.68);
//     vec3 colMid  = vec3(0.94,0.58,0.38);
//     vec3 colHigh = vec3(0.99,0.82,0.55);

//     vec3 moodColor;
//     if (t < 0.45) moodColor = mix(colLow, colMid, t/0.45);
//     else          moodColor = mix(colMid, colHigh, (t-0.45)/0.55);
//     vec3 baseColor = mix(colBase, moodColor, smoothstep(0.0,0.5,heightNorm));

//     // Volatile zones → warm ash
//     baseColor = mix(baseColor, vec3(0.84,0.79,0.75), clamp(vVol*0.38,0.0,0.48));

//     // ── Animated contour lines ────────────────────────────────────────────
//     float flow = uTime*0.045;
//     float c1 = contour(vHeight+flow,       0.32, 0.012);
//     float c2 = contour(vHeight+flow*0.55,  0.65, 0.008);
//     float c3 = contour(vHeight-flow*0.28,  1.05, 0.005);
//     float cMask = max(c1*0.42, max(c2*0.26, c3*0.16));
//     baseColor = mix(baseColor, vec3(0.72,0.24,0.06), cMask*(0.25+heightNorm*0.38));

//     // ── Smooth parallel black grid lines ─────────────────────────────────
//     // Lines in world X direction (time axis)
//     float gridX = abs(fract(vWorldPos.x * 0.625) - 0.5);  // one line per call spacing
//     float lineX = 1.0 - smoothstep(0.0, 0.022, gridX);
//     // Lines in world Z direction (cross-section)
//     float gridZ = abs(fract(vWorldPos.z * 0.5) - 0.5);
//     float lineZ = 1.0 - smoothstep(0.0, 0.018, gridZ);
//     float gridMask = max(lineX, lineZ) * 0.28;
//     // Fade grid lines in valleys, stronger on mid-slopes
//     float gridFade = smoothstep(0.05, 0.5, heightNorm);
//     baseColor = mix(baseColor, vec3(0.08,0.06,0.04), gridMask * gridFade);

//     // ── Ridge glow ────────────────────────────────────────────────────────
//     float ridgeGlow = pow(heightNorm, 2.5) * 0.28;
//     baseColor = mix(baseColor, vec3(1.0,0.88,0.62), ridgeGlow);

//     // ── Diffuse lighting ──────────────────────────────────────────────────
//     vec3 L = normalize(vec3(0.5,1.0,0.6));
//     float diff = max(dot(vNormal,L),0.0)*0.52+0.48;
//     baseColor *= diff;

//     // ── Specular ──────────────────────────────────────────────────────────
//     vec3 V = normalize(cameraPosition-vWorldPos);
//     vec3 H = normalize(L+V);
//     float spec = pow(max(dot(vNormal,H),0.0),52.0)*heightNorm*0.16;
//     baseColor += vec3(1.0,0.9,0.8)*spec;

//     // ── Valley AO ─────────────────────────────────────────────────────────
//     float ao = mix(0.84,1.0,heightNorm);
//     baseColor *= ao;

//     gl_FragColor = vec4(baseColor, 0.97);
//   }
// `

// export default function EmotionalTerrain({ calls = SAMPLE_CALLS, liveMode = false }: EmotionalTerrainProps) {
//   const mountRef    = useRef<HTMLDivElement>(null)
//   const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
//   const sceneRef    = useRef<THREE.Scene | null>(null)
//   const cameraRef   = useRef<THREE.PerspectiveCamera | null>(null)
//   const terrainRef  = useRef<THREE.Mesh | null>(null)
//   const wireRef     = useRef<THREE.Mesh | null>(null)
//   const markersRef  = useRef<THREE.Mesh[]>([])
//   const stemsRef    = useRef<THREE.Line[]>([])
//   const ringsRef    = useRef<THREE.Mesh[]>([])
//   const frameRef    = useRef<number>(0)
//   const tooltipRef  = useRef<HTMLDivElement>(null)
//   const callsRef    = useRef<CallData[]>(calls)
//   const autoRotRef  = useRef(true)
//   const shaderRef   = useRef<THREE.ShaderMaterial | null>(null)
//   const clockRef    = useRef(new THREE.Clock())

//   useEffect(() => { callsRef.current = calls }, [calls])

//   const STEP = 1.6   // world units per call — single source of truth

//   const buildTerrain = useCallback((scene: THREE.Scene) => {
//     if (terrainRef.current) { scene.remove(terrainRef.current); terrainRef.current.geometry.dispose(); (terrainRef.current.material as THREE.Material).dispose() }
//     if (wireRef.current)    { scene.remove(wireRef.current);    wireRef.current.geometry.dispose();    (wireRef.current.material as THREE.Material).dispose() }

//     const data   = callsRef.current
//     const cols   = data.length
//     const totalW = (cols - 1) * STEP     // span from first to last call center
//     const DEPTH  = 14.0
//     const segX   = (cols - 1) * 4        // 4 verts per call gap for smooth interp
//     const segZ   = 44

//     // PlaneGeometry is centered at 0 — spans [-totalW/2 .. +totalW/2]
//     // so vertex at col=0 lands at x=-totalW/2, col=segX lands at x=+totalW/2
//     // markers use x = i*STEP - totalW/2, same formula — guaranteed alignment
//     const geo = new THREE.PlaneGeometry(totalW, DEPTH, segX, segZ)
//     geo.rotateX(-Math.PI / 2)

//     const pos    = geo.attributes.position as THREE.BufferAttribute
//     const vCount = pos.count
//     const aOrigY   = new Float32Array(vCount)
//     const aMoodArr = new Float32Array(vCount)
//     const aVolArr  = new Float32Array(vCount)
//     let maxH = 0

//     for (let vi = 0; vi < vCount; vi++) {
//       const col   = vi % (segX + 1)
//       const row   = Math.floor(vi / (segX + 1))
//       const frac  = cols > 1 ? col / segX : 0
//       const callF = frac * (cols - 1)
//       const ci0   = Math.min(Math.floor(callF), cols - 1)
//       const ci1   = Math.min(ci0 + 1, cols - 1)
//       const blend = callF - ci0
//       const c0    = data[ci0]
//       const c1    = data[ci1]

//       const mood = c0.mood + (c1.mood - c0.mood) * blend
//       const vol  = c0.volatility + (c1.volatility - c0.volatility) * blend

//       // Z axis = mood: full 1–10 range drives the ridge height
//       // Scale: mood/10 * 6 gives 0.6 (low) to 6.0 (high) — dramatic rise/fall
//       const zNorm = (row / segZ) * 2 - 1
//       // Wider gaussian so the ridge fills the Z depth more
//       const ridge = Math.exp(-zNorm * zNorm * 1.4)
//       const moodHeight = (mood / 10) * 6.5 * ridge
//       const noise = (Math.sin(callF * 2.1 + row * 1.7) * 0.4 + Math.cos(callF * 1.3 - row * 2.3) * 0.4) * vol * 0.6
//       const height = moodHeight + noise

//       pos.setY(vi, height)
//       aOrigY[vi]   = height
//       aMoodArr[vi] = mood
//       aVolArr[vi]  = vol
//       if (height > maxH) maxH = height
//     }

//     geo.setAttribute('aOrigY', new THREE.BufferAttribute(aOrigY, 1))
//     geo.setAttribute('aMood',  new THREE.BufferAttribute(aMoodArr, 1))
//     geo.setAttribute('aVol',   new THREE.BufferAttribute(aVolArr, 1))
//     geo.computeVertexNormals()

//     const mat = new THREE.ShaderMaterial({
//       vertexShader, fragmentShader,
//       uniforms: { uTime: { value: 0 }, uMaxHeight: { value: maxH } },
//       side: THREE.DoubleSide, transparent: true,
//     })
//     shaderRef.current = mat

//     const terrain = new THREE.Mesh(geo, mat)
//     terrain.receiveShadow = true
//     terrain.castShadow    = true
//     terrain.position.x    = 0    // mesh is already centered — no offset needed
//     scene.add(terrain)
//     terrainRef.current = terrain

//     // Wireframe on lower-res clone — purely for the subtle grid edge feel
//     const wireGeo = new THREE.PlaneGeometry(totalW, DEPTH, cols - 1, 10)
//     wireGeo.rotateX(-Math.PI / 2)
//     const wire = new THREE.Mesh(wireGeo, new THREE.MeshBasicMaterial({ color: 0x1c1917, wireframe: true, transparent: true, opacity: 0.05 }))
//     wire.position.copy(terrain.position)
//     scene.add(wire)
//     wireRef.current = wire
//   }, [])

//   const buildMarkers = useCallback((scene: THREE.Scene) => {
//     markersRef.current.forEach(m => scene.remove(m))
//     stemsRef.current.forEach(s => scene.remove(s))
//     ringsRef.current.forEach(r => scene.remove(r))
//     markersRef.current = []
//     stemsRef.current   = []
//     ringsRef.current   = []

//     const data   = callsRef.current
//     const cols   = data.length
//     const totalW = (cols - 1) * STEP
//     // First call at x = -totalW/2, last at x = +totalW/2
//     // matches PlaneGeometry which also spans [-totalW/2 .. +totalW/2]
//     const startX = -totalW / 2

//     data.forEach((call, i) => {
//       const x     = startX + i * STEP
//       // Peak Y: mood/10 * 6.5 at ridge center (zNorm=0, ridge=1.0), plus offset
//       const peakY = (call.mood / 10) * 6.5 + 0.35
//       const tc    = moodToThreeColor(call.mood)

//       const marker = new THREE.Mesh(
//         new THREE.OctahedronGeometry(0.20, 0),
//         new THREE.MeshPhongMaterial({ color: tc, emissive: tc, emissiveIntensity: 0.35, shininess: 90, transparent: true, opacity: 0.92 })
//       )
//       marker.position.set(x, peakY + 0.5, 0)
//       marker.castShadow = true
//       marker.userData   = {
//         callId: call.id, mood: call.mood, volatility: call.volatility,
//         label: call.label, date: call.date, memory: call.memory,
//         baseY: peakY + 0.5, color: moodToHex(call.mood),
//       }
//       scene.add(marker)
//       markersRef.current.push(marker)

//       const stem = new THREE.Line(
//         new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, peakY, 0), new THREE.Vector3(x, peakY + 0.45, 0)]),
//         new THREE.LineBasicMaterial({ color: tc, transparent: true, opacity: 0.4 })
//       )
//       scene.add(stem)
//       stemsRef.current.push(stem)

//       const ring = new THREE.Mesh(
//         new THREE.RingGeometry(0.28, 0.34, 16),
//         new THREE.MeshBasicMaterial({ color: tc, side: THREE.DoubleSide, transparent: true, opacity: 0.15 })
//       )
//       ring.position.set(x, peakY + 0.5, 0)
//       ring.rotation.x = Math.PI / 2
//       scene.add(ring)
//       ringsRef.current.push(ring)
//     })
//   }, [])

//   const rebuildAll = useCallback(() => {
//     const scene = sceneRef.current
//     if (!scene) return
//     buildTerrain(scene)
//     buildMarkers(scene)
//   }, [buildTerrain, buildMarkers])

//   const addLiveCall = useCallback((newCall: CallData) => {
//     callsRef.current = [...callsRef.current, newCall]
//     rebuildAll()
//   }, [rebuildAll])

//   useEffect(() => {
//     (window as any).__therapistRL_addCall = addLiveCall
//     return () => { delete (window as any).__therapistRL_addCall }
//   }, [addLiveCall])

//   useEffect(() => {
//     const container = mountRef.current
//     if (!container) return
//     const W = container.clientWidth
//     const H = container.clientHeight

//     const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
//     renderer.setSize(W, H)
//     renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
//     renderer.shadowMap.enabled = true
//     renderer.shadowMap.type    = THREE.PCFSoftShadowMap
//     container.appendChild(renderer.domElement)
//     rendererRef.current = renderer

//     const scene = new THREE.Scene()
//     scene.background = new THREE.Color(0xfafaf5)
//     scene.fog        = new THREE.Fog(0xfafaf5, 30, 58)
//     sceneRef.current = scene

//     const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 120)
//     camera.position.set(0, 14, 24)
//     camera.lookAt(0, 2, 0)
//     cameraRef.current = camera

//     scene.add(new THREE.AmbientLight(0xfff8f0, 2.4))
//     const sun = new THREE.DirectionalLight(0xfff0e0, 1.5)
//     sun.position.set(8, 20, 12); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024)
//     scene.add(sun)
//     const fill = new THREE.DirectionalLight(0xfce8d8, 0.5)
//     fill.position.set(-10, 6, -8); scene.add(fill)
//     const bounce = new THREE.PointLight(0xea580c, 0.18, 40)
//     bounce.position.set(0, 6, 0); scene.add(bounce)

//     const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ opacity: 0.03 }))
//     ground.rotation.x = -Math.PI / 2; ground.position.y = -0.5; ground.receiveShadow = true
//     scene.add(ground)

//     buildTerrain(scene)

//     // ── Ground grid plane ─────────────────────────────────────────────────────
// const gridSize  = 60
// const gridCount = 36   // lines in each direction

// // Create custom grid with thick smooth lines using a shader plane
// const gridGeo = new THREE.PlaneGeometry(gridSize, gridSize, gridCount, gridCount)
// gridGeo.rotateX(-Math.PI / 2)

// const gridMat = new THREE.ShaderMaterial({
//   transparent: true,
//   side: THREE.DoubleSide,
//   uniforms: { uOpacity: { value: 1.0 } },
//   vertexShader: `
//     varying vec2 vUv;
//     void main() {
//       vUv = uv;
//       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//     }
//   `,
//   fragmentShader: `
//     varying vec2 vUv;
//     uniform float uOpacity;
//     void main() {
//       vec2 grid = abs(fract(vUv * ${gridCount}.0) - 0.5);
//       float lineX = 1.0 - smoothstep(0.0, 0.018, grid.x);
//       float lineY = 1.0 - smoothstep(0.0, 0.018, grid.y);
//       float line  = max(lineX, lineY);
//       if (line < 0.05) discard;
//       // Fade toward edges
//       float edgeFade = smoothstep(0.0, 0.12, min(vUv.x, min(1.0-vUv.x, min(vUv.y, 1.0-vUv.y))));
//       gl_FragColor = vec4(0.08, 0.06, 0.04, line * 0.18 * edgeFade * uOpacity);
//     }
//   `,
// })

// const gridPlane = new THREE.Mesh(gridGeo, gridMat)
// gridPlane.position.y = -0.48   // just below terrain floor
// scene.add(gridPlane)


// // ── Background particles ──────────────────────────────────────────────────
// const particleCount = 320
// const pPositions    = new Float32Array(particleCount * 3)
// const pSizes        = new Float32Array(particleCount)

// for (let i = 0; i < particleCount; i++) {
//   pPositions[i * 3]     = (Math.random() - 0.5) * 50    // x
//   pPositions[i * 3 + 1] = Math.random() * 18 + 1        // y — float above ground
//   pPositions[i * 3 + 2] = (Math.random() - 0.5) * 40    // z
//   pSizes[i]             = Math.random() * 0.5 + 0.15
// }

// const pGeo = new THREE.BufferGeometry()
// pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3))
// pGeo.setAttribute('size',     new THREE.BufferAttribute(pSizes, 1))

// const pMat = new THREE.ShaderMaterial({
//   transparent: true,
//   depthWrite:  false,
//   // blending:    THREE.AdditiveBlending,
//   uniforms:    { uTime: { value: 0 } },
//   vertexShader: `
//     attribute float size;
//     uniform float uTime;
//     varying float vAlpha;
//     void main() {
//       vec3 pos = position;
//       // Gentle vertical drift
//       pos.y += sin(uTime * 0.4 + position.x * 0.3 + position.z * 0.2) * 0.35;
//       // Slight horizontal sway
//       pos.x += cos(uTime * 0.25 + position.z * 0.4) * 0.15;
//       vAlpha = 0.3 + sin(uTime * 0.6 + position.y * 0.8) * 0.15;
//       vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
//       gl_PointSize = size * (280.0 / -mvPos.z);
//       gl_Position  = projectionMatrix * mvPos;
//     }
//   `,
//   fragmentShader: `
//     varying float vAlpha;
//     void main() {
//       // Soft circular particle
//       vec2  uv   = gl_PointCoord - 0.5;
//       float dist = length(uv);
//       if (dist > 0.5) discard;
//       float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;
//       // Warm terracotta tint
//       gl_FragColor = vec4(0.76, 0.35, 0.14, alpha * 0.55);
//     }
//   `,
// })

// const particles = new THREE.Points(pGeo, pMat)
// scene.add(particles)

// // Store ref so animate loop can update uTime
// // Add particleMatRef to your refs at top of component:
// // const particleMatRef = useRef<THREE.ShaderMaterial | null>(null)
// // particleMatRef.current = pMat



//     buildMarkers(scene)

//     let isDragging = false
//     let prevMouse  = { x: 0, y: 0 }
//     const spherical = { theta: 0.15, phi: 1.0, radius: 28 }

//     function updateCamera() {
//       camera.position.set(
//         spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta),
//         spherical.radius * Math.cos(spherical.phi),
//         spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)
//       )
//       camera.lookAt(0, 2, 0)
//     }

//     const onMouseDown = (e: MouseEvent) => { isDragging = true; autoRotRef.current = false; prevMouse = { x: e.clientX, y: e.clientY }; container.style.cursor = 'grabbing' }
//     const onMouseMove = (e: MouseEvent) => {
//       if (!isDragging) return
//       spherical.theta -= (e.clientX - prevMouse.x) * 0.005
//       spherical.phi    = Math.max(0.28, Math.min(Math.PI / 2.1, spherical.phi + (e.clientY - prevMouse.y) * 0.004))
//       prevMouse = { x: e.clientX, y: e.clientY }
//       updateCamera()
//     }
//     const onMouseUp = () => { isDragging = false; container.style.cursor = 'grab' }
//     const onWheel   = (e: WheelEvent) => { spherical.radius = Math.max(10, Math.min(52, spherical.radius + e.deltaY * 0.022)); updateCamera() }

//     container.addEventListener('mousedown', onMouseDown)
//     window.addEventListener('mousemove', onMouseMove)
//     window.addEventListener('mouseup', onMouseUp)
//     container.addEventListener('wheel', onWheel)

//     const raycaster = new THREE.Raycaster()
//     const mouse2D   = new THREE.Vector2()

//     const onContainerMouseMove = (e: MouseEvent) => {
//       const rect = container.getBoundingClientRect()
//       mouse2D.x  = ((e.clientX - rect.left) / rect.width)  *  2 - 1
//       mouse2D.y  = ((e.clientY - rect.top)  / rect.height) * -2 + 1
//       raycaster.setFromCamera(mouse2D, camera)
//       const hits = raycaster.intersectObjects(markersRef.current)
//       if (hits.length > 0) {
//         showTooltip(hits[0].object.userData, e.clientX - rect.left, e.clientY - rect.top)
//         container.style.cursor = 'pointer'
//       } else {
//         hideTooltip()
//         if (!isDragging) container.style.cursor = 'grab'
//       }
//     }
//     container.addEventListener('mousemove', onContainerMouseMove)
//     container.addEventListener('mouseleave', hideTooltip)

//     const ro = new ResizeObserver(() => {
//       const nW = container.clientWidth; const nH = container.clientHeight
//       renderer.setSize(nW, nH); camera.aspect = nW / nH; camera.updateProjectionMatrix()
//     })
//     ro.observe(container)

//     function animate() {
//       frameRef.current = requestAnimationFrame(animate)
//       const t = clockRef.current.getElapsedTime()
//       if (autoRotRef.current) { spherical.theta += 0.0015; updateCamera() }
//       if (shaderRef.current)  shaderRef.current.uniforms.uTime.value = t
//       markersRef.current.forEach((m, i) => {
//         m.position.y  = (m.userData.baseY as number) + Math.sin(t * 1.1 + i * 0.8) * 0.12
//         m.rotation.y += 0.008
//       })
//       renderer.render(scene, camera)
//     }
//     animate()

//     return () => {
//       cancelAnimationFrame(frameRef.current)
//       ro.disconnect()
//       container.removeEventListener('mousedown', onMouseDown)
//       container.removeEventListener('mousemove', onContainerMouseMove)
//       container.removeEventListener('mouseleave', hideTooltip)
//       container.removeEventListener('wheel', onWheel)
//       window.removeEventListener('mousemove', onMouseMove)
//       window.removeEventListener('mouseup', onMouseUp)
//       renderer.dispose()
//       if (renderer.domElement.parentNode) renderer.domElement.remove()
//       sceneRef.current = null; rendererRef.current = null
//     }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])

//   function showTooltip(data: Record<string, any>, x: number, y: number) {
//     const el = tooltipRef.current
//     if (!el) return
//     el.style.display = 'block'
//     el.style.left    = `${Math.min(x + 16, window.innerWidth - 280)}px`
//     el.style.top     = `${Math.max(y - 90, 8)}px`
//     ;(el.querySelector('.tt-dot')    as HTMLElement).style.background = data.color
//     ;(el.querySelector('.tt-date')   as HTMLElement).textContent = formatDate(data.date)
//     ;(el.querySelector('.tt-label')  as HTMLElement).textContent = data.label ?? `Session ${data.callId}`
//     ;(el.querySelector('.tt-memory') as HTMLElement).textContent = data.memory ?? ''
//     ;(el.querySelector('.tt-memory') as HTMLElement).style.display = data.memory ? 'block' : 'none'
//     ;(el.querySelector('.tt-mood')   as HTMLElement).textContent = `Mood ${(data.mood as number)?.toFixed(1)} / 10`
//     ;(el.querySelector('.tt-vol')    as HTMLElement).textContent = `Volatility ${(data.volatility as number)?.toFixed(2)}`
//   }

//   function hideTooltip() {
//     if (tooltipRef.current) tooltipRef.current.style.display = 'none'
//   }

//   return (
//     <div style={{
//       position: 'relative', width: '100%', height: '100%', minHeight: 520,
//       background: '#fafaf5', borderRadius: 16, overflow: 'hidden',
//       fontFamily: '"DM Mono", "Fira Code", "Courier New", monospace',
//       boxShadow: '0 1px 3px rgba(28,25,23,0.06), 0 8px 32px rgba(28,25,23,0.04)',
//     }}>
//       <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

//       <div style={{ position: 'absolute', top: 22, left: 26, pointerEvents: 'none' }}>
//         <div style={{ fontSize: 10, letterSpacing: '0.18em', color: '#c2410c', textTransform: 'uppercase', marginBottom: 5 }}>Emotional Terrain</div>
//         <div style={{ fontSize: 21, fontWeight: 600, color: '#1c1917', letterSpacing: '-0.02em', lineHeight: 1 }}>
//           {calls.length} {calls.length === 1 ? 'session' : 'sessions'}
//         </div>
//         <div style={{ fontSize: 10, color: 'rgba(28,25,23,0.35)', marginTop: 4, letterSpacing: '0.06em' }}>
//           X · time &nbsp;·&nbsp; Y · mood &nbsp;·&nbsp; Z · mood intensity
//         </div>
//       </div>

//       <div style={{ position: 'absolute', top: 22, right: 22, pointerEvents: 'none' }}>
//         <div style={{ fontSize: 9, color: 'rgba(28,25,23,0.4)', letterSpacing: '0.14em', marginBottom: 7, textAlign: 'right' }}>MOOD</div>
//         <div style={{ width: 10, height: 72, borderRadius: 5, marginLeft: 'auto', background: 'linear-gradient(to top, rgb(180,100,90), rgb(194,65,12), rgb(234,88,12), rgb(251,191,36))', opacity: 0.75 }} />
//         <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 9, color: 'rgba(28,25,23,0.35)' }}>
//           <span>low</span><span style={{ marginLeft: 6 }}>high</span>
//         </div>
//       </div>

//       <div style={{ position: 'absolute', bottom: 18, left: 26, pointerEvents: 'none' }}>
//         <span style={{ fontSize: 9, color: 'rgba(28,25,23,0.2)', letterSpacing: '0.1em' }}>DRAG · ORBIT &nbsp;·&nbsp; SCROLL · ZOOM &nbsp;·&nbsp; HOVER · INSPECT</span>
//       </div>

//       {liveMode && (
//         <div style={{ position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 7 }}>
//           <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ea580c', animation: 'trlPulse 1.4s ease-in-out infinite' }} />
//           <span style={{ fontSize: 9, color: '#ea580c', letterSpacing: '0.16em' }}>LIVE</span>
//         </div>
//       )}

//       {/* Tooltip with date, label, memory summary, and metadata */}
//       <div ref={tooltipRef} style={{
//         display: 'none', position: 'absolute',
//         background: 'rgba(250,250,245,0.98)',
//         border: '1px solid rgba(194,65,12,0.18)',
//         borderRadius: 10, padding: '12px 15px',
//         pointerEvents: 'none', minWidth: 200, maxWidth: 270,
//         backdropFilter: 'blur(12px)',
//         boxShadow: '0 4px 24px rgba(28,25,23,0.10)',
//       }}>
//         {/* Date */}
//         <div className="tt-date" style={{ fontSize: 10, color: '#c2410c', letterSpacing: '0.1em', marginBottom: 7, textTransform: 'uppercase' }} />
//         {/* Label + dot */}
//         <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
//           <div className="tt-dot" style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 3 }} />
//           <span className="tt-label" style={{ fontSize: 12, color: '#1c1917', lineHeight: 1.5, fontWeight: 500 }} />
//         </div>
//         {/* Memory summary */}
//         <div className="tt-memory" style={{
//           fontSize: 11, color: 'rgba(28,25,23,0.6)', lineHeight: 1.6,
//           marginBottom: 9, fontStyle: 'italic',
//           borderLeft: '2px solid rgba(194,65,12,0.25)', paddingLeft: 8,
//         }} />
//         {/* Metadata */}
//         <div style={{ display: 'flex', gap: 12, borderTop: '1px solid rgba(28,25,23,0.07)', paddingTop: 8 }}>
//           <span className="tt-mood" style={{ fontSize: 10, color: 'rgba(28,25,23,0.45)', letterSpacing: '0.05em' }} />
//           <span className="tt-vol"  style={{ fontSize: 10, color: 'rgba(28,25,23,0.3)',  letterSpacing: '0.05em' }} />
//         </div>
//       </div>

//       <style>{`
//         @keyframes trlPulse {
//           0%,100%{opacity:1;transform:scale(1)}
//           50%{opacity:0.35;transform:scale(1.5)}
//         }
//       `}</style>
//     </div>
//   )
// }

// export function useSupabaseLiveTerrain(supabase: any, userId: string | undefined) {
//   useEffect(() => {
//     if (!supabase || !userId) return
//     const channel = supabase
//       .channel('live-terrain-' + userId)
//       .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calls', filter: `user_id=eq.${userId}` }, (payload: any) => {
//         const row = payload.new
//         const call: CallData = {
//           id: row.id, mood: row.mood_score ?? 5, volatility: row.sentiment_variance ?? 0.5,
//           technique: 'reflective', label: row.session_label ?? `Session ${row.id}`,
//           date: row.scheduled_at ?? row.created_at, memory: undefined,
//         }
//         ;(window as any).__therapistRL_addCall?.(call)
//       })
//       .subscribe()
//     return () => { supabase.removeChannel(channel) }
//   }, [supabase, userId])
// }
'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'

export interface CallData {
  id: number | string
  mood: number
  volatility: number
  technique: 'reflective' | 'reframing' | 'socratic' | 'somatic'
  label: string
  date?: string
  memory?: string
}

interface EmotionalTerrainProps {
  calls?: CallData[]
  liveMode?: boolean
}

const SAMPLE_CALLS: CallData[] = [
  { id: 1,  mood: 3.2, volatility: 0.8, technique: 'reflective', label: 'Work stress surfaced',           date: '2026-02-14', memory: 'Felt overwhelmed by deadlines and avoided confronting the root cause at work.' },
  { id: 2,  mood: 2.8, volatility: 1.1, technique: 'somatic',    label: 'Sleep issues emerged',           date: '2026-02-15', memory: 'Sleep has been broken for weeks. Exhaustion is making everything harder to cope with.' },
  { id: 3,  mood: 3.5, volatility: 0.6, technique: 'reframing',  label: 'Started questioning the job',    date: '2026-02-16', memory: 'Began questioning whether the job itself is the real issue, or just the symptom.' },
  { id: 4,  mood: 2.1, volatility: 1.4, technique: 'socratic',   label: 'Hard day',                       date: '2026-02-17', memory: 'A difficult conversation about a relationship that has been quietly falling apart.' },
  { id: 5,  mood: 2.4, volatility: 1.2, technique: 'reflective', label: 'Opened up about family',         date: '2026-02-18', memory: 'Opened up about family pressure for the first time. More there than initially admitted.' },
  { id: 6,  mood: 3.8, volatility: 0.5, technique: 'reframing',  label: 'Reframed the job situation',     date: '2026-02-19', memory: 'Reframed the job as a choice rather than a trap. Felt a small but real shift.' },
  { id: 7,  mood: 4.1, volatility: 0.4, technique: 'socratic',   label: 'Anxiety was about control',      date: '2026-02-20', memory: 'Realised the anxiety is fundamentally about control, not outcomes. Important insight.' },
  { id: 8,  mood: 3.6, volatility: 0.7, technique: 'reflective', label: 'Stable check-in',                date: '2026-02-21', memory: 'Talked through the week without catastrophising. Steadier than previous sessions.' },
  { id: 9,  mood: 2.9, volatility: 0.9, technique: 'somatic',    label: 'Anxiety spike',                  date: '2026-02-22', memory: 'Anxiety spiked before a big presentation. Body tension was the first sign.' },
  { id: 10, mood: 4.3, volatility: 0.3, technique: 'reframing',  label: 'Shifted perspective on success', date: '2026-02-23', memory: 'Shifted perspective on what success actually means. Less tied to external validation.' },
  { id: 11, mood: 4.5, volatility: 0.2, technique: 'socratic',   label: 'Best session yet',               date: '2026-02-24', memory: 'Clearest session yet. Values came into sharp focus for the first time.' },
  { id: 12, mood: 4.2, volatility: 0.4, technique: 'reflective', label: 'Felt genuinely heard',           date: '2026-02-25', memory: 'Felt genuinely heard. Something in the dynamic has shifted over recent calls.' },
  { id: 13, mood: 3.9, volatility: 0.5, technique: 'reframing',  label: 'Progress on boundaries',         date: '2026-02-26', memory: 'Made real progress on setting boundaries with family. Harder in practice than theory.' },
  { id: 14, mood: 4.6, volatility: 0.2, technique: 'socratic',   label: 'Named what matters',             date: '2026-02-27', memory: 'Named the things that actually matter. Shorter list than expected.' },
  { id: 15, mood: 4.8, volatility: 0.1, technique: 'reflective', label: 'Calm. Something settled.',       date: '2026-02-28', memory: 'Something has settled. Hard to name exactly but palpably different from session one.' },
]

function moodToHex(mood: number): string {
  const t = Math.max(0, Math.min(1, (mood - 1) / 9))
  if (t < 0.35) {
    const r = Math.round(180 + t * 60); const g = Math.round(100 + t * 60); const b = Math.round(90 + t * 20)
    return `rgb(${r},${g},${b})`
  } else if (t < 0.7) {
    const tt = (t - 0.35) / 0.35
    const r = Math.round(194 + tt * 40); const g = Math.round(100 + tt * 52); const b = Math.round(30 - tt * 10)
    return `rgb(${r},${g},${b})`
  } else {
    const tt = (t - 0.7) / 0.3
    const r = Math.round(234 + tt * 12); const g = Math.round(152 + tt * 48); const b = Math.round(20 + tt * 20)
    return `rgb(${r},${g},${b})`
  }
}

function moodToThreeColor(mood: number): THREE.Color { return new THREE.Color(moodToHex(mood)) }

function formatDate(d?: string): string {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return d }
}

// ── Vertex shader ─────────────────────────────────────────────────────────────
const vertexShader = `
  uniform float uTime;
  attribute float aOrigY;
  attribute float aVol;
  attribute float aMood;
  varying float vHeight;
  varying float vMood;
  varying float vVol;
  varying vec3  vNormal;
  varying vec3  vWorldPos;

  vec3 hash3(vec3 p) {
    p = vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));
    return -1.0 + 2.0*fract(sin(p)*43758.5453123);
  }
  float snoise(vec3 p) {
    vec3 i=floor(p);vec3 f=fract(p);vec3 u=f*f*(3.0-2.0*f);
    return mix(mix(mix(dot(hash3(i),f),dot(hash3(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),
                   mix(dot(hash3(i+vec3(0,1,0)),f-vec3(0,1,0)),dot(hash3(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
               mix(mix(dot(hash3(i+vec3(0,0,1)),f-vec3(0,0,1)),dot(hash3(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),
                   mix(dot(hash3(i+vec3(0,1,1)),f-vec3(0,1,1)),dot(hash3(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);
  }

  void main() {
    vec3 pos = position;
    // Noise scaled by volatility — more volatile = more micro-disturbance
    float micro  = snoise(vec3(pos.x*0.7,pos.z*0.7,uTime*0.07))*0.10*aVol;
    float fine   = snoise(vec3(pos.x*2.0,pos.z*2.0,uTime*0.04))*0.03*aVol;
    float breath = sin(uTime*0.45+pos.x*0.35+pos.z*0.25)*0.025;
    pos.y = aOrigY + micro + fine + breath;
    vHeight   = pos.y;
    vMood     = aMood;
    vVol      = aVol;
    vNormal   = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(pos,1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
  }
`

// ── Fragment shader ───────────────────────────────────────────────────────────
const fragmentShader = `
  uniform float uTime;
  uniform float uMaxHeight;
  varying float vHeight;
  varying float vMood;
  varying float vVol;
  varying vec3  vNormal;
  varying vec3  vWorldPos;

  float contour(float val, float spacing, float w) {
    float v = mod(val, spacing);
    return smoothstep(0.0,w,v)*(1.0-smoothstep(spacing-w,spacing,v));
  }

  void main() {
    // Colour based on mood (warm = high mood, cool/muted = low mood)
    float t = clamp(vMood/10.0, 0.0, 1.0);
    float heightNorm = clamp(vHeight/max(uMaxHeight,0.1), 0.0, 1.0);

    vec3 colBase = vec3(0.98,0.97,0.95);
    vec3 colLow  = vec3(0.86,0.72,0.68);
    vec3 colMid  = vec3(0.94,0.58,0.38);
    vec3 colHigh = vec3(0.99,0.82,0.55);

    vec3 moodColor;
    if (t < 0.45) moodColor = mix(colLow, colMid, t/0.45);
    else          moodColor = mix(colMid, colHigh, (t-0.45)/0.55);
    vec3 baseColor = mix(colBase, moodColor, smoothstep(0.0,0.5,heightNorm));

    // ── Animated contour lines ────────────────────────────────────────────
    float flow = uTime*0.045;
    float c1 = contour(vHeight+flow,       0.32, 0.012);
    float c2 = contour(vHeight+flow*0.55,  0.65, 0.008);
    float c3 = contour(vHeight-flow*0.28,  1.05, 0.005);
    float cMask = max(c1*0.42, max(c2*0.26, c3*0.16));
    baseColor = mix(baseColor, vec3(0.72,0.24,0.06), cMask*(0.25+heightNorm*0.38));

    // ── Ridge glow on peaks ───────────────────────────────────────────────
    float ridgeGlow = pow(heightNorm, 2.5) * 0.28;
    baseColor = mix(baseColor, vec3(1.0,0.88,0.62), ridgeGlow);

    // ── Diffuse lighting ──────────────────────────────────────────────────
    vec3 L = normalize(vec3(0.5,1.0,0.6));
    float diff = max(dot(vNormal,L),0.0)*0.52+0.48;
    baseColor *= diff;

    // ── Specular ──────────────────────────────────────────────────────────
    vec3 V = normalize(cameraPosition-vWorldPos);
    vec3 H = normalize(L+V);
    float spec = pow(max(dot(vNormal,H),0.0),52.0)*heightNorm*0.16;
    baseColor += vec3(1.0,0.9,0.8)*spec;

    // ── Valley AO ─────────────────────────────────────────────────────────
    float ao = mix(0.84,1.0,heightNorm);
    baseColor *= ao;

    gl_FragColor = vec4(baseColor, 0.97);
  }
`

export default function EmotionalTerrain({ calls = SAMPLE_CALLS, liveMode = false }: EmotionalTerrainProps) {
  const mountRef       = useRef<HTMLDivElement>(null)
  const rendererRef    = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef       = useRef<THREE.Scene | null>(null)
  const cameraRef      = useRef<THREE.PerspectiveCamera | null>(null)
  const terrainRef     = useRef<THREE.Mesh | null>(null)
  const wireRef        = useRef<THREE.Mesh | null>(null)
  const markersRef     = useRef<THREE.Mesh[]>([])
  const stemsRef       = useRef<THREE.Line[]>([])
  const ringsRef       = useRef<THREE.Mesh[]>([])
  const frameRef       = useRef<number>(0)
  const tooltipRef     = useRef<HTMLDivElement>(null)
  const callsRef       = useRef<CallData[]>(calls)
  const autoRotRef     = useRef(true)
  const shaderRef      = useRef<THREE.ShaderMaterial | null>(null)
  const particleMatRef = useRef<THREE.ShaderMaterial | null>(null)
  const clockRef       = useRef(new THREE.Clock())

  useEffect(() => { callsRef.current = calls }, [calls])

  const STEP = 1.6

  const buildTerrain = useCallback((scene: THREE.Scene) => {
    if (terrainRef.current) { scene.remove(terrainRef.current); terrainRef.current.geometry.dispose(); (terrainRef.current.material as THREE.Material).dispose() }
    if (wireRef.current)    { scene.remove(wireRef.current);    wireRef.current.geometry.dispose();    (wireRef.current.material as THREE.Material).dispose() }

    const data   = callsRef.current
    const cols   = data.length
    const totalW = (cols - 1) * STEP
    const DEPTH  = 14.0
    const segX   = (cols - 1) * 4
    const segZ   = 44

    const geo = new THREE.PlaneGeometry(totalW, DEPTH, segX, segZ)
    geo.rotateX(-Math.PI / 2)

    const pos    = geo.attributes.position as THREE.BufferAttribute
    const vCount = pos.count
    const aOrigY   = new Float32Array(vCount)
    const aMoodArr = new Float32Array(vCount)
    const aVolArr  = new Float32Array(vCount)
    let maxH = 0

    for (let vi = 0; vi < vCount; vi++) {
      const col   = vi % (segX + 1)
      const row   = Math.floor(vi / (segX + 1))
      const frac  = cols > 1 ? col / segX : 0
      const callF = frac * (cols - 1)
      const ci0   = Math.min(Math.floor(callF), cols - 1)
      const ci1   = Math.min(ci0 + 1, cols - 1)
      const blend = callF - ci0
      const c0    = data[ci0]
      const c1    = data[ci1]

      const mood = c0.mood + (c1.mood - c0.mood) * blend
      const vol  = c0.volatility + (c1.volatility - c0.volatility) * blend

      // ── Y axis = volatility (0–1.5 → height 0–6) ─────────────────────
      // High volatility = tall, jagged ridge. Low volatility = flat, calm.
      const volHeight = (vol / 1.5) * 6.0

      // ── Z axis = mood (gaussian ridge width driven by mood) ───────────
      // High mood = wide broad ridge. Low mood = narrow, pinched ridge.
      const zNorm    = (row / segZ) * 2 - 1
      // Gaussian sharpness: low mood → sharp narrow spike (high k), high mood → wide gentle hill (low k)
      const moodNorm = Math.max(0, Math.min(1, (mood - 1) / 9))
      const k        = 3.5 - moodNorm * 2.2   // k ranges 3.5 (low mood, narrow) → 1.3 (high mood, wide)
      const ridge    = Math.exp(-zNorm * zNorm * k)

      const noise  = (Math.sin(callF * 2.1 + row * 1.7) * 0.4 + Math.cos(callF * 1.3 - row * 2.3) * 0.4) * vol * 0.5
      const height = volHeight * ridge + noise

      pos.setY(vi, height)
      aOrigY[vi]   = height
      aMoodArr[vi] = mood
      aVolArr[vi]  = vol
      if (height > maxH) maxH = height
    }

    geo.setAttribute('aOrigY', new THREE.BufferAttribute(aOrigY, 1))
    geo.setAttribute('aMood',  new THREE.BufferAttribute(aMoodArr, 1))
    geo.setAttribute('aVol',   new THREE.BufferAttribute(aVolArr, 1))
    geo.computeVertexNormals()

    const mat = new THREE.ShaderMaterial({
      vertexShader, fragmentShader,
      uniforms: { uTime: { value: 0 }, uMaxHeight: { value: maxH } },
      side: THREE.DoubleSide, transparent: true,
    })
    shaderRef.current = mat

    const terrain = new THREE.Mesh(geo, mat)
    terrain.receiveShadow = true
    terrain.castShadow    = true
    terrain.position.x    = 0
    scene.add(terrain)
    terrainRef.current = terrain

    const wireGeo = new THREE.PlaneGeometry(totalW, DEPTH, cols - 1, 10)
    wireGeo.rotateX(-Math.PI / 2)
    const wire = new THREE.Mesh(wireGeo, new THREE.MeshBasicMaterial({ color: 0x1c1917, wireframe: true, transparent: true, opacity: 0.05 }))
    wire.position.copy(terrain.position)
    scene.add(wire)
    wireRef.current = wire
  }, [])

  const buildMarkers = useCallback((scene: THREE.Scene) => {
    markersRef.current.forEach(m => scene.remove(m))
    stemsRef.current.forEach(s => scene.remove(s))
    ringsRef.current.forEach(r => scene.remove(r))
    markersRef.current = []
    stemsRef.current   = []
    ringsRef.current   = []

    const data   = callsRef.current
    const cols   = data.length
    const totalW = (cols - 1) * STEP
    const startX = -totalW / 2

    data.forEach((call, i) => {
      const x = startX + i * STEP
      // Peak Y matches terrain: vol/1.5 * 6.0 at ridge center (ridge=1.0)
      const peakY = (call.volatility / 1.5) * 6.0 + 0.35
      const tc    = moodToThreeColor(call.mood)

      const marker = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.20, 0),
        new THREE.MeshPhongMaterial({ color: tc, emissive: tc, emissiveIntensity: 0.35, shininess: 90, transparent: true, opacity: 0.92 })
      )
      marker.position.set(x, peakY + 0.5, 0)
      marker.castShadow = true
      marker.userData   = {
        callId: call.id, mood: call.mood, volatility: call.volatility,
        label: call.label, date: call.date, memory: call.memory,
        baseY: peakY + 0.5, color: moodToHex(call.mood),
      }
      scene.add(marker)
      markersRef.current.push(marker)

      const stem = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, peakY, 0), new THREE.Vector3(x, peakY + 0.45, 0)]),
        new THREE.LineBasicMaterial({ color: tc, transparent: true, opacity: 0.4 })
      )
      scene.add(stem)
      stemsRef.current.push(stem)

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.28, 0.34, 16),
        new THREE.MeshBasicMaterial({ color: tc, side: THREE.DoubleSide, transparent: true, opacity: 0.15 })
      )
      ring.position.set(x, peakY + 0.5, 0)
      ring.rotation.x = Math.PI / 2
      scene.add(ring)
      ringsRef.current.push(ring)
    })
  }, [])

  const rebuildAll = useCallback(() => {
    const scene = sceneRef.current
    if (!scene) return
    buildTerrain(scene)
    buildMarkers(scene)
  }, [buildTerrain, buildMarkers])

  const addLiveCall = useCallback((newCall: CallData) => {
    callsRef.current = [...callsRef.current, newCall]
    rebuildAll()
  }, [rebuildAll])

  useEffect(() => {
    (window as any).__therapistRL_addCall = addLiveCall
    return () => { delete (window as any).__therapistRL_addCall }
  }, [addLiveCall])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return
    const W = container.clientWidth
    const H = container.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xfafaf5)
    scene.fog        = new THREE.Fog(0xfafaf5, 30, 58)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 120)
    camera.position.set(0, 14, 24)
    camera.lookAt(0, 2, 0)
    cameraRef.current = camera

    scene.add(new THREE.AmbientLight(0xfff8f0, 2.4))
    const sun = new THREE.DirectionalLight(0xfff0e0, 1.5)
    sun.position.set(8, 20, 12); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024)
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0xfce8d8, 0.5)
    fill.position.set(-10, 6, -8); scene.add(fill)
    const bounce = new THREE.PointLight(0xea580c, 0.18, 40)
    bounce.position.set(0, 6, 0); scene.add(bounce)

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ opacity: 0.03 }))
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.5; ground.receiveShadow = true
    scene.add(ground)

    buildTerrain(scene)

    // ── Ground grid — dark black lines ────────────────────────────────────
    const gridCount = 36
    const gridGeo   = new THREE.PlaneGeometry(60, 60, gridCount, gridCount)
    gridGeo.rotateX(-Math.PI / 2)
    const gridMat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: { uOpacity: { value: 1.0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uOpacity;
        void main() {
          vec2 g = abs(fract(vUv * ${gridCount}.0) - 0.5);
          float line = max(
            1.0 - smoothstep(0.0, 0.016, g.x),
            1.0 - smoothstep(0.0, 0.016, g.y)
          );
          if (line < 0.05) discard;
          float edgeFade = smoothstep(0.0, 0.1, min(vUv.x, min(1.0-vUv.x, min(vUv.y, 1.0-vUv.y))));
          // Dark near-black lines at higher opacity
          gl_FragColor = vec4(0.02, 0.01, 0.01, line * 0.45 * edgeFade * uOpacity);
        }
      `,
    })
    const gridPlane = new THREE.Mesh(gridGeo, gridMat)
    gridPlane.position.y = -0.48
    scene.add(gridPlane)

    // ── Particles — black, drifting ───────────────────────────────────────
    const particleCount = 320
    const pPositions    = new Float32Array(particleCount * 3)
    const pSizes        = new Float32Array(particleCount)
    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3]     = (Math.random() - 0.5) * 50
      pPositions[i * 3 + 1] = Math.random() * 18 + 1
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 40
      pSizes[i]             = Math.random() * 0.5 + 0.15
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3))
    pGeo.setAttribute('size',     new THREE.BufferAttribute(pSizes, 1))
    const pMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite:  false,
      uniforms:    { uTime: { value: 0 } },
      vertexShader: `
        attribute float size;
        uniform float uTime;
        varying float vAlpha;
        void main() {
          vec3 pos = position;
          pos.y += sin(uTime * 0.4 + position.x * 0.3 + position.z * 0.2) * 0.35;
          pos.x += cos(uTime * 0.25 + position.z * 0.4) * 0.15;
          vAlpha = 0.3 + sin(uTime * 0.6 + position.y * 0.8) * 0.15;
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (280.0 / -mvPos.z);
          gl_Position  = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          vec2  uv   = gl_PointCoord - 0.5;
          float dist = length(uv);
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;
          // Near-black particles
          gl_FragColor = vec4(0.04, 0.02, 0.02, alpha * 0.7);
        }
      `,
    })
    particleMatRef.current = pMat   // store so animate loop can update uTime
    scene.add(new THREE.Points(pGeo, pMat))

    buildMarkers(scene)

    // ── Orbit ─────────────────────────────────────────────────────────────
    let isDragging = false
    let prevMouse  = { x: 0, y: 0 }
    const spherical = { theta: 0.15, phi: 1.0, radius: 28 }

    function updateCamera() {
      camera.position.set(
        spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta),
        spherical.radius * Math.cos(spherical.phi),
        spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)
      )
      camera.lookAt(0, 2, 0)
    }

    const onMouseDown = (e: MouseEvent) => { isDragging = true; autoRotRef.current = false; prevMouse = { x: e.clientX, y: e.clientY }; container.style.cursor = 'grabbing' }
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      spherical.theta -= (e.clientX - prevMouse.x) * 0.005
      spherical.phi    = Math.max(0.28, Math.min(Math.PI / 2.1, spherical.phi + (e.clientY - prevMouse.y) * 0.004))
      prevMouse = { x: e.clientX, y: e.clientY }
      updateCamera()
    }
    const onMouseUp = () => { isDragging = false; container.style.cursor = 'grab' }
    const onWheel   = (e: WheelEvent) => { spherical.radius = Math.max(10, Math.min(52, spherical.radius + e.deltaY * 0.022)); updateCamera() }

    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    container.addEventListener('wheel', onWheel)

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
    container.addEventListener('mousemove', onContainerMouseMove)
    container.addEventListener('mouseleave', hideTooltip)

    const ro = new ResizeObserver(() => {
      const nW = container.clientWidth; const nH = container.clientHeight
      renderer.setSize(nW, nH); camera.aspect = nW / nH; camera.updateProjectionMatrix()
    })
    ro.observe(container)

    function animate() {
      frameRef.current = requestAnimationFrame(animate)
      const t = clockRef.current.getElapsedTime()
      if (autoRotRef.current) { spherical.theta += 0.0015; updateCamera() }
      if (shaderRef.current)      shaderRef.current.uniforms.uTime.value      = t
      if (particleMatRef.current) particleMatRef.current.uniforms.uTime.value = t  // fixed
      markersRef.current.forEach((m, i) => {
        m.position.y  = (m.userData.baseY as number) + Math.sin(t * 1.1 + i * 0.8) * 0.12
        m.rotation.y += 0.008
      })
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameRef.current)
      ro.disconnect()
      container.removeEventListener('mousedown', onMouseDown)
      container.removeEventListener('mousemove', onContainerMouseMove)
      container.removeEventListener('mouseleave', hideTooltip)
      container.removeEventListener('wheel', onWheel)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      renderer.dispose()
      if (renderer.domElement.parentNode) renderer.domElement.remove()
      sceneRef.current = null; rendererRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function showTooltip(data: Record<string, any>, x: number, y: number) {
    const el = tooltipRef.current
    if (!el) return
    el.style.display = 'block'
    el.style.left    = `${Math.min(x + 16, window.innerWidth - 280)}px`
    el.style.top     = `${Math.max(y - 90, 8)}px`
    ;(el.querySelector('.tt-dot')    as HTMLElement).style.background = data.color
    ;(el.querySelector('.tt-date')   as HTMLElement).textContent = formatDate(data.date)
    ;(el.querySelector('.tt-label')  as HTMLElement).textContent = data.label ?? `Session ${data.callId}`
    ;(el.querySelector('.tt-memory') as HTMLElement).textContent = data.memory ?? ''
    ;(el.querySelector('.tt-memory') as HTMLElement).style.display = data.memory ? 'block' : 'none'
    ;(el.querySelector('.tt-mood')   as HTMLElement).textContent = `Mood ${(data.mood as number)?.toFixed(1)} / 10`
    ;(el.querySelector('.tt-vol')    as HTMLElement).textContent = `Volatility ${(data.volatility as number)?.toFixed(2)}`
  }

  function hideTooltip() {
    if (tooltipRef.current) tooltipRef.current.style.display = 'none'
  }

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%', minHeight: 520,
      background: '#fafaf5', borderRadius: 16, overflow: 'hidden',
      fontFamily: '"DM Mono", "Fira Code", "Courier New", monospace',
      boxShadow: '0 1px 3px rgba(28,25,23,0.06), 0 8px 32px rgba(28,25,23,0.04)',
    }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      <div style={{ position: 'absolute', top: 22, left: 26, pointerEvents: 'none' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.18em', color: '#c2410c', textTransform: 'uppercase', marginBottom: 5 }}>Emotional Terrain</div>
        <div style={{ fontSize: 21, fontWeight: 600, color: '#1c1917', letterSpacing: '-0.02em', lineHeight: 1 }}>
          {calls.length} {calls.length === 1 ? 'session' : 'sessions'}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(28,25,23,0.35)', marginTop: 4, letterSpacing: '0.06em' }}>
          X · time &nbsp;·&nbsp; Y · volatility &nbsp;·&nbsp; Z · mood
        </div>
      </div>

      <div style={{ position: 'absolute', top: 22, right: 22, pointerEvents: 'none' }}>
        <div style={{ fontSize: 9, color: 'rgba(28,25,23,0.4)', letterSpacing: '0.14em', marginBottom: 7, textAlign: 'right' }}>MOOD</div>
        <div style={{ width: 10, height: 72, borderRadius: 5, marginLeft: 'auto', background: 'linear-gradient(to top, rgb(180,100,90), rgb(194,65,12), rgb(234,88,12), rgb(251,191,36))', opacity: 0.75 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 9, color: 'rgba(28,25,23,0.35)' }}>
          <span>low</span><span style={{ marginLeft: 6 }}>high</span>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 18, left: 26, pointerEvents: 'none' }}>
        <span style={{ fontSize: 9, color: 'rgba(28,25,23,0.2)', letterSpacing: '0.1em' }}>DRAG · ORBIT &nbsp;·&nbsp; SCROLL · ZOOM &nbsp;·&nbsp; HOVER · INSPECT</span>
      </div>

      {liveMode && (
        <div style={{ position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ea580c', animation: 'trlPulse 1.4s ease-in-out infinite' }} />
          <span style={{ fontSize: 9, color: '#ea580c', letterSpacing: '0.16em' }}>LIVE</span>
        </div>
      )}

      <div ref={tooltipRef} style={{
        display: 'none', position: 'absolute',
        background: 'rgba(250,250,245,0.98)',
        border: '1px solid rgba(194,65,12,0.18)',
        borderRadius: 10, padding: '12px 15px',
        pointerEvents: 'none', minWidth: 200, maxWidth: 270,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(28,25,23,0.10)',
      }}>
        <div className="tt-date"   style={{ fontSize: 10, color: '#c2410c', letterSpacing: '0.1em', marginBottom: 7, textTransform: 'uppercase' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          <div className="tt-dot"  style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 3 }} />
          <span className="tt-label" style={{ fontSize: 12, color: '#1c1917', lineHeight: 1.5, fontWeight: 500 }} />
        </div>
        <div className="tt-memory" style={{ fontSize: 11, color: 'rgba(28,25,23,0.6)', lineHeight: 1.6, marginBottom: 9, fontStyle: 'italic', borderLeft: '2px solid rgba(194,65,12,0.25)', paddingLeft: 8 }} />
        <div style={{ display: 'flex', gap: 12, borderTop: '1px solid rgba(28,25,23,0.07)', paddingTop: 8 }}>
          <span className="tt-mood" style={{ fontSize: 10, color: 'rgba(28,25,23,0.45)', letterSpacing: '0.05em' }} />
          <span className="tt-vol"  style={{ fontSize: 10, color: 'rgba(28,25,23,0.3)',  letterSpacing: '0.05em' }} />
        </div>
      </div>

      <style>{`
        @keyframes trlPulse {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:0.35;transform:scale(1.5)}
        }
      `}</style>
    </div>
  )
}

export function useSupabaseLiveTerrain(supabase: any, userId: string | undefined) {
  useEffect(() => {
    if (!supabase || !userId) return
    const channel = supabase
      .channel('live-terrain-' + userId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calls', filter: `user_id=eq.${userId}` }, (payload: any) => {
        const row = payload.new
        const call: CallData = {
          id: row.id, mood: row.mood_score ?? 5, volatility: row.sentiment_variance ?? 0.5,
          technique: 'reflective', label: row.session_label ?? `Session ${row.id}`,
          date: row.scheduled_at ?? row.created_at, memory: undefined,
        }
        ;(window as any).__therapistRL_addCall?.(call)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, userId])
}