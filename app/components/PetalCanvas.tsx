import React, { useEffect, useRef } from 'react'

export const PetalCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const petalCount = 15
    const petals = Array.from({ length: petalCount }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 8 + 4,
      vy: Math.random() * 0.8 + 0.3,
      vx: Math.random() * 0.4 - 0.2,
      opacity: Math.random() * 0.35 + 0.15,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.02,
      color: ['#FFCEE3', '#F75270', '#FFE4EF'][Math.floor(Math.random() * 3)],
    }))

    let animId: number

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      petals.forEach((p) => {
        p.y += p.vy
        p.x += p.vx
        p.rotation += p.vRot

        if (p.y > canvas.height + 20) {
          p.y = -20
          p.x = Math.random() * canvas.width
        }
        if (p.x > canvas.width + 20) p.x = -20
        if (p.x < -20) p.x = canvas.width + 20

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.opacity
        ctx.beginPath()
        ctx.ellipse(0, 0, p.size / 2, p.size, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      animId = requestAnimationFrame(render)
    }

    render()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    />
  )
}
