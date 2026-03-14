import { CSSProperties, InputHTMLAttributes, ReactNode } from 'react'

// ── Label ─────────────────────────────────────────────────────────────────────

export function StepLabel({ children }: { children: ReactNode }) {
  return (
    <p style={{
      fontSize: 10,
      letterSpacing: '0.18em',
      color: '#f59e0b',
      textTransform: 'uppercase',
      marginBottom: 12,
      margin: '0 0 12px',
    }}>
      {children}
    </p>
  )
}

// ── Heading ───────────────────────────────────────────────────────────────────

export function StepHeading({ children }: { children: ReactNode }) {
  return (
    <h1 style={{
      fontSize: 26,
      fontWeight: 500,
      color: '#dce8f5',
      letterSpacing: '-0.03em',
      margin: '0 0 8px',
      lineHeight: 1.2,
    }}>
      {children}
    </h1>
  )
}

// ── Subheading ────────────────────────────────────────────────────────────────

export function StepSub({ children }: { children: ReactNode }) {
  return (
    <p style={{
      fontSize: 13,
      color: '#2d4a6a',
      margin: '0 0 32px',
      lineHeight: 1.6,
    }}>
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
      <label style={{ display: 'block', fontSize: 11, color: '#4a6080', letterSpacing: '0.1em', marginBottom: 6 }}>
        {label}
      </label>
      <input
        {...props}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: '#060b14',
          border: '1px solid #0d1e35',
          borderRadius: 8,
          padding: '12px 14px',
          fontSize: 14,
          color: '#dce8f5',
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'border-color 0.15s',
          ...style,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#1e3a5f' }}
        onBlur={e  => { e.currentTarget.style.borderColor = '#0d1e35' }}
      />
      {hint && (
        <p style={{ fontSize: 11, color: '#1e3050', margin: '6px 0 0' }}>{hint}</p>
      )}
    </div>
  )
}

// ── Textarea ──────────────────────────────────────────────────────────────────

interface TextareaProps {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}

export function Textarea({ label, hint, value, onChange, placeholder, rows = 4 }: TextareaProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 11, color: '#4a6080', letterSpacing: '0.1em', marginBottom: 6 }}>
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: '#060b14',
          border: '1px solid #0d1e35',
          borderRadius: 8,
          padding: '12px 14px',
          fontSize: 14,
          color: '#dce8f5',
          fontFamily: 'inherit',
          outline: 'none',
          resize: 'vertical',
          transition: 'border-color 0.15s',
          lineHeight: 1.6,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#1e3a5f' }}
        onBlur={e  => { e.currentTarget.style.borderColor = '#0d1e35' }}
        placeholder-style={{ color: '#1e3050' }}
      />
      {hint && (
        <p style={{ fontSize: 11, color: '#1e3050', margin: '6px 0 0' }}>{hint}</p>
      )}
    </div>
  )
}

// ── Button ────────────────────────────────────────────────────────────────────

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'ghost'
  style?: CSSProperties
}

export function Button({ children, onClick, disabled, loading, variant = 'primary', style }: ButtonProps) {
  const isPrimary = variant === 'primary'
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%',
        padding: '13px 20px',
        background:   isPrimary ? (disabled || loading ? '#0d1e35' : '#f59e0b') : 'transparent',
        border:       isPrimary ? 'none' : '1px solid #0d1e35',
        borderRadius: 8,
        color:        isPrimary ? (disabled || loading ? '#1e3050' : '#060b14') : '#2d4a6a',
        fontSize:     13,
        fontWeight:   600,
        fontFamily:   'inherit',
        letterSpacing: '0.06em',
        cursor:       disabled || loading ? 'not-allowed' : 'pointer',
        transition:   'all 0.15s',
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
        background: 'none',
        border: 'none',
        color: '#1e3050',
        fontSize: 11,
        letterSpacing: '0.12em',
        cursor: 'pointer',
        fontFamily: 'inherit',
        padding: 0,
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      ← BACK
    </button>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────

export function Divider() {
  return <div style={{ height: 1, background: '#0a1525', margin: '24px 0' }} />
}