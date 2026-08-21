import React, { useState } from 'react'

export const LoveNoteDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [savedNotes, setSavedNotes] = useState<string[]>([
    'Remember how much I love your smile ❤️',
    'Can’t wait for our next trip together!',
  ])

  const handleAddNote = () => {
    if (!noteText.trim()) return
    setSavedNotes((prev) => [noteText.trim(), ...prev])
    setNoteText('')
  }

  return (
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9000,
          padding: '12px 20px',
          borderRadius: '9999px',
          background: 'linear-gradient(135deg, #F75270 0%, #D83B56 100%)',
          color: '#FFFFFF',
          border: 'none',
          boxShadow: '0 8px 24px rgba(216, 59, 86, 0.4)',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'transform 0.2s ease',
        }}
      >
        <span>💌 Love Notes</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '24px',
            width: '320px',
            maxHeight: '400px',
            zIndex: 9001,
            borderRadius: '24px',
            background: 'rgba(252, 245, 238, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid #FFCEE3',
            boxShadow: '0 16px 40px rgba(61, 26, 40, 0.2)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontFamily: 'var(--font-serif)', color: '#3D1A28', fontStyle: 'italic', fontSize: '18px' }}>
              Quick Love Notes
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#888' }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Leave a quick note..."
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '12px',
                border: '1px solid #FFCEE3',
                fontFamily: 'var(--font-handwriting)',
                fontSize: '16px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleAddNote}
              style={{
                padding: '8px 14px',
                borderRadius: '12px',
                background: '#F75270',
                color: '#FFF',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Save
            </button>
          </div>

          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {savedNotes.map((note, index) => (
              <div
                key={index}
                style={{
                  padding: '10px 14px',
                  borderRadius: '14px',
                  background: '#FFF',
                  border: '1px solid #FFE4EF',
                  fontFamily: 'var(--font-handwriting)',
                  fontSize: '17px',
                  color: '#3D1A28',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
