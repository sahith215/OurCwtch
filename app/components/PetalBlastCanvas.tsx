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

  // Crazy explosion default
  density = 450,

  palette = [
    '#FFCEE3',
    '#F75270',
    '#D83B56',
    '#FCF5EE',
    '#FFE4EF',
    '#FF8FB1',
    '#FFB6C9',
  ],

  contained = false,

  // Allows particles to travel much farther
  maxTravelDistance = 500,

  onThinning,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

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

    const startX =
      origin === 'click-point'
        ? (clickX ?? window.innerWidth / 2)
        : window.innerWidth / 2

    const startY =
      origin === 'click-point'
        ? (clickY ?? window.innerHeight / 2)
        : window.innerHeight / 2

    const particles: Particle[] = []

    // Massive number of particles
    const particleCount = Math.min(density, 600)

    for (let i = 0; i < particleCount; i++) {
      // Full 360-degree explosion
      const angle = Math.random() * Math.PI * 2

      // Much stronger explosion speed
      const speed = contained
        ? Math.random() * 8 + 3
        : Math.random() * 18 + 5

      // 95% petals
      const randomType = Math.random()

      const particleType: 'petal' | 'heart' | 'tulip' =
        randomType < 0.95
          ? 'petal'
          : randomType < 0.98
            ? 'heart'
            : 'tulip'

      particles.push({
        x: startX,
        y: startY,

        startX,
        startY,

        // Strong horizontal and vertical blast
        vx: Math.cos(angle) * speed,
        vy:
          Math.sin(angle) * speed -
          (contained ? 1 : Math.random() * 5 + 2),

        // Larger flower petals
        size: Math.random() * 18 + 12,

        rotation: Math.random() * Math.PI * 2,

        // Faster rotation
        vRot: (Math.random() - 0.5) * 0.22,

        opacity: 1,

        // Slower fading = longer explosion
        decay: contained
          ? Math.random() * 0.012 + 0.006
          : Math.random() * 0.008 + 0.003,

        color: palette[
          Math.floor(Math.random() * palette.length)
        ],

        type: particleType,

        flutterPhase: Math.random() * Math.PI * 2,

        // More natural floating movement
        flutterSpeed: Math.random() * 0.18 + 0.08,
      })
    }

    let animationFrameId: number

    let thinningTriggered = false

    const totalCount = particles.length

    const drawHeart = (
      ctx: CanvasRenderingContext2D,
      size: number
    ) => {
      ctx.beginPath()

      const topCurveHeight = size * 0.3

      ctx.moveTo(0, topCurveHeight)

      ctx.bezierCurveTo(
        0,
        0,
        -size / 2,
        0,
        -size / 2,
        topCurveHeight
      )

      ctx.bezierCurveTo(
        -size / 2,
        (size + topCurveHeight) / 2,
        0,
        size,
        0,
        size
      )

      ctx.bezierCurveTo(
        0,
        size,
        size / 2,
        (size + topCurveHeight) / 2,
        size / 2,
        topCurveHeight
      )

      ctx.bezierCurveTo(
        size / 2,
        0,
        0,
        0,
        0,
        topCurveHeight
      )

      ctx.fill()
    }

    const drawPetal = (
      ctx: CanvasRenderingContext2D,
      size: number
    ) => {
      ctx.beginPath()

      // Slightly wider, more visible petal
      ctx.ellipse(
        0,
        0,
        size * 0.55,
        size,
        0,
        0,
        Math.PI * 2
      )

      ctx.fill()
    }

    const drawTulip = (
      ctx: CanvasRenderingContext2D,
      size: number
    ) => {
      ctx.beginPath()

      ctx.arc(
        0,
        0,
        size / 2,
        0,
        Math.PI
      )

      ctx.lineTo(size / 2, -size / 2)
      ctx.lineTo(0, -size / 4)
      ctx.lineTo(-size / 2, -size / 2)

      ctx.closePath()
      ctx.fill()
    }

    const render = () => {
      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      )

      let activeCount = 0

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        if (p.opacity <= 0) continue

        activeCount++

        // Move outward with flutter
        p.x +=
          p.vx +
          Math.sin(p.flutterPhase) * 1.2

        p.y +=
          p.vy +
          Math.cos(p.flutterPhase * 0.7) * 0.4

        // Gravity
        p.vy += contained ? 0.06 : 0.12

        // Slight air resistance
        p.vx *= 0.985

        // Rotation
        p.rotation += p.vRot

        // Flutter animation
        p.flutterPhase += p.flutterSpeed

        // Fade
        p.opacity -= p.decay

        // Limit travel distance only when contained
        if (contained) {
          const dist = Math.hypot(
            p.x - p.startX,
            p.y - p.startY
          )

          if (dist > maxTravelDistance) {
            p.opacity -= 0.04
          }
        }

        ctx.save()

        ctx.translate(
          p.x,
          p.y
        )

        ctx.rotate(p.rotation)

        ctx.fillStyle = p.color

        ctx.globalAlpha = Math.max(
          0,
          p.opacity
        )

        if (p.type === 'heart') {
          drawHeart(ctx, p.size)
        } else if (p.type === 'tulip') {
          drawTulip(ctx, p.size)
        } else {
          drawPetal(ctx, p.size)
        }

        ctx.restore()
      }

      // Trigger thinning callback when only 40% remain
      if (
        !thinningTriggered &&
        activeCount <= totalCount * 0.4
      ) {
        thinningTriggered = true

        if (onThinning) {
          onThinning()
        }
      }

      if (activeCount > 0) {
        animationFrameId =
          requestAnimationFrame(render)
      } else {
        if (onComplete) {
          onComplete()
        }
      }
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [
    origin,
    clickX,
    clickY,
    density,
    contained,
    maxTravelDistance,
    onThinning,
    onComplete,
    palette,
  ])

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