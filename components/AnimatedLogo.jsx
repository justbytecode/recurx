"use client"

import { useEffect, useRef } from "react"

export function AnimatedLogo({ collapsed = false }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Animation variables
    let animationFrame
    let time = 0
    const width = rect.width
    const height = rect.height

    // Payment symbols
    const symbols = ["$", "₿", "€", "£", "¥"]
    let activeSymbol = 0
    let lastSymbolChange = 0

    // Animation loop
    const animate = () => {
      time += 0.02

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Draw background
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, "#1e1e2f") // Dark blue/purple
      gradient.addColorStop(1, "#0f0f1a") // Darker blue/purple
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.roundRect(0, 0, width, height, 8)
      ctx.fill()

      // Draw pulsing circle
      const pulseSize = Math.sin(time * 2) * 2 + 10
      const glowOpacity = Math.sin(time * 2) * 0.2 + 0.4

      // Glow effect
      ctx.globalAlpha = glowOpacity
      ctx.fillStyle = "#6366f1" // Indigo
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, pulseSize + 5, 0, Math.PI * 2)
      ctx.fill()

      // Main circle
      ctx.globalAlpha = 1
      ctx.fillStyle = "#4f46e5" // Indigo
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, pulseSize, 0, Math.PI * 2)
      ctx.fill()

      // Change symbol every 2 seconds
      if (time - lastSymbolChange > 2) {
        activeSymbol = (activeSymbol + 1) % symbols.length
        lastSymbolChange = time
      }

      // Draw "R" letter with payment symbol
      ctx.fillStyle = "white"
      ctx.font = collapsed ? "bold 16px sans-serif" : "bold 18px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("R", width / 2, height / 2 - 2)

      // Draw payment symbol with animation
      const symbolOpacity = Math.sin((time - lastSymbolChange) * 2) * 0.5 + 0.5
      ctx.globalAlpha = symbolOpacity
      ctx.font = collapsed ? "10px sans-serif" : "12px sans-serif"
      ctx.fillText(symbols[activeSymbol], width / 2 + (collapsed ? 8 : 10), height / 2 - (collapsed ? 8 : 10))
      ctx.globalAlpha = 1

      // Draw small payment-related particles
      const particleCount = 6
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + time
        const distance = pulseSize * 1.5
        const x = width / 2 + Math.cos(angle) * distance
        const y = height / 2 + Math.sin(angle) * distance

        ctx.fillStyle = "#a5b4fc" // Light indigo
        ctx.globalAlpha = 0.7
        ctx.beginPath()
        ctx.arc(x, y, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }

      animationFrame = requestAnimationFrame(animate)
    }

    // Start animation
    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [collapsed])

  return (
    <div className={`relative ${collapsed ? "w-8 h-8" : "w-10 h-10"} transition-all duration-300`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg shadow-lg"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  )
}
