import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SoundOfUsCard } from '../components/SoundOfUsCard'
import { HillDivider } from '../components/HillDivider'
import { PetalBlastCanvas } from '../components/PetalBlastCanvas'

export const Route = createFileRoute('/_main/home')({
  component: HomePage,
})

function HomePage() {
  const [heroImage, setHeroImage] = useState('/hero-couple.jpg')
  const [nickname, setNickname] = useState('Jaan')
  const [showGreeting, setShowGreeting] = useState(true)
  const [daysTogether, setDaysTogether] = useState(365)
  const [surpriseRevealed, setSurpriseRevealed] = useState(false)
  const [priorWish, setPriorWish] = useState<string | null>(null)
  const [wishInput, setWishInput] = useState('')
  const [wishSubmitted, setWishSubmitted] = useState(false)
  const [wishError, setWishError] = useState('')

  // Candle state
  const [candlesBlown, setCandlesBlown] = useState(false)
  const [candleHoldProgress, setCandleHoldProgress] = useState(0)

  // Royal Birthday Letter state
  const [isLetterSealed, setIsLetterSealed] = useState(true)
  const [triggerRoyalBlast, setTriggerRoyalBlast] = useState(false)

  // Daily deterministic sentence pool
  const dailySentences = [
    'wherever you are, I hope today is gentle',
    'still choosing you, on repeat',
    'you make the noise of the world turn quiet',
    'loving you is the easiest thing I do',
    'my favorite place is right next to you',
  ]

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const todaySentence = dailySentences[dayOfYear % dailySentences.length]

  useEffect(() => {
    // Hide greeting after 5s
    const timer = setTimeout(() => setShowGreeting(false), 5000)

    // Load data
    fetch('/api/home-hero').then(r => r.json()).then(d => { if (d.imageUrl) setHeroImage(d.imageUrl) }).catch(() => {})
    fetch('/api/birthday-wishes').then(r => r.json()).then(d => { if (d.wish) setPriorWish(d.wish) }).catch(() => {})
    fetch('/api/us/stats').then(r => r.json()).then(d => { if (d.daysTogether) setDaysTogether(d.daysTogether) }).catch(() => {})
    fetch('/api/auth/get-session').then(r => r.json()).then(sess => {
      const role = sess?.user?.role || 'Husband'
      fetch('/api/shared-meta/nickname').then(r => r.json()).then(d => {
        const nick = role === 'Husband' ? d.husband_nickname : d.wife_nickname
        if (nick) setNickname(nick)
      }).catch(() => {})
    }).catch(() => {})

    return () => clearTimeout(timer)
  }, [])

  const handleHeroUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      setHeroImage(base64)
      await fetch('/api/home-hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: base64 }),
      })
    }
    reader.readAsDataURL(file)
  }

  // Candle hold press
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (candleHoldProgress > 0 && candleHoldProgress < 100 && !candlesBlown) {
      interval = setInterval(() => {
        setCandleHoldProgress((prev) => {
          if (prev >= 95) {
            setCandlesBlown(true)
            clearInterval(interval)
            return 100
          }
          return prev + 5
        })
      }, 50)
    } else if (candleHoldProgress === 0) {
      setCandleHoldProgress(0)
    }
    return () => clearInterval(interval)
  }, [candleHoldProgress, candlesBlown])

  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wishInput.trim()) return
    setWishError('')

    const res = await fetch('/api/birthday-wishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: wishInput.trim() }),
    })

    if (res.status === 409) {
      setWishError('You have already made a wish this year!')
      return
    }

    if (res.ok) {
      setWishSubmitted(true)
      setWishInput('')
    }
  }

  const handleUnsealRoyalLetter = () => {
    setTriggerRoyalBlast(true)
    setIsLetterSealed(false)
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', paddingBottom: '96px' }}>
      {/* Huge Royal Flower Petals & Heart Blast Canvas */}
      {triggerRoyalBlast && (
        <PetalBlastCanvas
          origin="center-radiating"
          density={300}
          onComplete={() => setTriggerRoyalBlast(false)}
        />
      )}

      {/* 1. Hero Section Restricted Background (#FBEFE1) */}
      <section
        style={{
          width: '100%',
          height: 'calc(100vh - 72px)',
          minHeight: '620px',
          background: 'linear-gradient(135deg, #FBEFE1 0%, #F5E4D2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 1.5%',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* 97% Viewport Floating Hero Card with Curvy Borders */}
        <div
          style={{
            width: '97vw',
            maxWidth: '1520px',
            height: '95%',
            maxHeight: '860px',
            minHeight: '540px',
            position: 'relative',
            borderRadius: '40px',
            overflow: 'hidden',
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 20%',
            boxShadow: '0 20px 50px rgba(61, 26, 40, 0.12), 0 0 25px rgba(251, 239, 225, 0.6)',
            border: '1.5px solid rgba(216, 59, 86, 0.25)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(251, 239, 225, 0.05) 0%, transparent 60%, rgba(61, 26, 40, 0.35) 100%)',
              pointerEvents: 'none',
            }}
          />

          <label
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              padding: '10px 20px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(16px)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              color: '#3D1A28',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              border: '1px solid rgba(255, 206, 227, 0.8)',
              zIndex: 10,
            }}
          >
            Change Photo
            <input type="file" accept="image/*" onChange={handleHeroUpload} style={{ display: 'none' }} />
          </label>

          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            onClick={() => window.scrollTo({ top: window.innerHeight - 72, behavior: 'smooth' })}
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '10px 24px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(16px)',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#D83B56',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              border: '1px solid rgba(255, 206, 227, 0.8)',
              zIndex: 10,
            }}
          >
            ↓
          </motion.div>
        </div>
      </section>

      {/* Main Stack Content */}
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '48px 24px 0 24px', display: 'flex', flexDirection: 'column', gap: '48px', alignItems: 'center' }}>
        
        {/* Birthday Surprise Candle Section */}
        <div
          style={{
            width: '100%',
            borderRadius: '32px',
            background: 'linear-gradient(135deg, #FFF2EB 0%, #FFE4EF 100%)',
            border: '1px solid #FFCEE3',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 12px 32px rgba(61, 26, 40, 0.08)',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', color: '#F75270', textTransform: 'uppercase' }}>
            Birthday Celebration
          </span>

          {!candlesBlown ? (
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div
                onMouseDown={() => setCandleHoldProgress(5)}
                onMouseUp={() => setCandleHoldProgress(0)}
                onTouchStart={() => setCandleHoldProgress(5)}
                onTouchEnd={() => setCandleHoldProgress(0)}
                style={{
                  display: 'flex',
                  gap: '16px',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transform: `scale(${1 + candleHoldProgress * 0.003})`,
                  userSelect: 'none',
                }}
              >
                <div style={{ width: '12px', height: '40px', background: '#FFD700', borderRadius: '4px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-12px', left: '2px', width: '8px', height: '14px', background: '#FF7F50', borderRadius: '50% 50% 20% 20%' }} />
                </div>
                <div style={{ width: '12px', height: '40px', background: '#FFD700', borderRadius: '4px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-12px', left: '2px', width: '8px', height: '14px', background: '#FF7F50', borderRadius: '50% 50% 20% 20%' }} />
                </div>
                <div style={{ width: '12px', height: '40px', background: '#FFD700', borderRadius: '4px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-12px', left: '2px', width: '8px', height: '14px', background: '#FF7F50', borderRadius: '50% 50% 20% 20%' }} />
                </div>
              </div>
              <p style={{ fontSize: '13px', color: '#888', fontStyle: 'italic' }}>
                Press and hold to blow out the candles... ({candleHoldProgress}%)
              </p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '28px', color: '#3D1A28' }}>
                "Happy Birthday, my love"
              </h3>

              {priorWish && (
                <div style={{ padding: '12px', borderRadius: '16px', background: '#FFF', border: '1px solid #FFCEE3', fontFamily: 'var(--font-handwriting)', fontSize: '18px', color: '#D83B56' }}>
                  Last year, your partner wished: "{priorWish}"
                </div>
              )}

              <form onSubmit={handleWishSubmit} style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <textarea
                  value={wishInput}
                  onChange={(e) => setWishInput(e.target.value)}
                  placeholder="Make a secret wish for next year..."
                  rows={2}
                  style={{
                    padding: '12px',
                    borderRadius: '16px',
                    border: '1px solid #FFCEE3',
                    fontFamily: 'var(--font-handwriting)',
                    fontSize: '18px',
                    outline: 'none',
                  }}
                />
                {wishError && <p style={{ color: '#D83B56', fontSize: '12px' }}>{wishError}</p>}
                {wishSubmitted ? (
                  <p style={{ color: '#F75270', fontWeight: 600, fontSize: '13px' }}>Your wish is saved for next year</p>
                ) : (
                  <button className="lux-button" type="submit">
                    Make a Wish
                  </button>
                )}
              </form>
            </motion.div>
          )}
        </div>

        {/* Nickname Greeting Banner */}
        <AnimatePresence>
          {showGreeting && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass"
              style={{
                padding: '10px 24px',
                borderRadius: '9999px',
                fontFamily: 'var(--font-handwriting)',
                fontSize: '22px',
                color: '#D83B56',
                border: '1px solid #FFCEE3',
              }}
            >
              Welcome back, {nickname}
            </motion.div>
          )}
        </AnimatePresence>

        {/* "Right Now" Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', width: '100%' }}>
          <div className="glass" style={{ padding: '20px', borderRadius: '24px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7 }}>
              Days Together
            </span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', color: '#D83B56', margin: '4px 0' }}>
              {daysTogether}
            </h2>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>and counting every second</span>
          </div>

          <div className="glass" style={{ padding: '20px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, marginBottom: '6px' }}>
              Today's Thought
            </span>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '15px', color: '#3D1A28' }}>
              "{todaySentence}"
            </p>
          </div>

          <div
            className="glass"
            style={{
              padding: '20px',
              borderRadius: '24px',
              textAlign: 'center',
              border: '1px solid rgba(255, 206, 227, 0.5)',
            }}
          >
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7 }}>
              Love Note
            </span>
            <p style={{ fontFamily: 'var(--font-handwriting)', fontSize: '18px', fontWeight: 600, color: '#D83B56', marginTop: '8px' }}>
              Every meet with you becomes my favorite memory
            </p>
          </div>
        </div>

        {/* BRAND NEW ULTRA-ROYAL & PREMIUM PRECIOUS BIRTHDAY LETTER SECTION */}
        <div
          style={{
            width: '100%',
            position: 'relative',
            borderRadius: '36px',
            background: 'linear-gradient(135deg, #FCF5EE 0%, #F5E4D2 100%)',
            border: '2px solid #D4AF37', // Gold Foil Border
            boxShadow: '0 25px 70px rgba(212, 175, 55, 0.25), 0 10px 30px rgba(61, 26, 40, 0.15)',
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Gold Corner Accents */}
          <div style={{ position: 'absolute', top: '16px', left: '16px', color: '#D4AF37', fontSize: '16px' }}>✦</div>
          <div style={{ position: 'absolute', top: '16px', right: '16px', color: '#D4AF37', fontSize: '16px' }}>✦</div>
          <div style={{ position: 'absolute', bottom: '16px', left: '16px', color: '#D4AF37', fontSize: '16px' }}>✦</div>
          <div style={{ position: 'absolute', bottom: '16px', right: '16px', color: '#D4AF37', fontSize: '16px' }}>✦</div>

          {/* Letter Crown Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.2em', color: '#D4AF37', textTransform: 'uppercase' }}>
              ROYAL DEDICATION
            </span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '38px', color: '#3D1A28', marginTop: '6px' }}>
              To My Most Precious Girlfriend
            </h2>
            <div style={{ width: '80px', height: '2px', background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)', margin: '12px auto 0 auto' }} />
          </div>

          {/* Sealed State vs Unsealed Royal Letter */}
          {isLetterSealed ? (
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleUnsealRoyalLetter}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                cursor: 'pointer',
                padding: '40px 0',
              }}
            >
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #D4AF37 0%, #AA820A 100%)',
                  boxShadow: '0 10px 30px rgba(212, 175, 55, 0.5), 0 0 20px #FFD700',
                  border: '3px solid #FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  color: '#FFF',
                  fontWeight: 700,
                  fontFamily: 'var(--font-serif)',
                }}
              >
                S&M
              </div>
              <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '20px', color: '#3D1A28', fontWeight: 600 }}>
                Tap the Royal Wax Seal to Open Your Letter
              </span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              style={{
                width: '100%',
                maxWidth: '680px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                marginTop: '12px',
              }}
            >
              {/* Paragraph 1 */}
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '20px',
                  lineHeight: '1.8',
                  color: '#3D1A28',
                  textIndent: '32px',
                }}
              >
                My dearest, from the very moment you entered my life, every single ordinary day was transformed into an extraordinary gift. You bring a warmth that quietens every storm, a smile that lights up my darkest hours, and a love so boundless that words often fall short.
              </p>

              {/* Paragraph 2 */}
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '20px',
                  lineHeight: '1.8',
                  color: '#3D1A28',
                  textIndent: '32px',
                }}
              >
                On this special day, I want to remind you of just how deeply, unconditionally, and endlessly you are cherished. Thank you for your laughter, your gentle care, your cute quirks, and for choosing me to walk alongside you in this beautiful journey.
              </p>

              {/* Paragraph 3 */}
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '20px',
                  lineHeight: '1.8',
                  color: '#3D1A28',
                  textIndent: '32px',
                }}
              >
                I promise to keep choosing you every single morning, to hold your hand through every high and low, and to build a lifetime of memories that we will look back on with endless gratitude. Happy Birthday, my love.
              </p>

              {/* Royal Signature */}
              <div style={{ textAlign: 'right', marginTop: '32px', borderTop: '1px stroke #D4AF37', paddingTop: '16px' }}>
                <p style={{ fontFamily: 'var(--font-handwriting)', fontSize: '32px', color: '#D4AF37' }}>
                  Forever & Always Yours
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* SoundOfUsCard */}
        <SoundOfUsCard variant="featured" />

        {/* Hill Divider */}
        <HillDivider />

        {/* Today's Surprise Slot */}
        {(() => {
          const compliments = [
            'You\'re the reason I believe in magic',
            'If kisses were snowflakes, I\'d send you a blizzard',
            'Your smile is my favorite notification',
            'I fall in love with you a little more every single day',
            'You make ordinary moments feel extraordinary',
            'My heart does a little dance every time I think of you',
            'You\'re not just my love, you\'re my favorite adventure',
          ]
          const todayCompliment = compliments[dayOfYear % compliments.length]
          return (
            <div
              className="glass"
              onClick={() => setSurpriseRevealed(true)}
              style={{ width: '100%', maxWidth: '480px', borderRadius: '24px', padding: '24px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s ease' }}
            >
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F75270', fontWeight: 700 }}>
                TODAY'S SURPRISE
              </span>
              {surpriseRevealed ? (
                <motion.p
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ fontFamily: 'var(--font-handwriting)', fontSize: '22px', color: '#D83B56', marginTop: '12px', lineHeight: 1.5 }}
                >
                  {todayCompliment}
                </motion.p>
              ) : (
                <>
                  <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '18px', color: '#3D1A28', marginTop: '12px' }}>
                    "What has two hearts and endless memories?"
                  </p>
                  <span style={{ fontSize: '13px', color: '#F75270', display: 'block', marginTop: '8px', fontWeight: 600 }}>
                    Tap to reveal
                  </span>
                </>
              )}
            </div>
          )
        })()}

        {/* Quiet Closing Line */}
        <div style={{ marginTop: '48px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-handwriting)', fontSize: '24px', color: '#3D1A28' }}>
            still choosing you, on repeat
          </p>
        </div>
      </div>
    </div>
  )
}
