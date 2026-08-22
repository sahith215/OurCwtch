import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MemoryCardModal } from '../components/MemoryCardModal'
import { apiRequest, reportPersistenceError, reportPersistenceSuccess } from '../lib/persistence'

interface MemoryItem {
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

export const Route = createFileRoute('/_main/us')({
  component: UsGardenPage,
})

function UsGardenPage() {
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null)
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [stats, setStats] = useState({ daysTogether: 365, memoriesPlanted: 0, meetsWalked: 0, confessionsExchanged: 0 })
  const [swayingFlowerId, setSwayingFlowerId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Edit caption state for Pinterest feed
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null)
  const [editedCaption, setEditedCaption] = useState('')

  // Add form state
  const [newTitle, setNewTitle] = useState('')
  const [newSubtitle, setNewSubtitle] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newPhotoUrl, setNewPhotoUrl] = useState('')

  useEffect(() => {
    fetch('/api/memories').then(r => r.json()).then(data => { if (Array.isArray(data)) setMemories(data) }).catch(() => {})
    fetch('/api/us/stats').then(r => r.json()).then(data => { if (data.memoriesPlanted !== undefined) setStats(data) }).catch(() => {})
  }, [])

  const handleFlowerClick = (mem: MemoryItem) => {
    setSwayingFlowerId(mem.id)
    setTimeout(() => {
      setSelectedMemory(mem)
      setSwayingFlowerId(null)
    }, 350)
  }

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newNote.trim()) return

    const newReasonNumber = memories.length + 1
    const defaultPhoto = newPhotoUrl.trim() || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80'

    const payload = {
      reasonNumber: newReasonNumber,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || null,
      note: newNote.trim(),
      photoUrl: defaultPhoto,
    }

    try {
      const data = await apiRequest<MemoryItem>('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setMemories((prev) => [...prev, data])
      reportPersistenceSuccess('Fantasy saved')
    } catch (error) {
      reportPersistenceError(error)
      return
    }

    setShowAddModal(false)
    setNewTitle('')
    setNewSubtitle('')
    setNewNote('')
    setNewPhotoUrl('')
  }

  const handleSaveEditedCaption = async (id: string) => {
    try {
      await apiRequest('/api/memories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, note: editedCaption }),
      })
      setMemories((prev) => prev.map((m) => (m.id === id ? { ...m, note: editedCaption } : m)))
      reportPersistenceSuccess('Fantasy updated')
    } catch (error) {
      reportPersistenceError(error)
      return
    }
    setEditingPhotoId(null)
  }

  const handleDeleteMemory = async (id: string) => {
    try {
      await apiRequest(`/api/memories?id=${id}`, { method: 'DELETE' })
      setMemories((prev) => prev.filter((m) => m.id !== id))
      reportPersistenceSuccess('Fantasy deleted')
    } catch (error) {
      reportPersistenceError(error)
      return
    }
  }

  const renderFlowerSVG = (typeIndex: number, isMilestone: boolean) => {
    const colors = ['#F75270', '#FFCEE3', '#D83B56', '#FFE4EF']
    const petalColor = colors[typeIndex % colors.length]

    return (
      <svg width="48" height="64" viewBox="0 0 48 64" fill="none">
        <path d="M24 24 Q22 44 24 64" stroke="#7A9A7B" strokeWidth="3" strokeLinecap="round" />
        <path d="M24 44 Q14 40 18 34 Q24 38 24 44" fill="#8BAA8C" />
        <path d="M24 50 Q34 46 30 40 Q24 44 24 50" fill="#8BAA8C" />
        <g>
          <circle cx="24" cy="20" r="14" fill={petalColor} />
          <circle cx="24" cy="20" r="8" fill="#D83B56" />
          <circle cx="24" cy="20" r="4" fill="#FFF2EB" />
        </g>
        {isMilestone && (
          <circle cx="24" cy="20" r="16" stroke="#FFD700" strokeWidth="2" strokeDasharray="3 3" fill="none" />
        )}
      </svg>
    )
  }

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 72px)', position: 'relative', overflowX: 'hidden', paddingBottom: '96px' }}>
      {/* Garden Bed Hero Strip */}
      <div
        style={{
          width: '100%',
          minHeight: '320px',
          background: 'linear-gradient(180deg, #FFCEE3 0%, #2A1220 100%)',
          position: 'relative',
          padding: '40px 24px 80px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ textAlign: 'center', color: '#FFF2EB', marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '36px', fontWeight: 400 }}>
            Our Growing Garden
          </h2>
          <p style={{ fontFamily: 'var(--font-handwriting)', fontSize: '20px', color: '#FFCEE3', marginTop: '4px' }}>
            every flower planted is a fantasy saved
          </p>
        </div>

        {/* Soil Line & Flowers Grid */}
        <div
          style={{
            width: '100%',
            maxWidth: '56rem',
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: '32px 16px',
            justifyItems: 'center',
            alignItems: 'end',
            paddingBottom: '20px',
          }}
        >
          {memories.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#FFCEE3', padding: '30px 0' }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', marginTop: '8px' }}>
                Plant your first fantasy card below
              </p>
            </div>
          ) : (
            memories.map((mem, idx) => {
              const isMilestone = (idx + 1) % 10 === 0
              const isSwaying = swayingFlowerId === mem.id

              return (
                <motion.div
                  key={mem.id}
                  onClick={() => handleFlowerClick(mem)}
                  animate={isSwaying ? { rotate: [-3, 3, -3, 0] } : {}}
                  transition={{ duration: 0.35 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  {renderFlowerSVG(mem.reasonNumber || idx + 1, isMilestone)}
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#FFF2EB',
                      background: 'rgba(61, 26, 40, 0.7)',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      marginTop: '4px',
                    }}
                  >
                    #{mem.reasonNumber || idx + 1}
                  </span>
                </motion.div>
              )
            })
          )}
        </div>

        {/* Wavy Soil Line Path SVG */}
        <svg
          viewBox="0 0 1200 40"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '40px',
            fill: '#FCF5EE',
          }}
        >
          <path d="M0 20 Q300 0 600 20 T1200 20 L1200 40 L0 40 Z" />
        </svg>
      </div>

      {/* Primary Action Floating Button */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0' }}>
        <button className="lux-button" onClick={() => setShowAddModal(true)} style={{ padding: '14px 32px', fontSize: '15px' }}>
          + Add Our Fantasy Card
        </button>
      </div>

      {/* NEW PINTERESTY ALTERNATING IMAGE FEED SECTION */}
      <div style={{ maxWidth: '56rem', margin: '48px auto 0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '64px' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', color: '#F75270', textTransform: 'uppercase' }}>
            PINTEREST GALLERY
          </span>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '32px', color: '#3D1A28', marginTop: '4px' }}>
            Moments & Flirty Whispers
          </h3>
        </div>

        {memories.map((mem, idx) => {
          const isEven = idx % 2 === 0
          const isEditing = editingPhotoId === mem.id

          return (
            <motion.div
              key={mem.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexDirection: isEven ? 'row' : 'row-reverse',
                gap: '30%', // 30% DISTANCE BETWEEN IMAGE AND CAPTION as requested!
              }}
            >
              {/* Image Container */}
              <div
                style={{
                  width: '40%',
                  minWidth: '260px',
                  aspectRatio: '4 / 5',
                  borderRadius: '28px',
                  overflow: 'hidden',
                  boxShadow: '0 16px 40px rgba(61, 26, 40, 0.15)',
                  border: '3px solid #FFF',
                  position: 'relative',
                }}
              >
                <img src={mem.photoUrl} alt={mem.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              {/* Caption & Numbering Container (in Pink) */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#F75270', // Pink numbering
                  }}
                >
                  #{mem.reasonNumber || idx + 1} · {mem.title}
                </span>

                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <textarea
                      value={editedCaption}
                      onChange={(e) => setEditedCaption(e.target.value)}
                      rows={3}
                      style={{
                        padding: '12px',
                        borderRadius: '16px',
                        border: '1px solid #F75270',
                        fontFamily: 'var(--font-handwriting)',
                        fontSize: '20px',
                        outline: 'none',
                      }}
                    />
                    <button
                      className="lux-button"
                      onClick={() => handleSaveEditedCaption(mem.id)}
                      style={{ alignSelf: 'flex-start', padding: '6px 16px', fontSize: '12px' }}
                    >
                      Save Caption
                    </button>
                  </div>
                ) : (
                  <div>
                    <p
                      onClick={() => {
                        setEditingPhotoId(mem.id)
                        setEditedCaption(mem.note)
                      }}
                      style={{
                        fontFamily: 'var(--font-handwriting)',
                        fontSize: '24px',
                        color: '#D83B56', // Modifiable flirty line in pink
                        lineHeight: 1.4,
                        cursor: 'pointer',
                      }}
                    >
                      "{mem.note}"
                    </p>
                    <span style={{ fontSize: '11px', color: '#888', fontStyle: 'italic', cursor: 'pointer' }}>
                      (click text to edit flirty caption)
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Delete this fantasy forever?')) handleDeleteMemory(mem.id)
                      }}
                      style={{
                        marginTop: '8px',
                        background: 'none',
                        border: '1px solid rgba(216, 59, 86, 0.3)',
                        borderRadius: '8px',
                        padding: '4px 12px',
                        fontSize: '11px',
                        color: '#D83B56',
                        cursor: 'pointer',
                        alignSelf: 'flex-start',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Memory Card Viewing/Editing Modal */}
      <MemoryCardModal memory={selectedMemory} onClose={() => setSelectedMemory(null)} />

      {/* Add Memory Modal */}
      <AnimatePresence>
        {showAddModal && (
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
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '440px',
                borderRadius: '32px',
                background: 'rgba(252, 245, 238, 0.95)',
                border: '1px solid #FFCEE3',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', color: '#3D1A28', fontSize: '22px' }}>
                  Plant a New Fantasy Card
                </h3>
                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateMemory} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Fantasy Title (e.g. Sunset Picnic)"
                  style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #FFCEE3' }}
                />
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="Subtitle / Location"
                  style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #FFCEE3' }}
                />
                <textarea
                  required
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                  placeholder="Flirty caption / note..."
                  style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #FFCEE3', fontFamily: 'var(--font-handwriting)', fontSize: '18px' }}
                />
                <div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px dashed #FFCEE3',
                      background: newPhotoUrl ? 'rgba(255, 206, 227, 0.15)' : '#FFF',
                      cursor: 'pointer',
                    }}
                  >
                    {newPhotoUrl ? (
                      <>
                        <img src={newPhotoUrl} alt="Preview" style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
                        <span style={{ fontSize: '13px', color: '#3D1A28', fontWeight: 600 }}>Photo selected</span>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '13px', color: '#888' }}>Tap to choose photo from gallery</span>
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
                        reader.onload = (ev) => setNewPhotoUrl(ev.target?.result as string)
                        reader.readAsDataURL(file)
                      }}
                    />
                  </label>
                </div>

                <button className="lux-button" type="submit" style={{ marginTop: '8px' }}>
                  Plant Fantasy
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
