import React, { useEffect, useRef } from 'react'

interface StarCanvasProps {
  variant?: 'gate' | 'ambient'
}

export const StarCanvas: React.FC<StarCanvasProps> = ({ variant = 'ambient' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const isGate = variant === 'gate'
    const starCount = isGate ? 35 : 20

    const stars = Array.from({ length: starCount }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.005,
      dir: Math.random() < 0.5 ? 1 : -1,
    }))

    // 4 drifting glow lines for gate
    const glowThreads = isGate
      ? [
          { y: canvas.height * 0.25, amplitude: 30, speed: 0.001, color: 'rgba(247, 82, 112, 0.12)' },
          { y: canvas.height * 0.45, amplitude: 45, speed: 0.0015, color: 'rgba(255, 206, 227, 0.1)' },
          { y: canvas.height * 0.65, amplitude: 25, speed: 0.0008, color: 'rgba(216, 59, 86, 0.08)' },
          { y: canvas.height * 0.8, amplitude: 35, speed: 0.0012, color: 'rgba(247, 82, 112, 0.15)' },
        ]
      : []

    let shootingStar: { x: number; y: number; vx: number; vy: number; len: number; alpha: number } | null = null

    const spawnShootingStar = () => {
      if (!isGate) return
      if (Math.random() < 0.005 && !shootingStar) {
        shootingStar = {
          x: Math.random() * canvas.width * 0.8,
          y: Math.random() * canvas.height * 0.4,
          vx: Math.random() * 8 + 6,
          vy: Math.random() * 4 + 3,
          len: Math.random() * 80 + 40,
          alpha: 1,
        }
      }
    }

    let animId: number
    let time = 0

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 1

      // Draw background gradient if gate
      if (isGate) {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
        grad.addColorStop(0, '#0B0710')
        grad.addColorStop(1, '#2A1220')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw glow threads
        glowThreads.forEach((thread) => {
          ctx.beginPath()
          ctx.moveTo(0, thread.y)
          for (let x = 0; x < canvas.width; x += 10) {
            const y = thread.y + Math.sin(x * 0.005 + time * thread.speed) * thread.amplitude
            ctx.lineTo(x, y)
          }
          ctx.strokeStyle = thread.color
          ctx.lineWidth = 3
          ctx.stroke()
        })
      }

      // Draw stars
      stars.forEach((star) => {
        star.alpha += star.speed * star.dir
        if (star.alpha >= 1) {
          star.alpha = 1
          star.dir = -1
        } else if (star.alpha <= 0.1) {
          star.alpha = 0.1
          star.dir = 1
        }

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = isGate ? `rgba(255, 242, 235, ${star.alpha})` : `rgba(247, 82, 112, ${star.alpha * 0.4})`
        ctx.shadowBlur = isGate ? 6 : 0
        ctx.shadowColor = '#FFCEE3'
        ctx.fill()
        ctx.shadowBlur = 0
      })

      // Draw shooting star
      spawnShootingStar()
      if (shootingStar) {
        ctx.beginPath()
        ctx.moveTo(shootingStar.x, shootingStar.y)
        ctx.lineTo(shootingStar.x - shootingStar.vx * 3, shootingStar.y - shootingStar.vy * 3)
        ctx.strokeStyle = `rgba(255, 255, 255, ${shootingStar.alpha})`
        ctx.lineWidth = 2
        ctx.stroke()

        shootingStar.x += shootingStar.vx
        shootingStar.y += shootingStar.vy
        shootingStar.alpha -= 0.02

        if (shootingStar.alpha <= 0 || shootingStar.x > canvas.width || shootingStar.y > canvas.height) {
          shootingStar = null
        }
      }

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
  }, [variant])

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
        zIndex: variant === 'gate' ? 0 : -1,
      }}
    />
  )
}
