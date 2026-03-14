'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import StepName from './steps/StepName'
import StepPhone from './steps/StepPhone'
import StepTime from './steps/StepTime'
import StepBio from './steps/StepBio'
import StepDone from './steps/StepDone'

export type OnboardingData = {
  fname: string
  lname: string
  phone: string
  timezone: string
  call_time_pref: string // 'HH:MM'
  bio: string
}

const STEPS = ['name', 'phone', 'time', 'bio', 'done'] as const
type Step = typeof STEPS[number]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('name')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<OnboardingData>({
    fname: '',
    lname: '',
    phone: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    call_time_pref: '09:00',
    bio: '',
  })

  // Redirect if already onboarded
  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('users')
        .select('fname, phone')
        .eq('id', user.id)
        .single()

      if (profile?.fname && profile?.phone) router.push('/dashboard')
    }
    check()
  }, [])

  function update(fields: Partial<OnboardingData>) {
    setData(prev => ({ ...prev, ...fields }))
  }

  function next() {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }

  function back() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: upsertError } = await supabase.from('users').upsert({
        id:             user.id,
        email:          user.email!,
        fname:          data.fname.trim(),
        lname:          data.lname.trim(),
        phone:          data.phone.trim(),
        timezone:       data.timezone,
        call_time_pref: data.call_time_pref,
        bio:            data.bio.trim() || null,
      })

      if (upsertError) throw upsertError
      next() // → done step
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const stepIndex = STEPS.indexOf(step)
  const progress  = (stepIndex / (STEPS.length - 1)) * 100

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060b14',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"DM Mono", "Fira Code", "Courier New", monospace',
      padding: '24px 16px',
    }}>

      {/* Progress bar */}
      {step !== 'done' && (
        <div style={{ width: '100%', maxWidth: 480, marginBottom: 48 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: '#2a4060', letterSpacing: '0.15em' }}>
              SETUP
            </span>
            <span style={{ fontSize: 10, color: '#2a4060', letterSpacing: '0.15em' }}>
              {stepIndex}/{STEPS.length - 1}
            </span>
          </div>
          <div style={{ height: 1, background: '#0d1a2e', borderRadius: 1 }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #1e3a5f, #f59e0b)',
              borderRadius: 1,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}

      {/* Step card */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: '#080f1a',
        border: '1px solid #0d1e35',
        borderRadius: 16,
        padding: '40px 40px 36px',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Subtle corner glow */}
        <div style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {step === 'name'  && <StepName  data={data} update={update} onNext={next} />}
        {step === 'phone' && <StepPhone data={data} update={update} onNext={next} onBack={back} />}
        {step === 'time'  && <StepTime  data={data} update={update} onNext={next} onBack={back} />}
        {step === 'bio'   && <StepBio   data={data} update={update} onNext={save}  onBack={back} saving={saving} />}
        {step === 'done'  && <StepDone  name={data.fname} />}

        {error && (
          <p style={{ marginTop: 16, fontSize: 12, color: '#ef4444', textAlign: 'center' }}>
            {error}
          </p>
        )}
      </div>

      {/* Wordmark */}
      <div style={{ marginTop: 32, fontSize: 10, color: '#0d1e35', letterSpacing: '0.2em' }}>
        THERAPIST·RL
      </div>
    </div>
  )
}