import React, { useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useVinylPlayer } from './VinylPlayer'

interface SoundOfUsCardProps {
  variant?: 'featured' | 'compact'
  spotifyUrl?: string
  trackCount?: number
  totalDuration?: string
  husbandInitial?: string
  wifeInitial?: string
}

export const SoundOfUsCard: React.FC<SoundOfUsCardProps> = ({
  variant = 'featured',
  spotifyUrl = 'https://open.spotify.com/playlist/4wG6bSxA3OyucUeiIQvAiL?si=bcf1035f5ba940dd',
  trackCount = 38,
  totalDuration = '2h 14m',
  husbandInitial = 'H',
  wifeInitial = 'W',
}) => {
  const { isPlaying, playTrack } = useVinylPlayer()
  const [showEmbedModal, setShowEmbedModal] = useState(false)

  const isFeatured = variant === 'featured'
  const maxWidth = isFeatured ? '340px' : '280px'
  const titleSize = isFeatured ? '28px' : '20px'

  // Perspective Tilt
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 })
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['4deg', '-4deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-4deg', '4deg'])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5

    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const handlePlay = () => {
    setShowEmbedModal(true)
  }

  return (
    <>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          width: '100%',
          maxWidth,
          aspectRatio: '3 / 4',
          borderRadius: '32px',
          background: 'linear-gradient(135deg, #FFCEE3 0%, #F75270 50%, #3D1A28 100%)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(61, 26, 40, 0.25)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          userSelect: 'none',
        }}
        tabIndex={0}
        role="region"
        aria-label="Play The Sound of Us playlist"
      >
        {/* Noise Texture Overlay */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.04,
            pointerEvents: 'none',
          }}
        >
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>

        {/* Top Label */}
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'rgba(255, 206, 227, 0.85)',
          }}
        >
          OUR PLAYLIST
        </div>

        {/* Center Artwork Tile */}
        <div
          style={{
            width: '85%',
            aspectRatio: '1 / 1',
            margin: '0 auto',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #3D1A28 0%, #2A1220 100%)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          {/* Radial Gradient Blobs */}
          <div
            style={{
              position: 'absolute',
              width: '80px',
              height: '80px',
              top: '10%',
              left: '10%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #F75270 0%, transparent 70%)',
              filter: 'blur(15px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '90px',
              height: '90px',
              bottom: '10%',
              right: '10%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #FFCEE3 0%, transparent 70%)',
              filter: 'blur(15px)',
            }}
          />

          {/* SVG Interlocking Hearts */}
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" style={{ opacity: 0.45, zIndex: 1 }}>
            <path
              d="M22 36C22 36 12 28 12 20C12 15.5 15.5 12 20 12C22.5 12 24.8 13.2 26 15C27.2 13.2 29.5 12 32 12C36.5 12 40 15.5 40 20C40 28 30 36 30 36"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M36 44C36 44 26 36 26 28C26 23.5 29.5 20 34 20C36.5 20 38.8 21.2 40 23C41.2 21.2 43.5 20 46 20C50.5 20 54 23.5 54 28C54 36 44 44 44 44"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>

          {/* Glass Highlight */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              width: '40%',
              height: '20px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(4px)',
            }}
          />
        </div>

        {/* Titles */}
        <div style={{ textAlign: 'center', margin: '8px 0' }}>
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: titleSize,
              color: '#FCF5EE',
              lineHeight: 1.1,
              fontWeight: 700,
            }}
          >
            The Sound Of Us
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-handwriting)',
              fontSize: '16px',
              color: '#FFCEE3',
              marginTop: '4px',
            }}
          >
            every song that sounds like you
          </p>
        </div>

        {/* Equalizer Waveform Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            height: '24px',
          }}
        >
          {Array.from({ length: 28 }).map((_, i) => (
            <motion.div
              key={i}
              animate={
                isPlaying
                  ? { scaleY: [0.3, 1, 0.4, 0.9, 0.2] }
                  : { scaleY: [0.4, 0.7, 0.4] }
              }
              transition={{
                duration: isPlaying ? 0.6 + (i % 5) * 0.1 : 1.8 + (i % 4) * 0.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: (i % 7) * 0.08,
              }}
              style={{
                width: '2px',
                height: '18px',
                backgroundColor: '#FFCEE3',
                borderRadius: '1px',
                transformOrigin: 'bottom',
              }}
            />
          ))}
        </div>

        {/* Bottom Info Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#F75270',
                border: '2px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {husbandInitial}
            </div>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#D83B56',
                border: '2px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 700,
                marginLeft: '-8px',
              }}
            >
              {wifeInitial}
            </div>
          </div>

          <span style={{ fontSize: '12px', color: 'rgba(252, 245, 238, 0.75)' }}>
            {trackCount} songs · {totalDuration}
          </span>
        </div>

        {/* Play Button */}
        <motion.button
          onClick={handlePlay}
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.96 }}
          className="lux-button"
          style={{
            width: '100%',
            marginTop: '8px',
          }}
        >
          Play the sound of us
        </motion.button>
      </motion.div>

      {/* Embedded Spotify Player Modal */}
      {showEmbedModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(42, 18, 32, 0.75)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setShowEmbedModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '540px',
              borderRadius: '28px',
              background: '#2A1220',
              border: '1px solid #FFCEE3',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', color: '#FFCEE3', fontSize: '20px' }}>
                The Sound Of Us
              </h3>
              <button
                onClick={() => setShowEmbedModal(false)}
                style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <iframe
              style={{ borderRadius: '16px' }}
              src="https://open.spotify.com/embed/playlist/4wG6bSxA3OyucUeiIQvAiL?utm_source=generator&theme=0"
              width="100%"
              height="380"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </motion.div>
        </div>
      )}
    </>
  )
}
