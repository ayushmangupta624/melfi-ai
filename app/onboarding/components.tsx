import { CSSProperties, InputHTMLAttributes, ReactNode } from 'react'

// ── Label ─────────────────────────────────────────────────────────────────────
export function StepLabel({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: 10, letterSpacing: '0.18em', color: '#C2410C', textTransform: 'uppercase', margin: '0 0 12px', fontWeight: 600 }}>
      {children}
    </p>
  )
}

// ── Heading ───────────────────────────────────────────────────────────────────
export function StepHeading({ children }: { children: ReactNode }) {
  return (
    <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1C1917', letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.2 }}>
      {children}
    </h1>
  )
}

// ── Subheading ────────────────────────────────────────────────────────────────
export function StepSub({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: 13, color: 'rgba(28,25,23,0.5)', margin: '0 0 32px', lineHeight: 1.6 }}>
      {children}
    </p>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
}

export function Input({ label, hint, style, ...props }: InputProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 11, color: 'rgba(28,25,23,0.45)', letterSpacing: '0.1em', marginBottom: 6, fontWeight: 600 }}>
        {label}
      </label>
      <input
        {...props}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'rgba(28,25,23,0.04)',
          border: '1px solid rgba(28,25,23,0.12)',
          borderRadius: 8, padding: '12px 14px',
          fontSize: 14, color: '#1C1917',
          fontFamily: 'inherit', outline: 'none',
          transition: 'border-color 0.15s, background 0.15s',
          ...style,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#C2410C'; e.currentTarget.style.background = 'rgba(194,65,12,0.04)' }}
        onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(28,25,23,0.12)'; e.currentTarget.style.background = 'rgba(28,25,23,0.04)' }}
      />
      {hint && <p style={{ fontSize: 11, color: 'rgba(28,25,23,0.35)', margin: '6px 0 0' }}>{hint}</p>}
    </div>
  )
}

// ── Textarea ──────────────────────────────────────────────────────────────────
interface TextareaProps {
  label: string; hint?: string; value: string
  onChange: (v: string) => void; placeholder?: string; rows?: number
}

export function Textarea({ label, hint, value, onChange, placeholder, rows = 4 }: TextareaProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 11, color: 'rgba(28,25,23,0.45)', letterSpacing: '0.1em', marginBottom: 6, fontWeight: 600 }}>
        {label}
      </label>
      <textarea
        rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'rgba(28,25,23,0.04)',
          border: '1px solid rgba(28,25,23,0.12)',
          borderRadius: 8, padding: '12px 14px',
          fontSize: 14, color: '#1C1917',
          fontFamily: 'inherit', outline: 'none',
          resize: 'vertical', transition: 'border-color 0.15s', lineHeight: 1.6,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#C2410C'; e.currentTarget.style.background = 'rgba(194,65,12,0.04)' }}
        onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(28,25,23,0.12)'; e.currentTarget.style.background = 'rgba(28,25,23,0.04)' }}
      />
      {hint && <p style={{ fontSize: 11, color: 'rgba(28,25,23,0.35)', margin: '6px 0 0' }}>{hint}</p>}
    </div>
  )
}

// ── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps {
  children: ReactNode; onClick?: () => void; disabled?: boolean
  loading?: boolean; variant?: 'primary' | 'ghost'; style?: CSSProperties
}

export function Button({ children, onClick, disabled, loading, variant = 'primary', style }: ButtonProps) {
  const isPrimary = variant === 'primary'
  const isDisabled = disabled || loading
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{
        width: '100%', padding: '13px 20px',
        background:   isPrimary ? (isDisabled ? 'rgba(194,65,12,0.12)' : '#EA580C') : 'transparent',
        border:       isPrimary ? (isDisabled ? '1px solid rgba(194,65,12,0.2)' : 'none') : '1px solid rgba(28,25,23,0.12)',
        borderRadius: 8,
        color:        isPrimary ? (isDisabled ? 'rgba(194,65,12,0.45)' : '#fff') : 'rgba(28,25,23,0.5)',
        fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
        letterSpacing: '0.06em',
        cursor:       isDisabled ? 'not-allowed' : 'pointer',
        transition:   'all 0.2s',
        ...style,
      }}
    >
      {loading ? 'Saving...' : children}
    </button>
  )
}

// ── Back button ───────────────────────────────────────────────────────────────
export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', color: 'rgba(28,25,23,0.4)',
        fontSize: 11, letterSpacing: '0.12em', cursor: 'pointer',
        fontFamily: 'inherit', padding: 0, marginBottom: 28,
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      ← BACK
    </button>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider() {
  return <div style={{ height: 1, background: 'rgba(28,25,23,0.08)', margin: '24px 0' }} />
}
