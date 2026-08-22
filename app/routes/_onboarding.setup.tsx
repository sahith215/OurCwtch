import { createFileRoute, useNavigate } from '@tanstack/react-router'
import React, { useState } from 'react'
import { PetalBlastCanvas } from '../components/PetalBlastCanvas'
import { apiRequest, reportPersistenceError } from '../lib/persistence'

export const Route = createFileRoute('/_onboarding/setup')({
  component: OnboardingSetupPage,
})

function OnboardingSetupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)

  // Step 1: Instagram Bio & Persona
  const [tagline, setTagline] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [quirk, setQuirk] = useState('')

  // Step 2: Deep Couple Fields
  const [favSong, setFavSong] = useState('')
  const [comfortFood, setComfortFood] = useState('')
  const [loveLanguage, setLoveLanguage] = useState('Physical Touch')
  const [fallInLoveStory, setFallInLoveStory] = useState('')
  const [secretCodeWord, setSecretCodeWord] = useState('')

  // Step 3: Anniversary Date
  const [anniversaryDate, setAnniversaryDate] = useState('2026-05-26')
  const [isShaking, setIsShaking] = useState(false)

  // Step 4: Nickname
  const [partnerNickname, setPartnerNickname] = useState('')

  // Step 5: Ritual
  const [clicks, setClicks] = useState(0)
  const [heartBloomSize, setHeartBloomSize] = useState(0)
  const [isBursting, setIsBursting] = useState(false)

  // Step 1 Submit
  const handleBioSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  // Step 2 Submit
  const handleDeepFieldsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Save to profile extras server side
    try {
      await apiRequest('/api/profile-extras/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagline,
          photoUrl: photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
          quirk,
          favSong,
          comfortFood,
          loveLanguage,
          obsession: fallInLoveStory || secretCodeWord,
        }),
      })
    } catch (error) {
      reportPersistenceError(error)
    }
    setStep(3)
  }

  // Step 3: Submit Anniversary Date
  const handleDateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!anniversaryDate) return

    try {
      const res = await fetch('/api/shared-meta/anniversary_date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: anniversaryDate }),
      })

      if (!res.ok) {
        reportPersistenceError(new Error('That anniversary date could not be saved.'))
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 400)
        return
      }

      setStep(4)
    } catch {
      reportPersistenceError(new Error('That anniversary date could not be saved.'))
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 400)
    }
  }

  // Step 4: Submit Partner Nickname
  const handleNicknameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partnerNickname.trim()) return

    try {
      await apiRequest('/api/shared-meta/nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: partnerNickname.trim() }),
      })
      setStep(5)
    } catch (error) {
      reportPersistenceError(error)
      return
    }
  }

  // Step 5: Logo Click Ritual
  const handleLogoClick = () => {
    const nextClicks = clicks + 1
    setClicks(nextClicks)
    setHeartBloomSize(nextClicks * 14)

    if (nextClicks >= 7) {
      setIsBursting(true)
    }
  }

  return (
    <div className={isShaking ? 'animate-shake' : ''} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 5-Pill Progress Bar */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: '6px',
              borderRadius: '9999px',
              backgroundColor: step >= s ? '#BC4F4F' : '#FFE4EF',
              transition: 'background-color 0.3s ease',
            }}
          />
        ))}
      </div>

      {isBursting && (
        <PetalBlastCanvas
          origin="center-radiating"
          density={275}
          onThinning={async () => {
            try {
              await apiRequest('/api/user/complete-onboarding', { method: 'PATCH' })
            } catch (error) {
              reportPersistenceError(error)
              return
            }
            navigate({ to: '/home' })
          }}
        />
      )}

      {/* Step 1: Instagram Profile Bio & Picture */}
      {step === 1 && (
        <form onSubmit={handleBioSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#BC4F4F', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              STEP 1 OF 5
            </span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '26px', color: '#3D1A28', marginTop: '2px' }}>
              Create Your Profile
            </h3>
            <p style={{ fontSize: '13px', color: '#888' }}>
              How your partner will see you in your shared home
            </p>
          </div>

          <input
            type="text"
            required
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Profile Bio / Tagline (e.g. Chief Emotional Officer)"
            style={{ padding: '12px 16px', borderRadius: '14px', border: '1px solid #FFCEE3', outline: 'none' }}
          />

          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '14px 16px',
                borderRadius: '14px',
                border: '1.5px dashed #FFCEE3',
                background: photoUrl ? 'rgba(255, 206, 227, 0.15)' : '#FFF',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
            >
              {photoUrl ? (
                <>
                  <img src={photoUrl} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  <span style={{ fontSize: '13px', color: '#3D1A28', fontWeight: 600 }}>Photo selected</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '13px', color: '#888' }}>Tap to choose profile photo</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = (ev) => setPhotoUrl(ev.target?.result as string)
                  reader.readAsDataURL(file)
                }}
              />
            </label>
          </div>

          <input
            type="text"
            value={quirk}
            onChange={(e) => setQuirk(e.target.value)}
            placeholder="Your cute quirk (e.g. Steals all blankets at 3 AM)"
            style={{ padding: '12px 16px', borderRadius: '14px', border: '1px solid #FFCEE3', outline: 'none' }}
          />

          <button className="lux-button" type="submit" style={{ marginTop: '8px', padding: '14px' }}>
            Next: Deep Couple Fields →
          </button>
        </form>
      )}

      {/* Step 2: Deep Couple Fields */}
      {step === 2 && (
        <form onSubmit={handleDeepFieldsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#BC4F4F', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              STEP 2 OF 5
            </span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '26px', color: '#3D1A28', marginTop: '2px' }}>
              Deep Couple Favorites
            </h3>
            <p style={{ fontSize: '13px', color: '#888' }}>
              Tell us the little details that make your bond unique
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input
              type="text"
              required
              value={favSong}
              onChange={(e) => setFavSong(e.target.value)}
              placeholder="Favorite Song"
              style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #FFCEE3' }}
            />
            <input
              type="text"
              required
              value={comfortFood}
              onChange={(e) => setComfortFood(e.target.value)}
              placeholder="Comfort Food"
              style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #FFCEE3' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#3D1A28', marginBottom: '4px', display: 'block' }}>
              Primary Love Language
            </label>
            <select
              value={loveLanguage}
              onChange={(e) => setLoveLanguage(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #FFCEE3', width: '100%' }}
            >
              <option value="Physical Touch">Physical Touch</option>
              <option value="Words of Affirmation">Words of Affirmation</option>
              <option value="Quality Time">Quality Time</option>
              <option value="Acts of Service">Acts of Service</option>
              <option value="Receiving Gifts">Receiving Gifts</option>
            </select>
          </div>

          <input
            type="text"
            value={fallInLoveStory}
            onChange={(e) => setFallInLoveStory(e.target.value)}
            placeholder="What made you fall in love with them?"
            style={{ padding: '12px 16px', borderRadius: '14px', border: '1px solid #FFCEE3' }}
          />

          <input
            type="text"
            value={secretCodeWord}
            onChange={(e) => setSecretCodeWord(e.target.value)}
            placeholder="Our secret code word (e.g. Pumpkin Spice)"
            style={{ padding: '12px 16px', borderRadius: '14px', border: '1px solid #FFCEE3' }}
          />

          <button className="lux-button" type="submit" style={{ marginTop: '8px', padding: '14px' }}>
            Next: Anniversary Verification →
          </button>
        </form>
      )}

      {/* Step 3: Anniversary Date */}
      {step === 3 && (
        <form onSubmit={handleDateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#BC4F4F', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            STEP 3 OF 5
          </span>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '26px', color: '#BC4F4F' }}>
            When did your story begin?
          </h3>
          <p style={{ fontSize: '13px', color: '#3D1A28', opacity: 0.8 }}>
            Enter your special anniversary date
          </p>

          <input
            type="date"
            required
            value={anniversaryDate}
            onChange={(e) => setAnniversaryDate(e.target.value)}
            style={{
              padding: '14px',
              borderRadius: '16px',
              border: '1.5px solid #BC4F4F',
              fontSize: '18px',
              textAlign: 'center',
              fontFamily: 'var(--font-serif)',
              outline: 'none',
            }}
          />

          <button className="lux-button" type="submit" style={{ padding: '14px' }}>
            Continue →
          </button>
        </form>
      )}

      {/* Step 4: Partner Nickname */}
      {step === 4 && (
        <form onSubmit={handleNicknameSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#BC4F4F', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            STEP 4 OF 5
          </span>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '26px', color: '#BC4F4F' }}>
            What do you call them?
          </h3>
          <p style={{ fontSize: '13px', color: '#3D1A28', opacity: 0.8 }}>
            Your special nickname for your partner
          </p>

          <input
            type="text"
            required
            value={partnerNickname}
            onChange={(e) => setPartnerNickname(e.target.value)}
            placeholder="e.g. Boo, Jaan, My Love"
            style={{
              padding: '12px',
              borderRadius: '0',
              border: 'none',
              borderBottom: '2px solid #BC4F4F',
              background: 'transparent',
              fontSize: '26px',
              textAlign: 'center',
              fontFamily: 'var(--font-handwriting)',
              outline: 'none',
              color: '#3D1A28',
            }}
          />

          <button className="lux-button" type="submit" style={{ padding: '14px' }}>
            Continue →
          </button>
        </form>
      )}

      {/* Step 5: Silent Ritual */}
      {step === 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', textAlign: 'center', padding: '16px 0' }}>
          <p style={{ fontSize: '15px', color: '#3D1A28', fontStyle: 'italic', fontWeight: 600 }}>
            Tap the seal to enter our world
          </p>

          {/* Logo Click Target */}
          <div
            onClick={handleLogoClick}
            style={{
              width: '130px',
              height: '130px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #BC4F4F 0%, #8B2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: `0 0 ${heartBloomSize + 25}px rgba(188, 79, 79, 0.7), 0 10px 30px rgba(0,0,0,0.25)`,
              transform: `scale(${1 + clicks * 0.05})`,
              transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease',
              userSelect: 'none',
              border: '3px solid #FFF',
              overflow: 'hidden',
              padding: '4px',
            }}
          >
            <img
              src="/sm-logo.png"
              alt="S&M Monogram Logo"
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
