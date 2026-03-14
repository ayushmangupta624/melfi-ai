'use client'

import { useState } from 'react'
import { OnboardingData } from '../page'
import { StepHeading, StepSub, Input, Button, BackButton } from '../components'

interface Props {
  data: OnboardingData
  update: (fields: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

// Formats to E.164: +14165550123
function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`
  if (digits.length === 10) return `+1${digits}`
  if (digits.length > 10)   return `+${digits}`
  return raw
}

function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

// Display formatter: (416) 555-0123
function formatDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 3)  return `(${digits}`
  if (digits.length <= 6)  return `(${digits.slice(0,3)}) ${digits.slice(3)}`
  if (digits.length <= 10) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
  return `+1 (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`
}

export default function StepPhone({ data, update, onNext, onBack }: Props) {
  const [display, setDisplay] = useState('')
  const valid = isValidPhone(data.phone)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    const formatted = formatDisplay(raw)
    setDisplay(formatted)
    update({ phone: toE164(raw) })
  }

  return (
    <div>
      <BackButton onClick={onBack} />
<StepHeading>Your phone number</StepHeading>
      <StepSub>
        The AI will call this number daily. Standard call rates apply.
        Must be a number verified in your country.
      </StepSub>

      <Input
        label="PHONE NUMBER"
        value={display}
        onChange={handleChange}
        placeholder="(416) 555-0123"
        type="tel"
        inputMode="tel"
        autoFocus
        hint={valid ? `Will dial: ${data.phone}` : undefined}
        onKeyDown={e => { if (e.key === 'Enter' && valid) onNext() }}
      />

      {/* Trust signal */}
      <div style={{
        background: 'rgba(28,25,23,0.04)',
        border: '1px solid rgba(28,25,23,0.08)',
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 24,
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 16, lineHeight: 1 }}>🔒</span>
        <p style={{ fontSize: 11, color: 'rgba(28,25,23,0.4)', margin: 0, lineHeight: 1.6 }}>
          Your number is only used for daily check-in calls. It is never shared or used for marketing.
        </p>
      </div>

      <Button onClick={onNext} disabled={!valid}>
        Continue →
      </Button>
    </div>
  )
}