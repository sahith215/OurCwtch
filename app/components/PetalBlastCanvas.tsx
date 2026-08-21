import React, { useEffect, useRef } from 'react'

interface PetalBlastCanvasProps {
  origin: 'click-point' | 'center-radiating'
  clickX?: number
  clickY?: number
  density: number
  palette?: string[]
  contained?: boolean
  maxTravelDistance?: number
  onThinning?: () => void
  onComplete?: () => void
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  vRot: number
  opacity: number
  decay: number
  color: string
  type: 'petal' | 'heart' | 'tulip'
  startX: number
  startY: number
  flutterPhase: number
  flutterSpeed: number
}

export const PetalBlastCanvas: React.FC<PetalBlastCanvasProps> = ({
  origin,
  clickX,
  clickY,
  density,
  palette = ['#FFCEE3', '#F75270', '#D83B56', '#FCF5EE', '#FFE4EF'],
  contained = false,
  maxTravelDistance = 120,
  onThinning,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      if (onThinning) onThinning()
      if (onComplete) onComplete()
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const startX = origin === 'click-point' ? (clickX ?? window.innerWidth / 2) : window.innerWidth / 2
    const startY = origin === 'click-point' ? (clickY ?? window.innerHeight / 2) : window.innerHeight / 2

    const particles: Particle[] = []
    const particleCount = density

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = contained ? Math.random() * 3 + 1 : Math.random() * 8 + 2
      const particleType: 'petal' | 'heart' | 'tulip' = Math.random() < 0.6 ? 'petal' : Math.random() < 0.85 ? 'heart' : 'tulip'

      particles.push({
        x: startX,
        y: startY,
        startX,
        startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (contained ? 0.5 : 2),
        size: Math.random() * 10 + 8,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.1,
        opacity: 1,
        decay: contained ? Math.random() * 0.025 + 0.015 : Math.random() * 0.015 + 0.008,
        color: palette[Math.floor(Math.random() * palette.length)],
        type: particleType,
        flutterPhase: Math.random() * Math.PI * 2,
        flutterSpeed: Math.random() * 0.1 + 0.05,
      })
    }

    let animationFrameId: number
    let thinningTriggered = false
    const totalCount = particles.length

    const drawHeart = (ctx: CanvasRenderingContext2D, size: number) => {
      ctx.beginPath()
      const topCurveHeight = size * 0.3
      ctx.moveTo(0, topCurveHeight)
      ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight)
      ctx.bezierCurveTo(-size / 2, (size + topCurveHeight) / 2, 0, size, 0, size)
      ctx.bezierCurveTo(0, size, size / 2, (size + topCurveHeight) / 2, size / 2, topCurveHeight)
      ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight)
      ctx.fill()
    }

    const drawPetal = (ctx: CanvasRenderingContext2D, size: number) => {
      ctx.beginPath()
      ctx.ellipse(0, 0, size / 2, size, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    const drawTulip = (ctx: CanvasRenderingContext2D, size: number) => {
      ctx.beginPath()
      ctx.arc(0, 0, size / 2, 0, Math.PI)
      ctx.lineTo(size / 2, -size / 2)
      ctx.lineTo(0, -size / 4)
      ctx.lineTo(-size / 2, -size / 2)
      ctx.closePath()
      ctx.fill()
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      let activeCount = 0

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        if (p.opacity <= 0) continue
        activeCount++

        p.x += p.vx + Math.sin(p.flutterPhase) * 0.5
        p.y += p.vy
        p.vy += contained ? 0.08 : 0.15
        p.vx *= 0.98
        p.rotation += p.vRot
        p.flutterPhase += p.flutterSpeed
        p.opacity -= p.decay

        if (contained) {
          const dist = Math.hypot(p.x - p.startX, p.y - p.startY)
          if (dist > maxTravelDistance) {
            p.opacity -= 0.05
          }
        }

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0, p.opacity)

        if (p.type === 'heart') {
          drawHeart(ctx, p.size)
        } else if (p.type === 'tulip') {
          drawTulip(ctx, p.size)
        } else {
          drawPetal(ctx, p.size)
        }

        ctx.restore()
      }

      if (!thinningTriggered && activeCount <= totalCount * 0.4) {
        thinningTriggered = true
        if (onThinning) onThinning()
      }

      if (activeCount > 0) {
        animationFrameId = requestAnimationFrame(render)
      } else {
        if (onComplete) onComplete()
      }
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [origin, clickX, clickY, density, contained, maxTravelDistance, onThinning, onComplete, palette])

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
        zIndex: 9999,
      }}
    />
  )
}
