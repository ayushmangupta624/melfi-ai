'use client'

import { OnboardingData } from '../page'
import { StepLabel, StepHeading, StepSub, Input, Button } from '../components'

interface Props {
  data: OnboardingData
  update: (fields: Partial<OnboardingData>) => void
  onNext: () => void
}

export default function StepName({ data, update, onNext }: Props) {
  const valid = data.fname.trim().length > 0 && data.lname.trim().length > 0

  function handleNext() {
    if (!valid) return
    onNext()
  }

  return (
    <div>
      <StepLabel>Step 1 of 4</StepLabel>
      <StepHeading>What should we call you?</StepHeading>
      <StepSub>Your name helps the AI address you naturally during calls.</StepSub>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input
          label="FIRST NAME"
          value={data.fname}
          onChange={e => update({ fname: e.target.value })}
          placeholder="Ada"
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && valid) handleNext() }}
        />
        <Input
          label="LAST NAME"
          value={data.lname}
          onChange={e => update({ lname: e.target.value })}
          placeholder="Lovelace"
          onKeyDown={e => { if (e.key === 'Enter' && valid) handleNext() }}
        />
      </div>

      <Button onClick={handleNext} disabled={!valid}>
        Continue →
      </Button>
    </div>
  )
}