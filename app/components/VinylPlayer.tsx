import React, { createContext, useContext, useState } from 'react'

interface VinylPlayerContextType {
  isPlaying: boolean
  currentTrack: string
  togglePlay: () => void
  playTrack: (title: string) => void
}

const VinylPlayerContext = createContext<VinylPlayerContextType>({
  isPlaying: false,
  currentTrack: 'The Sound of Us',
  togglePlay: () => {},
  playTrack: () => {},
})

export const useVinylPlayer = () => useContext(VinylPlayerContext)

export const VinylPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState('The Sound of Us')

  const togglePlay = () => setIsPlaying((prev) => !prev)
  const playTrack = (title: string) => {
    setCurrentTrack(title)
    setIsPlaying(true)
  }

  return (
    <VinylPlayerContext.Provider value={{ isPlaying, currentTrack, togglePlay, playTrack }}>
      {children}
      <VinylPlayerOverlay isPlaying={isPlaying} currentTrack={currentTrack} togglePlay={togglePlay} />
    </VinylPlayerContext.Provider>
  )
}

const VinylPlayerOverlay: React.FC<{
  isPlaying: boolean
  currentTrack: string
  togglePlay: () => void
}> = ({ isPlaying, currentTrack, togglePlay }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 18px 10px 12px',
        borderRadius: '9999px',
        background: 'rgba(61, 26, 40, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(247, 82, 112, 0.4)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        color: '#FFF2EB',
        userSelect: 'none',
      }}
    >
      {/* Vinyl record disc */}
      <div
        onClick={togglePlay}
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #D83B56 20%, #1A0D15 22%, #1A0D15 100%)',
          border: '2px solid rgba(255,206,227,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          animation: isPlaying ? 'spin 3s linear infinite' : 'none',
          boxShadow: isPlaying ? '0 0 14px rgba(247, 82, 112, 0.6)' : 'none',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FCF5EE' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.75, color: '#FFCEE3' }}>
          {isPlaying ? 'Now Playing' : 'Paused'}
        </span>
        <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-serif)', fontStyle: 'italic', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentTrack}
        </span>
      </div>

      <button
        onClick={togglePlay}
        style={{
          background: 'none',
          border: 'none',
          color: '#FFCEE3',
          fontSize: '18px',
          cursor: 'pointer',
          marginLeft: '4px',
        }}
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <style>{`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
