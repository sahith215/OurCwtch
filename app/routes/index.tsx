import { createFileRoute, useNavigate } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { motion, useSpring } from 'framer-motion'
import { StarCanvas } from '../components/StarCanvas'
import { PetalBlastCanvas } from '../components/PetalBlastCanvas'

export const Route = createFileRoute('/')({
  component: GatePage,
})

function GatePage() {
  const navigate = useNavigate()
  const [showQuestion, setShowQuestion] = useState(false)
  const [blastState, setBlastState] = useState<{ active: boolean; x: number; y: number }>({
    active: false,
    x: 0,
    y: 0,
  })

  // Dodge spring for NO button
  const noX = useSpring(0, { stiffness: 180, damping: 20 })
  const noY = useSpring(0, { stiffness: 180, damping: 20 })

  useEffect(() => {
    // Check if user is already logged in & onboarded
    fetch('/api/auth/get-session')
      .then((r) => r.json())
      .then((sess) => {
        if (sess?.user?.isOnboarded) {
          navigate({ to: '/home' })
        } else {
          setShowQuestion(true)
        }
      })
      .catch(() => {
        setShowQuestion(true)
      })
  }, [navigate])

  const handleNoHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const deltaX = e.clientX - centerX
    const deltaY = e.clientY - centerY

    const moveX = (deltaX > 0 ? -1 : 1) * (Math.random() * 100 + 80)
    const moveY = (deltaY > 0 ? -1 : 1) * (Math.random() * 80 + 50)

    noX.set(moveX)
    noY.set(moveY)
  }

  const handleYesClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setBlastState({
      active: true,
      x: e.clientX,
      y: e.clientY,
    })
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0B0710',
      }}
    >
      <StarCanvas variant="gate" />

      {blastState.active && (
        <PetalBlastCanvas
          origin="click-point"
          clickX={blastState.x}
          clickY={blastState.y}
          density={210}
          onThinning={() => {
            navigate({ to: '/auth' })
          }}
        />
      )}

      {showQuestion && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{
            zIndex: 10,
            textAlign: 'center',
            padding: '32px',
            maxWidth: '560px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '32px',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: '36px',
              color: '#FCF5EE',
              lineHeight: 1.3,
              fontWeight: 400,
              textShadow: '0 0 20px rgba(255, 206, 227, 0.4)',
            }}
          >
            "Are you ready to step into our world?"
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button className="lux-button" onClick={handleYesClick} style={{ padding: '14px 36px', fontSize: '16px' }}>
              YES
            </button>

            <motion.button
              onMouseEnter={handleNoHover}
              style={{
                x: noX,
                y: noY,
                padding: '14px 32px',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 206, 227, 0.3)',
                color: 'rgba(252, 245, 238, 0.8)',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              NO
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
