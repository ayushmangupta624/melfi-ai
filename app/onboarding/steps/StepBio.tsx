'use client'

import { OnboardingData } from '../page'
import { StepHeading, StepSub, Textarea, Button, BackButton } from '../components'

interface Props {
  data: OnboardingData
  update: (fields: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
  saving: boolean
}

const PROMPTS = [
  "I've been feeling overwhelmed at work lately",
  "I'm going through a major life transition",
  "I struggle with anxiety in social situations",
  "I want to build better habits and routines",
  "I've been having trouble sleeping",
]

export default function StepBio({ data, update, onNext, onBack, saving }: Props) {
  return (
    <div>
      <BackButton onClick={onBack} />
<StepHeading>Give the AI a head start</StepHeading>
      <StepSub>
        Optional. A sentence or two about what's on your mind helps the AI
        skip the small talk and get to what matters.
      </StepSub>

      <Textarea
        label="WHAT'S BEEN ON YOUR MIND?"
        value={data.bio}
        onChange={v => update({ bio: v })}
        placeholder="e.g. I've been stressed about a career change and not sleeping well..."
        rows={4}
        hint="This is only shared with your AI therapist."
      />

      {/* Prompt suggestions */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 10, color: '#1e3050', letterSpacing: '0.1em', margin: '0 0 10px' }}>
          NEED A PROMPT?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PROMPTS.map(p => (
            <button
              key={p}
              onClick={() => update({ bio: p })}
              style={{
                background: 'none',
                border: '1px solid #0a1525',
                borderRadius: 6,
                padding: '8px 12px',
                textAlign: 'left',
                fontSize: 12,
                color: '#1e3050',
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#1e3a5f'
                e.currentTarget.style.color = '#4a6080'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#0a1525'
                e.currentTarget.style.color = '#1e3050'
              }}
            >
              "{p}"
            </button>
          ))}
        </div>
      </div>

      <Button onClick={onNext} loading={saving}>
        {saving ? 'Saving...' : 'Finish setup →'}
      </Button>

      {!saving && (
        <button
          onClick={onNext}
          style={{
            width: '100%',
            marginTop: 10,
            background: 'none',
            border: 'none',
            color: '#1e3050',
            fontSize: 11,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: '8px 0',
          }}
        >
          Skip for now
        </button>
      )}
    </div>
  )
}