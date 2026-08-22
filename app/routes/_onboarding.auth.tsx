import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import React, { useState } from 'react'

export const Route = createFileRoute('/_onboarding/auth')({
  component: AuthPage,
})

function AuthPage() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<'Husband' | 'Wife' | null>(null)
  const [isTaken, setIsTaken] = useState<boolean | null>(null)
  const [showRolePicker, setShowRolePicker] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSelectRole = async (role: 'Husband' | 'Wife') => {
    setSelectedRole(role)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/auth/role-status/${role}`)
      const data = await res.json()
      setIsTaken(data.taken)
    } catch {
      setIsTaken(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const endpoint = selectedRole ? (isTaken ? '/api/auth/sign-in/email' : '/api/auth/sign-up/email') : '/api/auth/sign-in/email'
      const isNewAccount = endpoint === '/api/auth/sign-up/email'
      const bodyPayload = !selectedRole || isTaken
        ? { email, password }
        : { email, password, name: selectedRole, role: selectedRole, onboardingComplete: false }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      })

      const data = await res.json()

      if (!res.ok) {
        if (!selectedRole) {
          setShowRolePicker(true)
          setErrorMsg('No account found. Choose a role to create your account.')
        } else if (res.status === 409) {
          setErrorMsg('An account for this role already exists.')
        } else {
          setErrorMsg(data.message || 'Authentication failed.')
        }
        setLoading(false)
        return
      }

      // Only newly created accounts need the onboarding setup flow.
      window.location.href = isNewAccount ? '/onboarding' : '/home'
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '28px', color: '#D83B56' }}>
          OurCwtch ♥
        </h2>
        <p style={{ fontSize: '14px', color: '#3D1A28', marginTop: '4px', opacity: 0.8 }}>
          Enter your email and password
        </p>
      </div>

      {/* Role selection is only needed when creating a new account. */}
      {showRolePicker && (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div
          onClick={() => handleSelectRole('Husband')}
          style={{
            padding: '20px',
            borderRadius: '20px',
            background: selectedRole === 'Husband' ? 'rgba(247, 82, 112, 0.15)' : '#FFF',
            border: selectedRole === 'Husband' ? '2px solid #F75270' : '1px solid #FFCEE3',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ fontSize: '32px' }}>🤵‍♂️</div>
          <div style={{ fontWeight: 700, marginTop: '8px', color: '#3D1A28' }}>Husband</div>
        </div>

        <div
          onClick={() => handleSelectRole('Wife')}
          style={{
            padding: '20px',
            borderRadius: '20px',
            background: selectedRole === 'Wife' ? 'rgba(247, 82, 112, 0.15)' : '#FFF',
            border: selectedRole === 'Wife' ? '2px solid #F75270' : '1px solid #FFCEE3',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ fontSize: '32px' }}>👰‍♀️</div>
          <div style={{ fontWeight: 700, marginTop: '8px', color: '#3D1A28' }}>Wife</div>
        </div>
      </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '13px', color: '#F75270', fontWeight: 600, textAlign: 'center' }}>
            {selectedRole ? (isTaken ? `Logging in as ${selectedRole}` : `Creating account for ${selectedRole}`) : 'Returning user login'}
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#3D1A28' }}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@ourcwtch.app"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #FFCEE3',
                fontSize: '14px',
                marginTop: '4px',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#3D1A28' }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #FFCEE3',
                fontSize: '14px',
                marginTop: '4px',
                outline: 'none',
              }}
            />
          </div>

          {errorMsg && (
            <div style={{ color: '#D83B56', fontSize: '13px', textAlign: 'center', fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}

          <button className="lux-button" type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
            {loading ? 'Please wait...' : selectedRole && !isTaken ? 'Sign Up' : 'Log In'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <Link
              to="/auth/forgot-password"
              style={{ fontSize: '12px', color: '#F75270', textDecoration: 'underline' }}
            >
              Forgot password?
            </Link>
          </div>
      </form>
    </div>
  )
}
