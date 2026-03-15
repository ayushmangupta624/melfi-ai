"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const T = {
  text: '#1C1917', accent: '#C2410C',
  muted: 'rgba(28,25,23,0.45)', border: 'rgba(28,25,23,0.08)',
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(28,25,23,0.04)',
  border: '1px solid rgba(28,25,23,0.12)',
  borderRadius: 8, padding: '12px 14px',
  fontSize: 14, color: T.text,
  fontFamily: 'inherit', outline: 'none',
  transition: 'border-color 0.15s, background 0.15s',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: T.muted,
  letterSpacing: '0.1em', marginBottom: 6, fontWeight: 600,
  textTransform: 'uppercase',
}
const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = '#C2410C'
  e.currentTarget.style.background  = 'rgba(194,65,12,0.04)'
}
const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = 'rgba(28,25,23,0.12)'
  e.currentTarget.style.background  = 'rgba(28,25,23,0.04)'
}

export function UpdatePasswordForm() {
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [error,       setError]       = useState<string | null>(null);
  const [isLoading,   setIsLoading]   = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    const supabase = createClient();
    setIsLoading(true); setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/protected");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
      <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(194,65,12,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 20, padding: '40px 40px 36px', boxShadow: '0 4px 32px rgba(28,25,23,0.06)', position: 'relative', overflow: 'hidden' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text, letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.2 }}>
          Set new password
        </h1>
        <p style={{ fontSize: 13, color: T.muted, margin: '0 0 32px', lineHeight: 1.6 }}>
          Choose a strong password for your account.
        </p>

        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={labelStyle}>New password</label>
            <input style={inputStyle} type="password" placeholder="New password" required
              value={password} onChange={e => setPassword(e.target.value)}
              onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <label style={labelStyle}>Confirm password</label>
            <input style={inputStyle} type="password" placeholder="Confirm password" required
              value={confirm} onChange={e => setConfirm(e.target.value)}
              onFocus={onFocus} onBlur={onBlur} />
          </div>

          {error && <p style={{ margin: 0, fontSize: 13, color: '#ef4444' }}>{error}</p>}

          <button type="submit" disabled={isLoading} style={{
            width: '100%', padding: '13px 20px', borderRadius: 8, border: 'none',
            background: isLoading ? 'rgba(194,65,12,0.12)' : '#EA580C',
            color: isLoading ? 'rgba(194,65,12,0.45)' : '#fff',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            letterSpacing: '0.06em', cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}>
            {isLoading ? "Saving..." : "Save new password →"}
          </button>
        </form>
      </div>
    </div>
  );
}
