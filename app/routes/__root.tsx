import { createRootRoute, Navigate, Outlet } from '@tanstack/react-router'
import React, { useEffect, useState } from 'react'
import { StarCanvas } from '../components/StarCanvas'
import { PetalCanvas } from '../components/PetalCanvas'
import { VinylPlayerProvider } from '../components/VinylPlayer'
import { LoveNoteDrawer } from '../components/LoveNoteDrawer'
import '../styles/globals.css'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => <Navigate to="/" replace />,
})

function RootComponent() {
  const [persistenceMessage, setPersistenceMessage] = useState<string | null>(null)

  useEffect(() => {
    const handleError = (event: Event) => {
      setPersistenceMessage((event as CustomEvent<string>).detail)
    }
    const handleSuccess = (event: Event) => {
      setPersistenceMessage((event as CustomEvent<string>).detail)
      window.setTimeout(() => setPersistenceMessage(null), 1800)
    }
    window.addEventListener('persistence-error', handleError)
    window.addEventListener('persistence-success', handleSuccess)
    return () => {
      window.removeEventListener('persistence-error', handleError)
      window.removeEventListener('persistence-success', handleSuccess)
    }
  }, [])

  return (
    <VinylPlayerProvider>
      <StarCanvas variant="ambient" />
      <PetalCanvas />
      <LoveNoteDrawer />
      {persistenceMessage && (
        <div
          role="status"
          style={{
            position: 'fixed',
            right: '24px',
            bottom: '88px',
            zIndex: 10000,
            maxWidth: 'min(360px, calc(100vw - 48px))',
            padding: '12px 16px',
            borderRadius: '12px',
            background: '#3D1A28',
            color: '#FCF5EE',
            boxShadow: '0 8px 24px rgba(61, 26, 40, 0.24)',
            fontSize: '13px',
          }}
        >
          {persistenceMessage}
        </div>
      )}
      <Outlet />
    </VinylPlayerProvider>
  )
}
