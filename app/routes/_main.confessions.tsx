import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PetalBlastCanvas } from '../components/PetalBlastCanvas'
import { apiRequest, reportPersistenceError, reportPersistenceSuccess } from '../lib/persistence'

interface ConfessionItem {
  id: string
  authorRole: 'Husband' | 'Wife'
  body: string
  toneTag: 'sweet' | 'shy' | 'flirty' | 'vulnerable'
  revealAt: string
  openedAt?: string | null
  openedByRole?: string | null
  createdAt?: string
  confessionNumber?: number
}

export const Route = createFileRoute('/_main/confessions')({
  component: ConfessionsPage,
})

function ConfessionsPage() {
  const [tab, setTab] = useState<'field' | 'sent'>('field')
  const [confessionsList, setConfessionsList] = useState<ConfessionItem[]>([])
  const [currentRole, setCurrentRole] = useState<'Husband' | 'Wife' | null>(null)

  const [activeItem, setActiveItem] = useState<ConfessionItem | null>(null)
  const [unfoldedSentences, setUnfoldedSentences] = useState<string[]>([])
  const [streakCount, setStreakCount] = useState(3)

  // Local burst state for seal click
  const [burstState, setBlastState] = useState<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 })

  // Composer state
  const [showComposer, setShowComposer] = useState(false)
  const [newBody, setNewBody] = useState('')
  const [newTone, setNewTone] = useState<'sweet' | 'shy' | 'flirty' | 'vulnerable'>('sweet')
  const [newRevealAt, setNewRevealAt] = useState('')
  const [editingItem, setEditingItem] = useState<ConfessionItem | null>(null)

  useEffect(() => {
    fetch('/api/auth/get-session')
      .then((r) => r.json())
      .then((session) => {
        const role = session?.user?.role
        if (role === 'Husband' || role === 'Wife') setCurrentRole(role)
      })
      .catch(() => {})

    fetch(`/api/confessions?scope=${tab}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setConfessionsList(data)
      })
      .catch(() => {})
  }, [tab, currentRole])

  const handleItemClick = (e: React.MouseEvent, item: ConfessionItem) => {
    const isLocked = new Date(item.revealAt) > new Date()
    if (isLocked) return

    // Trigger local contained petal burst
    setBlastState({ active: true, x: e.clientX, y: e.clientY })
    setActiveItem(item)

    // Split sentences for unfold reveal
    const sentences = item.body.match(/[^.!?]+[.!?]+/g) || [item.body]
    setUnfoldedSentences([])

    sentences.forEach((sentence, idx) => {
      setTimeout(() => {
        setUnfoldedSentences((prev) => [...prev, sentence.trim()])
      }, 800 + idx * 1400)
    })

    // Mark opened server side
    if (!item.openedAt) {
      void apiRequest(`/api/confessions/${item.id}/open`, { method: 'PATCH' })
        .then(() => {
          setConfessionsList((prev) =>
            prev.map((c) => (c.id === item.id ? { ...c, openedAt: new Date().toISOString() } : c))
          )
          reportPersistenceSuccess('Confession opened')
        })
        .catch(reportPersistenceError)
    }
  }

  const handleCreateConfession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBody.trim()) return

    const payload = {
      body: newBody.trim(),
      toneTag: newTone,
      revealAt: newRevealAt ? new Date(newRevealAt).toISOString() : new Date().toISOString(),
    }

    try {
      const data = await apiRequest<ConfessionItem>('/api/confessions', {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem ? { ...payload, id: editingItem.id } : payload),
      })
      setConfessionsList((prev) => editingItem
        ? prev.map((item) => (item.id === data.id ? data : item))
        : [...prev, data].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '') || a.id.localeCompare(b.id)))
      reportPersistenceSuccess(editingItem ? 'Confession updated' : 'Confession sealed')
    } catch (error) {
      reportPersistenceError(error)
      return
    }

    setShowComposer(false)
    setNewBody('')
    setNewTone('sweet')
    setNewRevealAt('')
    setEditingItem(null)
  }

  const openEditor = (item: ConfessionItem) => {
    setEditingItem(item)
    setNewBody(item.body)
    setNewTone(item.toneTag)
    setNewRevealAt(item.revealAt ? new Date(item.revealAt).toISOString().slice(0, 16) : '')
    setShowComposer(true)
  }

  const handleDeleteConfession = async (item: ConfessionItem) => {
    if (!window.confirm('Delete this confession permanently?')) return

    try {
      await apiRequest(`/api/confessions?id=${encodeURIComponent(item.id)}`, { method: 'DELETE' })
      setConfessionsList((prev) => prev.filter((entry) => entry.id !== item.id))
      setActiveItem(null)
      reportPersistenceSuccess('Confession deleted')
    } catch (error) {
      reportPersistenceError(error)
    }
  }

  const closeComposer = () => {
    setShowComposer(false)
    setEditingItem(null)
    setNewBody('')
    setNewTone('sweet')
    setNewRevealAt('')
  }

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'shy':
        return '#E5B299'
      case 'flirty':
        return '#BC4F4F'
      case 'vulnerable':
        return '#5C3A47'
      default:
        return '#D87A80'
    }
  }

  // Calculate EXACT EQUAL DISTANCE (d = 175px) node-to-node along a serpentine S-curve
  const getNodePosition = (index: number) => {
    const row = Math.floor(index / 3)
    const isEvenRow = row % 2 === 0
    const colInRow = index % 3
    const actualCol = isEvenRow ? colInRow : 2 - colInRow

    const startX = 140
    const stepX = 220
    const startY = 80
    const stepY = 160

    const x = startX + actualCol * stepX + (isEvenRow ? 0 : 40)
    const y = startY + row * stepY + Math.sin(index * 1.8) * 20

    return { x, y }
  }

  const positions = confessionsList.map((_, i) => getNodePosition(i))

  return (
    <div
      style={{
        width: '100%',
        minHeight: 'calc(100vh - 72px)',
        backgroundColor: '#FCF5EE',
        backgroundImage: 'radial-gradient(#E8D5C8 1px, transparent 1px), linear-gradient(135deg, rgba(255, 206, 227, 0.24), transparent 42%)',
        backgroundSize: '28px 28px, 100% 100%',
        padding: '32px 24px 120px 24px',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {burstState.active && (
        <PetalBlastCanvas
          origin="click-point"
          clickX={burstState.x}
          clickY={burstState.y}
          density={14}
          contained
          maxTravelDistance={80}
          onComplete={() => setBlastState({ active: false, x: 0, y: 0 })}
        />
      )}

      {/* Header Bar with Tabs & Streak */}
      <div
        style={{
          maxWidth: '56rem',
          margin: '0 auto 20px auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ color: '#BC4F4F', fontSize: '11px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Our private constellation
            </span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '42px', lineHeight: 1.05, color: '#3D1A28', marginTop: '6px' }}>
              Confessions
            </h1>
            <p style={{ color: '#7D6670', fontSize: '14px', marginTop: '8px' }}>
              Little truths, sealed with love and waiting in the stars.
            </p>
          </div>
          <span style={{ color: '#D83B56', fontFamily: 'var(--font-handwriting)', fontSize: '20px' }}>
            still choosing you
          </span>
        </div>

        {/* Two-tab switch */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', background: '#FFF', padding: '4px', borderRadius: '9999px', border: '1px solid #E8D5C8', boxShadow: '0 8px 20px rgba(61, 26, 40, 0.06)' }}>
          <button
            onClick={() => setTab('field')}
            style={{
              padding: '8px 22px',
              borderRadius: '9999px',
              border: 'none',
              background: tab === 'field' ? '#BC4F4F' : 'transparent',
              color: tab === 'field' ? '#FFF' : '#3D1A28',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Field
          </button>
          <button
            onClick={() => setTab('sent')}
            style={{
              padding: '8px 22px',
              borderRadius: '9999px',
              border: 'none',
              background: tab === 'sent' ? '#BC4F4F' : 'transparent',
              color: tab === 'sent' ? '#FFF' : '#3D1A28',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Sent
          </button>
          </div>

          {/* Streak Counter */}
          {streakCount >= 2 && (
            <span style={{ fontSize: '13px', color: '#BC4F4F', fontWeight: 700 }}>
              {streakCount}-day streak
            </span>
          )}
        </div>
      </div>

      {/* Constellation Container */}
      <div
        style={{
          maxWidth: '56rem',
          minHeight: '620px',
          margin: '0 auto',
          position: 'relative',
        }}
      >
        {confessionsList.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '160px' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '22px', color: '#5C3A47' }}>
              "No confessions sealed yet..."
            </p>
            <p style={{ fontSize: '13px', color: '#888', marginTop: '6px' }}>
              Tap the button below to leave a secret confession for your partner
            </p>
          </div>
        ) : (
          <>
            {/* CURVY DOTTED CONNECTING SVG LINES BETWEEN NODES */}
            <svg
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            >
              {positions.map((pos, idx) => {
                if (idx === 0) return null
                const prev = positions[idx - 1]

                const cx1 = prev.x + (pos.x - prev.x) / 2
                const cy1 = prev.y - 30
                const cx2 = prev.x + (pos.x - prev.x) / 2
                const cy2 = pos.y + 30

                const pathD = `M ${prev.x + 36} ${prev.y + 36} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pos.x + 36} ${pos.y + 36}`

                return (
                  <path
                    key={idx}
                    d={pathD}
                    fill="none"
                    stroke="#BC4F4F"
                    strokeWidth="2.5"
                    strokeDasharray="6 6"
                    opacity="0.65"
                  />
                )
              })}
            </svg>

            {/* Numbered Nodes Featuring the S&M Monogram Logo Image (/sm-logo.png) */}
            {confessionsList.map((item, idx) => {
              const isLocked = new Date(item.revealAt) > new Date()
              const isOpened = !!item.openedAt
              const toneColor = getToneColor(item.toneTag)
              const pos = positions[idx] || { x: 100, y: 100 }

              return (
                <motion.div
                  key={item.id}
                  onClick={(e) => handleItemClick(e, item)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
                  transition={{
                    y: { duration: 3.5 + (idx % 3), repeat: Infinity, ease: 'easeInOut' },
                    duration: 0.4,
                  }}
                  whileHover={{ scale: 1.12, zIndex: 20 }}
                  style={{
                    position: 'absolute',
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: isLocked ? 'default' : 'pointer',
                    opacity: isLocked ? 0.6 : isOpened ? 0.85 : 1,
                    zIndex: 5,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: '#BC4F4F',
                      color: '#FFF',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      border: '2px solid white',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                      zIndex: 10,
                    }}
                  >
                    #{idx + 1}
                  </div>

                  <div
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '50%',
                      border: `3px solid ${toneColor}`,
                      boxShadow: isLocked ? 'none' : `0 0 20px ${toneColor}70, 0 8px 20px rgba(0,0,0,0.12)`,
                      position: 'relative',
                      overflow: 'hidden',
                      background: '#FFF',
                    }}
                  >
                    <img
                      src="/sm-logo.png"
                      alt={`S&M Node ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {isLocked && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(42, 18, 32, 0.45)',
                          backdropFilter: 'blur(2px)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFF',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        Locked
                      </div>
                    )}
                  </div>

                  <span style={{ fontSize: '11px', color: '#5C3A47', fontWeight: 700, marginTop: '6px' }}>
                    Confession #{item.confessionNumber || idx + 1}
                  </span>

                  {tab === 'sent' && currentRole === item.authorRole && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        aria-label={`Edit confession ${idx + 1}`}
                        onClick={() => openEditor(item)}
                        style={{ border: '1px solid #E8D5C8', borderRadius: '9999px', background: '#FFF', color: '#5C3A47', padding: '4px 9px', cursor: 'pointer', fontSize: '11px' }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete confession ${idx + 1}`}
                        onClick={() => void handleDeleteConfession(item)}
                        style={{ border: '1px solid #E8D5C8', borderRadius: '9999px', background: '#FFF', color: '#BC4F4F', padding: '4px 9px', cursor: 'pointer', fontSize: '11px' }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </>
        )}
      </div>

      {/* Floating Action Button */}
      <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 8500 }}>
        <button className="lux-button" onClick={() => { closeComposer(); setShowComposer(true) }}>
          + {tab === 'sent' ? 'New Confession' : 'Leave a Confession'}
        </button>
      </div>

      {/* Letter Unfold Reader Modal (Line-Aligned Text) */}
      <AnimatePresence>
        {activeItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9500,
              background: 'rgba(42, 18, 32, 0.65)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
            onClick={() => setActiveItem(null)}
          >
            <motion.div
              className="confession-reader"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '860px',
                maxHeight: 'calc(100vh - 48px)',
                overflowY: 'auto',
                borderRadius: '24px',
                background: '#FFFDF9',
                backgroundImage: 'linear-gradient(90deg, transparent 0, transparent 44px, rgba(216, 59, 86, 0.14) 45px, transparent 46px), linear-gradient(rgba(232, 213, 200, 0.55) 1px, transparent 1px)',
                backgroundSize: '100% 100%, 100% 32px',
                padding: '44px 72px 48px',
                border: '1px solid rgba(216, 59, 86, 0.28)',
                boxShadow: '0 28px 80px rgba(42, 18, 32, 0.34), 0 0 0 8px rgba(255, 255, 255, 0.12)',
                position: 'relative',
                minHeight: '280px',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '28px', paddingBottom: '18px', borderBottom: '1px solid rgba(216, 59, 86, 0.22)' }}>
                <div style={{ color: '#D83B56', fontSize: '11px', fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
                  A sealed little truth
                </div>
                <div style={{ color: '#9B707A', fontFamily: 'var(--font-handwriting)', fontSize: '18px', marginTop: '5px' }}>
                  for you, always
                </div>
              </div>

              <button
                onClick={() => setActiveItem(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#888',
                }}
              >
                ✕
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', paddingLeft: '12px' }}>
                {unfoldedSentences.map((sentence, idx) => (
                  <motion.p
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    style={{
                      fontFamily: 'var(--font-handwriting)',
                      fontSize: 'clamp(20px, 2.2vw, 26px)',
                      lineHeight: '32px',
                      color: '#3D1A28',
                      margin: 0,
                    }}
                  >
                    {sentence}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Composer Modal */}
      <AnimatePresence>
        {showComposer && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9500,
              background: 'rgba(42, 18, 32, 0.65)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
            onClick={closeComposer}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '480px',
                borderRadius: '32px',
                background: 'rgba(252, 245, 238, 0.95)',
                border: '1px solid #E8D5C8',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', color: '#3D1A28', fontSize: '24px' }}>
                  {editingItem ? 'Edit Your Confession' : 'Write a Sealed Confession'}
                </h3>
                <button type="button" onClick={closeComposer} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateConfession} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <textarea
                  required
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  rows={4}
                  placeholder="write what you're too shy to say out loud..."
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    border: '1px solid #E8D5C8',
                    fontFamily: 'var(--font-handwriting)',
                    fontSize: '20px',
                    outline: 'none',
                  }}
                />

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#3D1A28', marginBottom: '6px', display: 'block' }}>Tone Tag</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { tag: 'sweet', label: 'sweet' },
                      { tag: 'shy', label: 'shy' },
                      { tag: 'flirty', label: 'flirty' },
                      { tag: 'vulnerable', label: 'vulnerable' },
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.tag}
                        onClick={() => setNewTone(item.tag as any)}
                        style={{
                          padding: '6px 16px',
                          borderRadius: '9999px',
                          border: newTone === item.tag ? `2px solid ${getToneColor(item.tag)}` : '1px solid #E8D5C8',
                          background: newTone === item.tag ? getToneColor(item.tag) : '#FFF',
                          color: newTone === item.tag ? '#FFF' : '#3D1A28',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#3D1A28', marginBottom: '4px', display: 'block' }}>Reveal Date (optional)</label>
                  <input
                    type="datetime-local"
                    value={newRevealAt}
                    onChange={(e) => setNewRevealAt(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #E8D5C8', width: '100%' }}
                  />
                </div>

                <button className="lux-button" type="submit" style={{ marginTop: '8px', padding: '14px' }}>
                  Seal & Send Confession
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
