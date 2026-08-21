import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import React, { useState, useRef } from 'react'

export const Route = createFileRoute('/_onboarding/auth/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [isShaking, setIsShaking] = useState(false)
  const [loading, setLoading] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setInfoMsg(data.message || 'Verification code sent to your email.')
      setStep(2)
    } catch {
      setErrorMsg('Failed to send code.')
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP 6-box input
  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const updated = [...otpDigits]
    updated[index] = val.slice(-1)
    setOtpDigits(updated)

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const otp = otpDigits.join('')
    if (otp.length < 6) return
    setLoading(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()

      if (!res.ok) {
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 400)
        setErrorMsg(data.error || 'Invalid code.')
        return
      }

      setResetToken(data.resetToken)
      setStep(3)
    } catch {
      setErrorMsg('Verification failed.')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }
    setLoading(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Password reset failed.')
        return
      }

      setInfoMsg('Password updated! Redirecting to login...')
      setTimeout(() => navigate({ to: '/auth' }), 1500)
    } catch {
      setErrorMsg('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '24px', color: '#D83B56' }}>
          Reset Password
        </h3>
        <p style={{ fontSize: '13px', color: '#3D1A28', opacity: 0.8, marginTop: '4px' }}>
          {step === 1 && 'Enter your email to receive a 6-digit code'}
          {step === 2 && 'Enter the 6-digit code sent to your email'}
          {step === 3 && 'Create a new password for your account'}
        </p>
      </div>

      {infoMsg && (
        <div style={{ color: '#4A2832', background: '#FFCEE3', padding: '10px', borderRadius: '10px', fontSize: '13px', textAlign: 'center' }}>
          {infoMsg}
        </div>
      )}

      {/* Step 1 Form */}
      {step === 1 && (
        <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@ourcwtch.app"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #FFCEE3',
                marginTop: '4px',
              }}
            />
          </div>
          <button className="lux-button" type="submit" disabled={loading}>
            {loading ? 'Sending Code...' : 'Send Code'}
          </button>
        </form>
      )}

      {/* Step 2 Form */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            className={isShaking ? 'animate-shake' : ''}
            style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}
          >
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                style={{
                  width: '44px',
                  height: '52px',
                  fontSize: '22px',
                  fontWeight: 700,
                  textAlign: 'center',
                  borderRadius: '12px',
                  border: '1px solid #F75270',
                  background: '#FFF',
                }}
              />
            ))}
          </div>

          <button className="lux-button" type="submit" disabled={loading || otpDigits.join('').length < 6}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
      )}

      {/* Step 3 Form */}
      {step === 3 && (
        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #FFCEE3', marginTop: '4px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #FFCEE3', marginTop: '4px' }}
            />
          </div>
          <button className="lux-button" type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      )}

      {errorMsg && (
        <div style={{ color: '#D83B56', fontSize: '13px', textAlign: 'center', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '8px' }}>
        <Link to="/auth" style={{ fontSize: '13px', color: '#F75270', textDecoration: 'none' }}>
          ← Back to Login
        </Link>
      </div>
    </div>
  )
}
