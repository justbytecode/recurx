"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, Shield, RefreshCw, Star } from "lucide-react"
// import FeatureComponent from "@/components/FeatureComponent"
// import Docs from "@/components/Docs"
// import InfiniteMovingCards from "@/components/InfiniteMovingCards"
// import SupportedTokens from "@/components/SupportedTokens"
// import TawkMessengerReact from "@tawk.to/tawk-messenger-react"
const randomDecimal = () => (Math.random() * 0.99 + 0.01).toFixed(2)

const particlesAnimationArray = [
  {
    uint: "btc",
    img: "./supportedCoins/bitcoin.svg",
    amt: randomDecimal(),
  },
  {
    uint: "eth",
    img: "./supportedCoins/ethereum.svg",
    amt: randomDecimal(),
  },
  {
    uint: "usdc",
    img: "/supportedCoins/tether.svg",
    amt: randomDecimal(),
  },
  {
    uint: "btc",
    img: "./supportedCoins/bitcoin.svg",
    amt: randomDecimal(),
  },
  {
    uint: "eth",
    img: "./supportedCoins/ethereum.svg",
    amt: randomDecimal(),
  },
  {
    uint: "usdc",
    img: "/supportedCoins/tether.svg",
    amt: randomDecimal(),
  },
  {
    uint: "btc",
    img: "./supportedCoins/bitcoin.svg",
    amt: randomDecimal(),
  },
  {
    uint: "eth",
    img: "./supportedCoins/ethereum.svg",
    amt: randomDecimal(),
  },
  {
    uint: "usdc",
    img: "/supportedCoins/tether.svg",
    amt: randomDecimal(),
  },
]

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  // useEffect(() => {
  //   const script = document.createElement("script")
  //   script.src = "https://embed.tawk.to/67e50a774040b31908c84848/default"
  //   script.async = true
  //   script.charset = "UTF-8"
  //   script.setAttribute("crossorigin", "*")
  //   document.body.appendChild(script)

  //   return () => {
  //     document.body.removeChild(script) // Cleanup on unmount
  //   }
  // }, [])

 

  

  // Track mouse position for the gradient effect
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white overflow-hidden relative">
      <div className="relative">
        {/* <TawkMessengerReact
          onBeforeLoad={() => {}}
          onStatusChange={() => {}}
          onLoad={() => {}}
          onChatMaximized={() => {}}
          onChatMinimized={() => {}}
          onChatHidden={() => {}}
          onChatStarted={() => {}}
          onChatEnded={() => {}}
          onPrechatSubmit={() => {}}
          onOfflineSubmit={() => {}}
          onChatMessageVisitor={() => {}}
          onChatMessageAgent={() => {}}
          onChatMessageSystem={() => {}}
          onAgentJoinChat={() => {}}
          onAgentLeaveChat={() => {}}
          onChatSatisfaction={() => {}}
          onVisitorNameChanged={() => {}}
          onTagsUpdated={() => {}}
          onUnreadCountChanged={() => {}}
          propertyId="67e50a774040b31908c84848"
          widgetId="1injsi3ti"
        /> */}
      </div>
      {/* Subtle animated background gradient */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.3) 0%, rgba(16, 185, 129, 0.1) 25%, transparent 50%)`,
          transition: "background 0.3s ease",
        }}
      />

      {/* Simplified grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      
      {/* <Particles count={12} /> */}

      {/* Safe Payment Animations */}
      {/* <SafePaymentAnimation /> */}
      {/* <FloatingTransactions /> */}

      {/* Hero Section */}
      <header className="container mx-auto px-4 py-20 relative z-10">
        <div className="flex justify-end">
          {" "}
          <SecurePaymentBadge />
        </div>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          {/* Logo/Brand */}

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="inline-block p-3 bg-blue-600/20 rounded-full">
              <RefreshCw size={32} className="text-blue-400" />
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-5xl md:text-8xl lg:text-9xl font-bold mb-6 tracking-tight text-blue-600"
            style={{
              background: "linear-gradient(to right, #3b82f6, #8b5cf6, #10b981)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            RecurX
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto"
          >
            Create and manage your payments with Recurx,with<br /> 
            <span className="font-extrabold"> 0% Transaction fee</span>, powered by blockchain technology.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/auth/signin"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-300 text-lg font-medium flex items-center gap-2"
            >
              Get Started <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center mb-16"
        >
          <h2
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight"
            style={{
              background: "linear-gradient(to right, #3b82f6, #8b5cf6, #10b981)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Why Choose RecurX ?
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto text-xl">
            Our platform combines the best of blockchain technology with user-friendly design to revolutionize
            subscription payments.
          </p>
        </motion.div>

        {/* <InfiniteMovingCards /> */}
      </section>

      {/* Supported Coin Section */}

      <section className="container mx-auto px-4 py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center mb-16"
        >
          <h2
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight"
            style={{
              background: "linear-gradient(to right, #3b82f6, #8b5cf6, #10b981)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Supported Tokens ?
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto text-xl">
            Our platform supports a wide range of cryptocurrencies, making subscription payments accessible and flexible
            for users worldwide.
          </p>
        </motion.div>

        {/* <SupportedTokens /> */}
      </section>

      {/* Floating blockchain elements - simplified */}
      <div className="absolute top-1/4 -left-20 opacity-10 animate-pulse">
        <BlockchainElement />
      </div>
      <div className="absolute bottom-1/4 -right-20 opacity-10 animate-pulse" style={{ animationDelay: "1s" }}>
        <BlockchainElement />
      </div>

      {/* Feature Component */}

      {/* <FeatureComponent /> */}
      {/* <Docs /> */}
    </div>
  )
}

// Feature Card Component
/**
 * @param {Object} props
 * @param {React.ReactNode} props.icon
 * @param {string} props.title
 * @param {string} props.description
 * @param {number} props.delay
 */
function FeatureCard({ icon, title, description, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-xl border border-gray-800 hover:border-blue-600/50 transition-all duration-300 flex flex-col items-center text-center"
    >
      <div className="p-3 bg-blue-900/20 rounded-full w-fit mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </motion.div>
  )
}

// Review Card Component
/**
 * @param {Object} props
 * @param {string} props.name
 * @param {string} props.role
 * @param {number} props.rating
 * @param {string} props.review
 * @param {string} props.image
 * @param {number} props.delay
 */
function ReviewCard({ name, role, rating, review, image, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-xl border border-gray-800 hover:border-blue-600/20 transition-all duration-300"
    >
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={18} className={i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"} />
        ))}
      </div>
      <p className="text-gray-300 mb-6 italic">&quot;{review}&quot;</p>
      <div className="flex items-center gap-4">
        <Image src={image || "/placeholder.svg"} width={50} height={50} alt={name} className="rounded-full" />
        <div>
          <h4 className="font-medium text-white">{name}</h4>
          <p className="text-sm text-gray-400">{role}</p>
        </div>
      </div>
    </motion.div>
  )
}

// Animated Particles Component - Simplified
/** @param {{ count?: number }} props */
function Particles({ count = 20 }) {
  // Use empty array initially and calculate values on client side only
  const [particles, setParticles] = useState([])

  useEffect(() => {
    // Initialize particles only on client side
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    const particlesArray = Array.from({ length: count }).map((_, i) => ({
      id: i,
      size: Math.random() * 20 + 5,
      initialX: Math.random() * windowWidth,
      initialY: Math.random() * windowHeight,
      duration: Math.random() * 15 + 15,
    }))

    setParticles(particlesArray)
  }, [count])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-blue-600/10"
          initial={{
            x: particle.initialX,
            y: particle.initialY,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            x: [particle.initialX, particle.initialX + (Math.random() * 150 - 75), particle.initialX],
            y: [particle.initialY, particle.initialY + (Math.random() * 150 - 75), particle.initialY],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
        />
      ))}
    </div>
  )
}

// Safe Payment Animation Component
function SafePaymentAnimation() {
  return (
    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex items-center justify-center">
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
      >
        {/* Outer security ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-blue-500/30"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
            borderColor: ["rgba(59, 130, 246, 0.3)", "rgba(16, 185, 129, 0.3)", "rgba(59, 130, 246, 0.3)"],
          }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />

        {/* Inner security pulse */}
        <motion.div
          className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600/20 to-emerald-500/20 flex items-center justify-center"
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(59, 130, 246, 0.4)",
              "0 0 0 10px rgba(59, 130, 246, 0)",
              "0 0 0 0 rgba(59, 130, 246, 0.4)",
            ],
          }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          <Shield size={40} className="text-blue-400" />
        </motion.div>

        {/* Orbiting elements */}
        <PaymentOrbitingElement
          icon={
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              💳
            </motion.div>
          }
          delay={0}
          duration={8}
          distance={70}
        />
        <PaymentOrbitingElement
          icon={
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}>
              🔒
            </motion.div>
          }
          delay={2}
          duration={8}
          distance={70}
        />
        <PaymentOrbitingElement
          icon={
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            >
              ⚡
            </motion.div>
          }
          delay={4}
          duration={8}
          distance={70}
        />
        <PaymentOrbitingElement
          icon={
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              🛡️
            </motion.div>
          }
          delay={6}
          duration={8}
          distance={70}
        />
      </motion.div>
    </div>
  )
}

// Orbiting Element for Payment Animation
function PaymentOrbitingElement({ icon, delay, duration, distance }) {
  return (
    <motion.div
      className="absolute flex items-center justify-center w-10 h-10 rounded-full bg-gray-900/80 backdrop-blur-sm border border-gray-700 shadow-lg"
      initial={{ rotate: delay * 45 }}
      animate={{
        rotate: [delay * 45, delay * 45 + 360],
      }}
      transition={{
        duration,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear",
        delay: 0,
      }}
      style={{
        transformOrigin: "center center",
        left: "calc(50% - 20px)",
        top: "calc(50% - 20px)",
        translate: `${distance}px 0`,
      }}
    >
      {icon}
    </motion.div>
  )
}

// Floating Transaction Animation
// function FloatingTransactions() {
//   const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 })

//   useEffect(() => {
//     // Set initial dimensions
//     updateDimensions()

//     // Add debounced resize listener
//     let timeoutId = null

//     function handleResize() {
//       clearTimeout(timeoutId)
//       timeoutId = setTimeout(updateDimensions, 200)
//     }

//     function updateDimensions() {
//       setWindowDimensions({
//         width: window.innerWidth,
//         height: window.innerHeight,
//       })
//     }

//     window.addEventListener("resize", handleResize)

//     // Clean up
//     return () => {
//       clearTimeout(timeoutId)
//       window.removeEventListener("resize", handleResize)
//     }
//   }, [])

//   // Early return if dimensions aren't set yet
//   if (windowDimensions.width === 0) return null

//   return (
//     <div className="absolute inset-0 overflow-hidden pointer-events-none">
//       {particlesAnimationArray.map((item, i) => (
//         <motion.div
//           key={i}
//           className="absolute flex items-center gap-2 bg-gray-900/40 backdrop-blur-sm p-2 rounded-lg border border-gray-800 shadow-lg will-change-transform"
//           style={{
//             willChange: "transform, opacity",
//             translateZ: 0,
//           }}
//           initial={{
//             x: Math.random() < 0.5 ? -100 : windowDimensions.width + 100,
//             y: 50 + Math.random() * (windowDimensions.height - 200),
//             opacity: 0,
//           }}
//           animate={{
//             x: Math.random() < 0.5 ? windowDimensions.width + 100 : -100,
//             opacity: [0, 1, 1, 0],
//           }}
//           transition={{
//             duration: 10 + Math.random() * 15,
//             delay: Math.random() * 5, // Add randomized delays
//             repeat: Number.POSITIVE_INFINITY,
//             ease: "linear",
//             repeatDelay: Math.random() * 2,
//           }}
//         >
//           <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
//             <motion.div
//               animate={{ scale: [1, 1.2, 1] }}
//               transition={{
//                 duration: 2,
//                 repeat: Number.POSITIVE_INFINITY,
//                 ease: "easeInOut",
//               }}
//             >
//               <Image src={item.img || "/placeholder.svg"} alt="Crypto Icon" height={100} width={100} />
//             </motion.div>
//           </div>
//           <div className="text-xs">
//             <div className="text-white font-medium">
//               Payment {item.amt || 0.01} {item.uint.toUpperCase()}
//             </div>
//             <div className="text-green-400">✓ Secured</div>
//           </div>
//         </motion.div>
//       ))}
//     </div>
//   )
// }

// Secure Payment Badge
function SecurePaymentBadge() {
  return (
    <motion.div
      className="bg-gray-900/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-800 flex items-center gap-2"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          color: ["#3b82f6", "#10b981", "#3b82f6"],
        }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
      >
        <Shield size={20} className="text-blue-400" />
      </motion.div>
      <span className="text-sm font-medium text-white">100% Secure Payments</span>
    </motion.div>
  )
}

// Blockchain Element - Simplified
function BlockchainElement() {
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="45" y="45" width="90" height="90" rx="8" stroke="white" strokeWidth="1.5" />
      <rect x="65" y="65" width="50" height="50" rx="4" stroke="white" strokeWidth="1.5" />
      <line x1="45" y1="90" x2="180" y2="90" stroke="white" strokeWidth="1.5" />
      <line x1="90" y1="45" x2="90" y2="180" stroke="white" strokeWidth="1.5" />
    </svg>
  )
}
