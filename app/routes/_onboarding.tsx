import { createFileRoute, Outlet } from '@tanstack/react-router'
import { PetalCanvas } from '../components/PetalCanvas'

export const Route = createFileRoute('/_onboarding')({
  component: OnboardingLayout,
})

function OnboardingLayout() {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'linear-gradient(135deg, #FCF5EE 0%, #FFE4EF 50%, #FFCEE3 100%)',
      }}
    >
      <PetalCanvas />
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          borderRadius: '32px',
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 206, 227, 0.8)',
          boxShadow: '0 20px 50px rgba(61, 26, 40, 0.12)',
          padding: '36px',
          zIndex: 10,
        }}
      >
        <Outlet />
      </div>
    </div>
  )
}
