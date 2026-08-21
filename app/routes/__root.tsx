import { createRootRoute, Outlet, ScrollRestoration } from '@tanstack/react-router'
import React from 'react'
import { StarCanvas } from '../components/StarCanvas'
import { PetalCanvas } from '../components/PetalCanvas'
import { VinylPlayerProvider } from '../components/VinylPlayer'
import { LoveNoteDrawer } from '../components/LoveNoteDrawer'
import '../styles/globals.css'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <VinylPlayerProvider>
      <StarCanvas variant="ambient" />
      <PetalCanvas />
      <LoveNoteDrawer />
      <Outlet />
      <ScrollRestoration />
    </VinylPlayerProvider>
  )
}
