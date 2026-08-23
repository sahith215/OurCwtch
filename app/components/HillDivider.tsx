import React from 'react'

export const HillDivider: React.FC = () => {
  return (
    <div
      style={{
        width: '100vw',
        height: '80px',
        position: 'relative',

        // Force full viewport width
        marginLeft: 'calc(50% - 50vw)',
        marginRight: 'calc(50% - 50vw)',

        marginTop: '32px',
        marginBottom: '32px',

        overflow: 'visible',
        padding: 0,
      }}
    >
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          display: 'block',
          width: '100vw',
          height: '80px',
          margin: 0,
          padding: 0,
        }}
      >
        {/* Layer 1 - Muted Plum */}
        <path
          d="M0 60 Q300 20 600 70 T1200 40 L1200 120 L0 120 Z"
          fill="#2A1220"
          opacity="0.15"
        />

        {/* Layer 2 - Rose */}
        <path
          d="M0 75 Q400 40 800 85 T1200 65 L1200 120 L0 120 Z"
          fill="#F75270"
          opacity="0.25"
        />

        {/* Layer 3 - Blush Ground */}
        <path
          d="M0 90 Q350 60 700 95 T1200 80 L1200 120 L0 120 Z"
          fill="#FFCEE3"
          opacity="0.5"
        />
      </svg>
    </div>
  )
}