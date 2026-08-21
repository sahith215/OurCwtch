import React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { motion } from 'framer-motion'

const navItems = [
  { label: 'Home', to: '/home' },
  { label: 'Our Meets', to: '/meets' },
  { label: 'Confessions', to: '/confessions' },
  { label: 'Us', to: '/us' },
  { label: 'About', to: '/about' },
]

export const Navbar: React.FC = () => {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 8000,
        width: '100%',
        height: '72px',
        background: 'linear-gradient(to right, #FFF2EB, #FFFFFF, #FFE4EF)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 206, 227, 0.6)',
      }}
    >
      <div
        style={{
          maxWidth: '64rem', // max-w-5xl
          margin: '0 auto',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        <Link
          to="/home"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontFamily: 'var(--font-serif)',
            fontSize: '22px',
            fontStyle: 'italic',
            fontWeight: 700,
            color: '#D83B56',
            textDecoration: 'none',
          }}
        >
          <img
            src="/sm-logo.png"
            alt="OurCwtch Logo"
            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #FFCEE3' }}
          />
          <span>OurCwtch</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {navItems.map((item) => {
            const isActive = currentPath === item.to

            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  position: 'relative',
                  padding: '8px 0',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                  fontSize: '15px',
                  color: '#3D1A28',
                  opacity: isActive ? 1 : 0.9,
                  textDecoration: 'none',
                  transition: 'opacity 0.2s ease',
                }}
              >
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="navActive"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      backgroundColor: '#D83B56',
                      boxShadow: '0 0 12px rgba(216, 59, 86, 0.35)',
                      borderRadius: '2px',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
