import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiRequest, reportPersistenceError, reportPersistenceSuccess } from '../lib/persistence'
import { compressImage } from '../lib/image'

interface MeetItem {
  id: string
  title: string
  location?: string
  date: string
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night'
  bestMemory: string
  photoUrls: string[]
  soundtrack?: string
  moodTag?: string
  order: number
  isUpcoming?: boolean
}

export const Route = createFileRoute('/_main/meets')({
  component: MeetsPage,
})

function MeetsPage() {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [scrollX, setScrollX] = useState(0)

  const [meetsList, setMeetsList] = useState<MeetItem[]>([])
  const [activeMeetDashboard, setActiveMeetDashboard] = useState<MeetItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalIsUpcoming, setModalIsUpcoming] = useState(false)

  // Form fields
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [bestMemory, setBestMemory] = useState('')
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [soundtrack, setSoundtrack] = useState('')
  const [moodTag, setMoodTag] = useState('')
  const [timeOfDay, setTimeOfDay] = useState<'dawn' | 'day' | 'dusk' | 'night'>('dusk')

  useEffect(() => {
    fetch('/api/meets')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMeetsList(
            data.map((m: any) => ({
              ...m,
              bestMemory: m.bestMemory || m.note || '',
              photoUrls: Array.isArray(m.photoUrls) ? m.photoUrls : [m.photoUrl || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80'],
            }))
          )
        }
      })
      .catch(() => {})
  }, [])

  const handleScroll = () => {
    if (scrollRef.current) {
      setScrollX(scrollRef.current.scrollLeft)
    }
  }

  const handleSaveMeet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date) return

    const photos = selectedPhotos.length > 0 ? selectedPhotos : ['https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80']
    if (photos.reduce((total, photo) => total + photo.length, 0) > 900_000) {
      reportPersistenceError(new Error('Please choose fewer or smaller photos.'))
      return
    }

    const newMeet: MeetItem = {
      id: crypto.randomUUID(),
      title: title.trim(),
      location: location.trim() || 'Secret Haven',
      date,
      timeOfDay,
      bestMemory: bestMemory.trim() || 'A moment frozen in time forever.',
      photoUrls: photos,
      soundtrack: soundtrack.trim() || 'Our Favorite Melody',
      moodTag: moodTag.trim() || 'Pure Love',
      order: meetsList.length + 1,
      isUpcoming: modalIsUpcoming,
    }

    try {
      const data = await apiRequest<MeetItem>('/api/meets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMeet),
      })
      setMeetsList((prev) => [...prev, data])
      reportPersistenceSuccess('Meet saved')
    } catch (error) {
      reportPersistenceError(error)
      return
    }

    setShowModal(false)
    setTitle('')
    setLocation('')
    setDate('')
    setBestMemory('')
    setSelectedPhotos([])
    setSoundtrack('')
    setMoodTag('')
  }

  const handleDeleteMeet = async (id: string) => {
    try {
      await apiRequest(`/api/meets?id=${id}`, { method: 'DELETE' })
      reportPersistenceSuccess('Meet deleted')
    } catch (error) {
      reportPersistenceError(error)
      return
    }
    setMeetsList((prev) => prev.filter((m) => m.id !== id))
    setActiveMeetDashboard(null)
  }

  const totalWidth = Math.max(1200, (meetsList.length + 2) * 520)

  return (
    <div style={{ width: '100vw', height: 'calc(100dvh - 72px)', position: 'relative', overflow: 'hidden', background: '#0B0710' }}>
      {/* 1. Parallax Background Gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #FF9472 0%, #3D1A28 50%, #0B0710 100%)',
          transition: 'background 0.5s ease',
        }}
      />

      {/* Layer 1: Background Hills */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: `${totalWidth}px`,
          height: '60%',
          transform: `translateX(${-scrollX * 0.2}px)`,
          pointerEvents: 'none',
        }}
      >
        <svg viewBox="0 0 1200 300" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <path d="M0 150 Q300 50 600 180 T1200 120 L1200 300 L0 300 Z" fill="#2A1220" opacity="0.4" />
        </svg>
      </div>

      {/* Layer 2: Midground Hills */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: `${totalWidth}px`,
          height: '45%',
          transform: `translateX(${-scrollX * 0.5}px)`,
          pointerEvents: 'none',
        }}
      >
        <svg viewBox="0 0 1200 250" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <path d="M0 120 Q400 30 800 140 T1200 100 L1200 250 L0 250 Z" fill="#3D1A28" opacity="0.7" />
        </svg>
      </div>

      {/* Layer 3: Main Horizontal Romantic Map Trail */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          width: '100%',
          height: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          whiteSpace: 'nowrap',
          position: 'relative',
          scrollBehavior: 'smooth',
          display: 'flex',
          alignItems: 'center',
          padding: '0 120px',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '260px', position: 'relative' }}>
          {meetsList.length > 0 && (
            <svg
              style={{
                position: 'absolute',
                top: '50%',
                left: '40px',
                width: 'calc(100% - 80px)',
                height: '80px',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            >
              <path
                d={`M 0 40 Q 200 10, 400 40 T 800 40 T 1200 40 T 1600 40 T 2000 40`}
                fill="none"
                stroke="#FFCEE3"
                strokeWidth="3"
                strokeDasharray="8 8"
                opacity="0.8"
              />
            </svg>
          )}

          {/* Meets Checkpoint Nodes */}
          {meetsList.map((meet, idx) => (
            <motion.div
              key={meet.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ scale: 1.08, y: -6 }}
              style={{
                position: 'relative',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                zIndex: 2,
              }}
              onClick={() => setActiveMeetDashboard(meet)}
            >
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  border: '4px solid #FFF',
                  boxShadow: '0 10px 30px rgba(247, 82, 112, 0.4), 0 0 20px rgba(255, 206, 227, 0.6)',
                  overflow: 'hidden',
                  marginBottom: '16px',
                  background: '#3D1A28',
                }}
              >
                <img src={(meet.photoUrls && meet.photoUrls[0]) || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80'} alt={meet.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #F75270 0%, #D83B56 100%)',
                  boxShadow: '0 0 24px #F75270, 0 0 10px #FFCEE3',
                  border: '3px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFF',
                  fontSize: '11px',
                }}
              >
                ✦
              </div>

              <span style={{ fontSize: '15px', color: '#FFF2EB', fontWeight: 700, marginTop: '10px' }}>
                {meet.title}
              </span>
              <span style={{ fontSize: '12px', color: '#FFCEE3', opacity: 0.9, marginTop: '2px' }}>
                {meet.location || 'Special Meet'} · {meet.date}
              </span>
            </motion.div>
          ))}

          {/* End of Trail "Add Meet" Node */}
          <motion.div
            whileHover={{ scale: 1.08, y: -6 }}
            onClick={() => {
              setModalIsUpcoming(true)
              setShowModal(true)
            }}
            style={{
              position: 'relative',
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                border: '3px dashed #FFCEE3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFCEE3',
                fontSize: '32px',
                marginBottom: '16px',
                background: 'rgba(255, 206, 227, 0.15)',
                boxShadow: '0 0 25px rgba(255, 206, 227, 0.3)',
              }}
            >
              +
            </div>

            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '2px dashed #FFCEE3',
                background: 'transparent',
              }}
            />

            <span style={{ fontSize: '15px', color: '#FFCEE3', fontWeight: 700, marginTop: '10px' }}>
              Add a Memory
            </span>
            <span style={{ fontSize: '12px', color: 'rgba(255, 206, 227, 0.8)' }}>
              relive every moment together
            </span>
          </motion.div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 9000 }}>
        <button
          className="lux-button"
          onClick={() => {
            setModalIsUpcoming(false)
            setShowModal(true)
          }}
          style={{ padding: '14px 28px', fontSize: '15px' }}
        >
          + Record a Meet
        </button>
      </div>

      {/* 90% SCREEN MINI-DASHBOARD POP-UP CARD FOR MEET DETAILS */}
      <AnimatePresence>
        {activeMeetDashboard && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9800,
              background: 'rgba(11, 7, 16, 0.75)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
            onClick={() => setActiveMeetDashboard(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '90vw',
                maxWidth: '1180px',
                height: '85vh',
                maxHeight: '800px',
                background: 'linear-gradient(135deg, #FCF5EE 0%, #FFF2EB 100%)',
                borderRadius: '36px',
                border: '1.5px solid #FFCEE3',
                boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  padding: '28px 36px',
                  background: 'linear-gradient(135deg, #3D1A28 0%, #2A1220 100%)',
                  color: '#FFF2EB',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255, 206, 227, 0.3)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', color: '#F75270', textTransform: 'uppercase' }}>
                      MEET DASHBOARD
                    </span>
                    {activeMeetDashboard.moodTag && (
                      <span style={{ fontSize: '11px', background: '#F75270', color: '#FFF', padding: '2px 10px', borderRadius: '9999px', fontWeight: 600 }}>
                        {activeMeetDashboard.moodTag}
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '32px', marginTop: '4px' }}>
                    {activeMeetDashboard.title}
                  </h2>
                  <p style={{ fontSize: '13px', color: '#FFCEE3', opacity: 0.9, marginTop: '2px' }}>
                    {activeMeetDashboard.location || 'Secret Location'} · {activeMeetDashboard.date}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button
                    onClick={() => handleDeleteMeet(activeMeetDashboard.id)}
                    style={{ background: 'none', border: 'none', color: '#F75270', fontSize: '13px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setActiveMeetDashboard(null)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.15)',
                      border: 'none',
                      color: '#FFF',
                      fontSize: '18px',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  padding: '32px 36px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '32px',
                  overflowY: 'auto',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div
                    className="glass"
                    style={{
                      borderRadius: '24px',
                      padding: '24px',
                      border: '1px solid #FFCEE3',
                      background: '#FFF',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#F75270', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Best Memory of This Meet
                    </span>
                    <p
                      style={{
                        fontFamily: 'var(--font-handwriting)',
                        fontSize: '24px',
                        color: '#3D1A28',
                        lineHeight: 1.4,
                        marginTop: '12px',
                      }}
                    >
                      "{activeMeetDashboard.bestMemory}"
                    </p>
                  </div>

                  <div
                    className="glass"
                    style={{
                      borderRadius: '24px',
                      padding: '20px',
                      background: '#FFF2EB',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>
                        Song of the Day
                      </span>
                      <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: '#3D1A28', marginTop: '2px' }}>
                        {activeMeetDashboard.soundtrack || 'Our Favorite Tune'}
                      </h4>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#3D1A28', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Photos Clicked in This Meet ({(activeMeetDashboard.photoUrls || []).length})
                  </span>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                      gap: '16px',
                    }}
                  >
                    {(activeMeetDashboard.photoUrls || []).map((url, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.03 }}
                        style={{
                          borderRadius: '16px',
                          overflow: 'hidden',
                          aspectRatio: '1/1',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                          border: '2px solid white',
                        }}
                      >
                        <img src={url} alt={`Meet photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Meet Rich Form Modal */}
      <AnimatePresence>
        {showModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9500,
              background: 'rgba(11, 7, 16, 0.7)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '520px',
                borderRadius: '32px',
                background: 'rgba(252, 245, 238, 0.95)',
                border: '1px solid #FFCEE3',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', color: '#3D1A28', fontSize: '24px' }}>
                  {modalIsUpcoming ? 'Add a Special Memory' : 'Record a Meet Memory'}
                </h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveMeet} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Meet Title (e.g. Rainy Afternoon in Paris)"
                  style={{ padding: '12px 16px', borderRadius: '14px', border: '1px solid #FFCEE3' }}
                />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location / Venue (e.g. Central Park Café)"
                  style={{ padding: '12px 16px', borderRadius: '14px', border: '1px solid #FFCEE3' }}
                />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '14px', border: '1px solid #FFCEE3' }}
                />

                <textarea
                  required
                  value={bestMemory}
                  onChange={(e) => setBestMemory(e.target.value)}
                  rows={3}
                  placeholder="Best memory story of this meet..."
                  style={{ padding: '12px 16px', borderRadius: '14px', border: '1px solid #FFCEE3', fontFamily: 'var(--font-handwriting)', fontSize: '18px' }}
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
                      background: selectedPhotos.length > 0 ? 'rgba(255, 206, 227, 0.15)' : '#FFF',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: '13px', color: selectedPhotos.length > 0 ? '#3D1A28' : '#888', fontWeight: selectedPhotos.length > 0 ? 600 : 400 }}>
                      {selectedPhotos.length > 0 ? `${selectedPhotos.length} photo(s) selected` : 'Tap to add photos from gallery'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const files = e.target.files
                        if (!files) return
                        Array.from(files).forEach(async (file) => {
                          try {
                            const compressed = await compressImage(file)
                            setSelectedPhotos((prev) => [...prev, compressed])
                          } catch (error) {
                            reportPersistenceError(error)
                          }
                        })
                      }}
                    />
                  </label>
                  {selectedPhotos.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {selectedPhotos.map((url, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                          <img src={url} alt={`Preview ${i + 1}`} style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #FFCEE3' }} />
                          <button
                            type="button"
                            onClick={() => setSelectedPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                            style={{ position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px', borderRadius: '50%', background: '#D83B56', color: '#FFF', border: 'none', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input
                    type="text"
                    value={soundtrack}
                    onChange={(e) => setSoundtrack(e.target.value)}
                    placeholder="Song of the day"
                    style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #FFCEE3' }}
                  />
                  <input
                    type="text"
                    value={moodTag}
                    onChange={(e) => setMoodTag(e.target.value)}
                    placeholder="Mood tag (e.g. Cozy)"
                    style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #FFCEE3' }}
                  />
                </div>

                <button className="lux-button" type="submit" style={{ marginTop: '10px', padding: '14px' }}>
                  Save Meet Checkpoint
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
