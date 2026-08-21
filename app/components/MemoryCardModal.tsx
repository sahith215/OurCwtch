import React, { useState } from 'react'
import { motion } from 'framer-motion'

interface MemoryCardData {
  id: string
  reasonNumber: number
  title: string
  subtitle?: string | null
  note: string
  photoUrl: string
  imgZoom?: number | null
  imgX?: number | null
  imgY?: number | null
}

interface MemoryCardModalProps {
  memory: MemoryCardData | null
  onClose: () => void
  onSave?: (updated: MemoryCardData) => void
  onDelete?: (id: string) => void
}

export const MemoryCardModal: React.FC<MemoryCardModalProps> = ({
  memory,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!memory) return null

  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(memory.title)
  const [subtitle, setSubtitle] = useState(memory.subtitle || '')
  const [note, setNote] = useState(memory.note)
  const [zoom, setZoom] = useState(memory.imgZoom || 1)

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...memory,
        title,
        subtitle,
        note,
        imgZoom: zoom,
      })
    }
    setIsEditing(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9500,
        background: 'rgba(42, 18, 32, 0.6)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          borderRadius: '32px',
          background: 'rgba(252, 245, 238, 0.95)',
          border: '1px solid #FFCEE3',
          boxShadow: '0 24px 60px rgba(61, 26, 40, 0.3)',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              background: '#FFCEE3',
              color: '#D83B56',
              fontWeight: 700,
              fontSize: '12px',
            }}
          >
            Reason #{memory.reasonNumber}
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#3D1A28' }}
          >
            ✕
          </button>
        </div>

        {/* Photo Container */}
        <div
          style={{
            width: '100%',
            height: '240px',
            borderRadius: '20px',
            overflow: 'hidden',
            position: 'relative',
            background: '#FFE4EF',
          }}
        >
          <img
            src={memory.photoUrl}
            alt={memory.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${zoom})`,
              transition: 'transform 0.2s ease',
            }}
          />
        </div>

        {/* Form or Display */}
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid #FFCEE3',
                fontFamily: 'var(--font-serif)',
                fontSize: '18px',
              }}
            />
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Subtitle"
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid #FFCEE3',
                fontSize: '14px',
              }}
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Note..."
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid #FFCEE3',
                fontFamily: 'var(--font-handwriting)',
                fontSize: '18px',
              }}
            />
            <div>
              <label style={{ fontSize: '12px', color: '#888' }}>Zoom: {zoom.toFixed(1)}x</label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <button className="lux-button" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        ) : (
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: '#3D1A28' }}>{memory.title}</h3>
            {memory.subtitle && (
              <p style={{ fontSize: '14px', color: '#F75270', marginTop: '2px', fontWeight: 600 }}>
                {memory.subtitle}
              </p>
            )}
            <p
              style={{
                fontFamily: 'var(--font-handwriting)',
                fontSize: '20px',
                color: '#3D1A28',
                marginTop: '12px',
                lineHeight: 1.4,
              }}
            >
              "{memory.note}"
            </p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                background: '#FFCEE3',
                color: '#3D1A28',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
              }}
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(memory.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                background: 'rgba(216, 59, 86, 0.1)',
                color: '#D83B56',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
              }}
            >
              Delete
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
