'use client'

import { OnboardingData } from '../page'
import { StepLabel, StepHeading, StepSub, Button, BackButton } from '../components'

interface Props {
  data: OnboardingData
  update: (fields: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

const TIME_SLOTS = [
  { value: '07:00', label: '7:00 AM', desc: 'Morning ritual' },
  { value: '08:00', label: '8:00 AM', desc: 'Before work' },
  { value: '09:00', label: '9:00 AM', desc: 'Mid morning' },
  { value: '12:00', label: '12:00 PM', desc: 'Lunch break' },
  { value: '17:00', label: '5:00 PM', desc: 'End of day' },
  { value: '19:00', label: '7:00 PM', desc: 'Evening wind-down' },
  { value: '21:00', label: '9:00 PM', desc: 'Before bed' },
]

// Common timezones grouped
const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Pacific/Auckland',
]

function tzLabel(tz: string) {
  try {
    const now = new Date()
    const offset = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'short' })
      .formatToParts(now)
      .find(p => p.type === 'timeZoneName')?.value ?? ''
    return `${tz.replace('_', ' ')} (${offset})`
  } catch {
    return tz
  }
}

export default function StepTime({ data, update, onNext, onBack }: Props) {
  return (
    <div>
      <BackButton onClick={onBack} />
      <StepLabel>Step 3 of 4</StepLabel>
      <StepHeading>When should we call?</StepHeading>
      <StepSub>Pick a time you'll consistently be free to talk for 3–5 minutes.</StepSub>

      {/* Time slot picker */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, color: '#4a6080', letterSpacing: '0.1em', margin: '0 0 10px' }}>
          PREFERRED TIME
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {TIME_SLOTS.map(slot => {
            const selected = data.call_time_pref === slot.value
            return (
              <button
                key={slot.value}
                onClick={() => update({ call_time_pref: slot.value })}
                style={{
                  background:   selected ? 'rgba(245,158,11,0.08)' : '#060b14',
                  border:       `1px solid ${selected ? '#f59e0b' : '#0d1e35'}`,
                  borderRadius: 8,
                  padding:      '10px 14px',
                  textAlign:    'left',
                  cursor:       'pointer',
                  transition:   'all 0.15s',
                }}
              >
                <div style={{ fontSize: 13, color: selected ? '#f59e0b' : '#dce8f5', fontFamily: 'inherit', fontWeight: 500 }}>
                  {slot.label}
                </div>
                <div style={{ fontSize: 10, color: selected ? '#a06010' : '#1e3050', fontFamily: 'inherit', marginTop: 2 }}>
                  {slot.desc}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Timezone */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ display: 'block', fontSize: 11, color: '#4a6080', letterSpacing: '0.1em', marginBottom: 6 }}>
          TIMEZONE
        </label>
        <select
          value={data.timezone}
          onChange={e => update({ timezone: e.target.value })}
          style={{
            width: '100%',
            background: '#060b14',
            border: '1px solid #0d1e35',
            borderRadius: 8,
            padding: '12px 14px',
            fontSize: 13,
            color: '#dce8f5',
            fontFamily: 'inherit',
            outline: 'none',
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%232d4a6a' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 14px center',
          }}
        >
          {TIMEZONES.map(tz => (
            <option key={tz} value={tz} style={{ background: '#060b14' }}>
              {tzLabel(tz)}
            </option>
          ))}
        </select>
        <p style={{ fontSize: 11, color: '#1e3050', margin: '6px 0 0' }}>
          Auto-detected · you can change this anytime
        </p>
      </div>

      <Button onClick={onNext}>
        Continue →
      </Button>
    </div>
  )
}