import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SoundOfUsCard } from '../components/SoundOfUsCard'
import { HillDivider } from '../components/HillDivider'
import { apiRequest, reportPersistenceError, reportPersistenceSuccess } from '../lib/persistence'

interface ProfileCardData {
  role: 'Husband' | 'Wife'
  nicknameGivenByPartner: string
  tagline: string
  favSong: string
  comfortFood: string
  loveLanguage: string
  quirk: string
  obsession: string
  photoUrl: string
}

export const Route = createFileRoute('/_main/about')({
  component: AboutPage,
})

function AboutPage() {
  const [currentUserRole, setCurrentUserRole] = useState<'Husband' | 'Wife'>('Husband')

  const [husbandProfile, setHusbandProfile] = useState<ProfileCardData>({
    role: 'Husband',
    nicknameGivenByPartner: '', // Set by Wife during onboarding
    tagline: '',
    favSong: '',
    comfortFood: '',
    loveLanguage: '',
    quirk: '',
    obsession: '',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  })

  const [wifeProfile, setWifeProfile] = useState<ProfileCardData>({
    role: 'Wife',
    nicknameGivenByPartner: '', // Set by Husband during onboarding
    tagline: '',
    favSong: '',
    comfortFood: '',
    loveLanguage: '',
    quirk: '',
    obsession: '',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  })

  // Secret line states
  const [revealedLine, setRevealedLine] = useState<{ role: 'Husband' | 'Wife'; text: string } | null>(null)
  const [showAddLineModal, setShowAddLineModal] = useState<'Husband' | 'Wife' | null>(null)
  const [newLineText, setNewLineText] = useState('')

  // This or That states
  const questions = [
    { key: 'morning', label: 'Rhythm', optionA: 'Morning Person', optionB: 'Night Owl' },
    { key: 'food', label: 'Cravings', optionA: 'Sweet Tooth', optionB: 'Savory Snacks' },
    { key: 'vacation', label: 'Escapes', optionA: 'Beach Sunset', optionB: 'Mountain Cabin' },
  ]
  const [thisOrThatAnswers, setThisOrThatAnswers] = useState<Record<string, { Husband?: string; Wife?: string }>>({})

  // Fun facts
  const [funFactsList, setFunFactsList] = useState<string[]>([])
  const [newFactText, setNewFactText] = useState('')
  const [showAddFactModal, setShowAddFactModal] = useState(false)

  // Edit profile state
  const [editProfileModal, setEditProfileModal] = useState<ProfileCardData | null>(null)

  useEffect(() => {
    // Fetch partner-assigned nicknames and profiles
    fetch('/api/shared-meta/nickname').then(r => r.json()).then(d => {
      if (d.husband_nickname) setHusbandProfile(prev => ({ ...prev, nicknameGivenByPartner: d.husband_nickname }))
      if (d.wife_nickname) setWifeProfile(prev => ({ ...prev, nicknameGivenByPartner: d.wife_nickname }))
    }).catch(() => {})

    fetch('/api/profile-extras/Husband').then(r => r.json()).then(d => { if (d && Object.keys(d).length > 0) setHusbandProfile(prev => ({ ...prev, ...d })) }).catch(() => {})
    fetch('/api/profile-extras/Wife').then(r => r.json()).then(d => { if (d && Object.keys(d).length > 0) setWifeProfile(prev => ({ ...prev, ...d })) }).catch(() => {})
    fetch('/api/fun-facts').then(r => r.json()).then(d => { if (Array.isArray(d)) setFunFactsList(d.map((f: any) => f.body)) }).catch(() => {})
    fetch('/api/this-or-that').then(r => r.json()).then(d => { if (d && typeof d === 'object') setThisOrThatAnswers(d) }).catch(() => {})
  }, [])

  const handlePhotoLongPress = async (role: 'Husband' | 'Wife') => {
    try {
      const res = await fetch(`/api/private-love-lines?role=${role}`)
      const data = await res.json()
      if (data.lineText) {
        setRevealedLine({ role, text: data.lineText })
        setTimeout(() => setRevealedLine(null), 6000)
      }
    } catch {
      // Fallback
    }
  }

  const handleAddLineSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLineText.trim() || !showAddLineModal) return
    try {
      await apiRequest('/api/private-love-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: showAddLineModal, lineText: newLineText.trim() }),
      })
      reportPersistenceSuccess('Love line saved')
    } catch (error) {
      reportPersistenceError(error)
      return
    }
    setShowAddLineModal(null)
    setNewLineText('')
  }

  const handleThisOrThatChoice = async (questionKey: string, choice: string) => {
    try {
      await apiRequest('/api/this-or-that', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionKey, answer: choice }),
      })
      setThisOrThatAnswers((prev) => ({
        ...prev,
        [questionKey]: { ...prev[questionKey], [currentUserRole]: choice },
      }))
      reportPersistenceSuccess('Answer saved')
    } catch (error) {
      reportPersistenceError(error)
    }
  }

  const handleAddFactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFactText.trim()) return
    try {
      await apiRequest('/api/fun-facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newFactText.trim() }),
      })
      setFunFactsList((prev) => [...prev, newFactText.trim()])
      reportPersistenceSuccess('Fun fact saved')
    } catch (error) {
      reportPersistenceError(error)
      return
    }
    setShowAddFactModal(false)
    setNewFactText('')
  }

  const handleSaveProfile = async () => {
    if (!editProfileModal) return
    try {
      await apiRequest(`/api/profile-extras/${editProfileModal.role}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProfileModal),
      })
      if (editProfileModal.role === 'Husband') setHusbandProfile(editProfileModal)
      else setWifeProfile(editProfileModal)
      reportPersistenceSuccess('Profile saved')
    } catch (error) {
      reportPersistenceError(error)
      return
    }

    setEditProfileModal(null)
  }

  const renderProfileCard = (profile: ProfileCardData) => {
    const isOwn = currentUserRole === profile.role
    const isShowingLine = revealedLine?.role === profile.role
    const displayName = profile.nicknameGivenByPartner || (profile.role === 'Husband' ? "Husband" : "Wife")

    return (
      <div
        className="glass"
        style={{
          borderRadius: '32px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {isOwn && (
          <button
            onClick={() => setEditProfileModal({ ...profile })}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              color: '#F75270',
            }}
          >
            ✏️
          </button>
        )}

        {/* Circular Photo */}
        <div
          onMouseDown={() => handlePhotoLongPress(profile.role)}
          onTouchStart={() => handlePhotoLongPress(profile.role)}
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            border: '3px solid #FFCEE3',
            boxShadow: '0 8px 24px rgba(247, 82, 112, 0.25)',
            overflow: 'hidden',
            cursor: 'pointer',
            marginBottom: '16px',
            userSelect: 'none',
          }}
        >
          <img src={profile.photoUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: '#3D1A28' }}>{displayName}</h3>
        {profile.tagline && (
          <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '14px', color: '#F75270', marginTop: '4px' }}>
            "{profile.tagline}"
          </p>
        )}

        {/* Hidden Love Line Reveal */}
        <AnimatePresence>
          {isShowingLine && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginTop: '12px',
                padding: '8px 14px',
                borderRadius: '16px',
                background: '#FFCEE3',
                fontFamily: 'var(--font-handwriting)',
                fontSize: '18px',
                color: '#D83B56',
              }}
            >
              "{revealedLine.text}"
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chips for Favorites */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '20px' }}>
          {[
            profile.favSong && { label: 'Song: ' + profile.favSong },
            profile.comfortFood && { label: 'Food: ' + profile.comfortFood },
            profile.loveLanguage && { label: 'Love Language: ' + profile.loveLanguage },
            profile.quirk && { label: 'Quirk: ' + profile.quirk },
          ]
            .filter(Boolean)
            .map((chip: any, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  background: idx % 2 === 0 ? '#FFCEE3' : '#FFF2EB',
                  color: '#3D1A28',
                }}
              >
                {chip.label}
              </span>
            ))}
        </div>

        {/* Leave a line affordance for other partner */}
        {!isOwn && (
          <button
            onClick={() => setShowAddLineModal(profile.role)}
            style={{
              marginTop: '16px',
              fontSize: '12px',
              color: '#F75270',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'underline',
            }}
          >
            + leave a secret line for {displayName}
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '40px 24px 96px 24px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
      {/* 1. Split Hero Dual Profile Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
        {renderProfileCard(husbandProfile)}
        {renderProfileCard(wifeProfile)}
      </div>

      <HillDivider />

      {/* 2. This or That Strip */}
      <div className="glass" style={{ borderRadius: '32px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', color: '#F75270', textTransform: 'uppercase' }}>
            THIS OR THAT
          </span>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: '#3D1A28', marginTop: '4px' }}>
            Our Chemistry & Contrasts
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {questions.map((q) => {
            const husbandChoice = thisOrThatAnswers[q.key]?.Husband
            const wifeChoice = thisOrThatAnswers[q.key]?.Wife

            return (
              <div key={q.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>
                  {q.label}
                </span>

                {/* 2-Color Split Bar */}
                <div
                  style={{
                    height: '44px',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    display: 'flex',
                    position: 'relative',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                >
                  <div
                    onClick={() => handleThisOrThatChoice(q.key, q.optionA)}
                    style={{
                      flex: 1,
                      background: '#FFCEE3',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '20px',
                      color: '#3D1A28',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    {q.optionA}
                  </div>
                  <div
                    onClick={() => handleThisOrThatChoice(q.key, q.optionB)}
                    style={{
                      flex: 1,
                      background: '#F75270',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '20px',
                      color: '#FFF',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    {q.optionB}
                  </div>

                  {/* Avatar Markers */}
                  {husbandChoice && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: husbandChoice === q.optionA ? '20%' : '70%',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#3D1A28',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 800,
                        border: '2px solid white',
                        transition: 'left 0.3s ease',
                      }}
                    >
                      H
                    </div>
                  )}

                  {wifeChoice && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: wifeChoice === q.optionA ? '25%' : '75%',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#D83B56',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 800,
                        border: '2px solid white',
                        transition: 'left 0.3s ease',
                      }}
                    >
                      W
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. Our Soundtrack Section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', color: '#F75270', textTransform: 'uppercase' }}>
            OUR SOUNDTRACK
          </span>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: '#3D1A28', marginTop: '4px' }}>
            The Songs That Define Us
          </h3>
        </div>

        <SoundOfUsCard variant="compact" />
      </div>

      {/* 4. Fun Facts Ticker */}
      {funFactsList.length > 0 && (
        <div style={{ overflow: 'hidden', width: '100%', position: 'relative', padding: '16px 0' }}>
          <div className="animate-marquee" style={{ gap: '16px' }}>
            {funFactsList.concat(funFactsList).map((fact, idx) => (
              <span
                key={idx}
                style={{
                  padding: '10px 20px',
                  borderRadius: '9999px',
                  background: '#FFF',
                  border: '1px solid #FFCEE3',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#3D1A28',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                }}
              >
                💡 {fact}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => setShowAddFactModal(true)}
          style={{ background: 'none', border: 'none', color: '#F75270', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
        >
          + Add a Fun Fact
        </button>
      </div>

      {/* Leave Line Modal */}
      <AnimatePresence>
        {showAddLineModal && (
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
            onClick={() => setShowAddLineModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '400px',
                borderRadius: '24px',
                background: '#FFF',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <h4 style={{ fontFamily: 'var(--font-serif)', color: '#3D1A28', fontSize: '20px' }}>
                Leave a secret line for {showAddLineModal === 'Husband' ? husbandProfile.nicknameGivenByPartner || 'Husband' : wifeProfile.nicknameGivenByPartner || 'Wife'}
              </h4>
              <form onSubmit={handleAddLineSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  required
                  value={newLineText}
                  onChange={(e) => setNewLineText(e.target.value)}
                  placeholder="e.g. He always makes me tea when I am tired"
                  style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #FFCEE3', fontFamily: 'var(--font-handwriting)', fontSize: '18px' }}
                />
                <button className="lux-button" type="submit">
                  Save Line
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Fact Modal */}
      <AnimatePresence>
        {showAddFactModal && (
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
            onClick={() => setShowAddFactModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '400px',
                borderRadius: '24px',
                background: '#FFF',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <h4 style={{ fontFamily: 'var(--font-serif)', color: '#3D1A28', fontSize: '20px' }}>
                Add a Fun Fact
              </h4>
              <form onSubmit={handleAddFactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  required
                  value={newFactText}
                  onChange={(e) => setNewFactText(e.target.value)}
                  placeholder="e.g. First trip together was to Paris"
                  style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #FFCEE3' }}
                />
                <button className="lux-button" type="submit">
                  Add Fact
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editProfileModal && (
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
            onClick={() => setEditProfileModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '440px',
                borderRadius: '28px',
                background: '#FFF',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <h4 style={{ fontFamily: 'var(--font-serif)', color: '#3D1A28', fontSize: '20px' }}>
                Edit {editProfileModal.role} Profile
              </h4>

              <input
                type="text"
                value={editProfileModal.tagline}
                onChange={(e) => setEditProfileModal({ ...editProfileModal, tagline: e.target.value })}
                placeholder="Tagline"
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #FFCEE3' }}
              />
              <input
                type="text"
                value={editProfileModal.favSong}
                onChange={(e) => setEditProfileModal({ ...editProfileModal, favSong: e.target.value })}
                placeholder="Favorite Song"
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #FFCEE3' }}
              />
              <input
                type="text"
                value={editProfileModal.comfortFood}
                onChange={(e) => setEditProfileModal({ ...editProfileModal, comfortFood: e.target.value })}
                placeholder="Comfort Food"
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #FFCEE3' }}
              />
              <input
                type="text"
                value={editProfileModal.loveLanguage}
                onChange={(e) => setEditProfileModal({ ...editProfileModal, loveLanguage: e.target.value })}
                placeholder="Love Language"
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #FFCEE3' }}
              />
              <input
                type="text"
                value={editProfileModal.quirk}
                onChange={(e) => setEditProfileModal({ ...editProfileModal, quirk: e.target.value })}
                placeholder="Quirk"
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #FFCEE3' }}
              />
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1.5px dashed #FFCEE3',
                    background: editProfileModal.photoUrl ? 'rgba(255, 206, 227, 0.15)' : '#FFF',
                    cursor: 'pointer',
                  }}
                >
                  {editProfileModal.photoUrl ? (
                    <>
                      <img src={editProfileModal.photoUrl} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      <span style={{ fontSize: '13px', color: '#3D1A28', fontWeight: 600 }}>Photo updated</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '13px', color: '#888' }}>Change profile photo</span>
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
                      reader.onload = (ev) => setEditProfileModal({ ...editProfileModal, photoUrl: ev.target?.result as string })
                      reader.readAsDataURL(file)
                    }}
                  />
                </label>
              </div>

              <button className="lux-button" onClick={handleSaveProfile} style={{ marginTop: '8px' }}>
                Save Profile
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
