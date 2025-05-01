"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Home,
  DollarSign,
  Users,
  Settings,
  Wallet,
  LinkIcon,
  FileText,
  CreditCard,
  Users2,
  Repeat,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import { AnimatedLogo } from "./AnimatedLogo"

const userLinks = [
  { name: "Dashboard", href: "/dashboard/user", icon: Home },
  { name: "Pay Links", href: "/dashboard/user/pay-links", icon: LinkIcon },
  { name: "Subscriptions", href: "/dashboard/user/subscriptions", icon: Repeat },
  { name: "Transactions", href: "/dashboard/user/transactions", icon: DollarSign },
  { name: "Wallet", href: "/dashboard/user/wallet", icon: Wallet },
  { name: "Settings", href: "/dashboard/user/settings", icon: Settings },
]

const merchantLinks = [
  { name: "Dashboard", href: "/dashboard/merchant", icon: Home },
  { name: "Customers", href: "/dashboard/merchant/customers", icon: Users2 },
  // { name: "Invoices", href: "/dashboard/merchant/invoices", icon: FileText },
  { name: "Pay Links", href: "/dashboard/merchant/pay-links", icon: LinkIcon },
  { name: "Plans", href: "/dashboard/merchant/plans", icon: CreditCard },
  { name: "Subscriptions", href: "/dashboard/merchant/subscriptions", icon: Repeat },
  { name: "Transactions", href: "/dashboard/merchant/transactions", icon: DollarSign },
  { name: "Wallet", href: "/dashboard/merchant/wallet", icon: Wallet },
  { name: "Settings", href: "/dashboard/merchant/settings", icon: Settings },
]

export default function Sidebar({ role, onCollapseChange }) {
  const pathname = usePathname()
  const links = role === "merchant" ? merchantLinks : userLinks
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Handle window resize
  useEffect(() => {
    setMounted(true)

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false)
      }

      // Auto-collapse on smaller screens
      if (window.innerWidth < 1280 && window.innerWidth >= 1024) {
        setIsCollapsed(true)
      } else if (window.innerWidth >= 1280) {
        setIsCollapsed(false)
      }
    }

    // Initial check
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Notify parent component about collapse state
  useEffect(() => {
    if (mounted && onCollapseChange) {
      onCollapseChange(isCollapsed)
    }
  }, [isCollapsed, onCollapseChange, mounted])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e) => {
      const target = e.target
      if (isOpen && !target.closest('[data-sidebar="true"]') && !target.closest('[data-sidebar-toggle="true"]')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const toggleSidebar = () => setIsOpen(!isOpen)

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
  }

  if (!mounted) return null

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        data-sidebar-toggle="true"
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-zinc-900 text-indigo-400 rounded-full shadow-lg hover:bg-zinc-800 transition-all duration-300 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-black"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        data-sidebar="true"
        className={`
          fixed top-0 left-0 h-screen bg-zinc-900 text-zinc-100 shadow-2xl flex flex-col z-40
          transition-all duration-500 ease-in-out
          ${isCollapsed ? "w-16" : "w-64 sm:w-72"}
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          border-r border-zinc-800/50
          backdrop-blur-lg bg-opacity-95
        `}
      >
        {/* Desktop Collapse Toggle */}
        <button
          className="absolute -right-3 top-20 hidden lg:flex items-center justify-center w-6 h-12 bg-zinc-800 text-indigo-400 rounded-r-md border-y border-r border-zinc-700 hover:bg-zinc-700 transition-colors"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo and Role Card */}
        <div className={`flex flex-col items-center pt-4 pb-3 ${isCollapsed ? "px-2" : "px-4"}`}>
          <div className="logo-container relative mb-2">
            <AnimatedLogo collapsed={isCollapsed} />
          </div>

          {!isCollapsed && (
            <>
              <h1 className="text-xl font-extrabold mt-1 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
                Recurx
              </h1>

              {/* Role Card */}
              <div className="w-full mt-3 p-2 rounded-lg bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700/50 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center text-indigo-400">
                      {role === "merchant" ? <Users2 size={16} /> : <Users size={16} />}
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 font-medium">Account Type</p>
                      <p className="text-sm font-semibold text-white capitalize">{role}</p>
                    </div>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center">
                    <ChevronRight size={12} className="text-zinc-400" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Collapsed Role Indicator */}
          {isCollapsed && (
            <div className="mt-3 w-5 h-8 rounded-lg bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700/50 shadow-lg flex items-center justify-center">
              {role === "merchant" ? (
                <Users2 size={16} className="text-indigo-400" />
              ) : (
                <Users size={16} className="text-indigo-400" />
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 pb-4">
          <div className="space-y-1">
            {links.map((link) => {
              const isActive = pathname === link.href

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`
                    flex items-center gap-3 ${isCollapsed ? "justify-center" : ""} p-2 rounded-lg transition-all duration-300 text-6xl font-bold
                    ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-indigo-400 border border-indigo-500/20"
                        : "text-zinc-300 hover:bg-zinc-800/50 hover:text-indigo-300 border border-transparent"
                    }
                    group relative overflow-hidden
                  `}
                  title={isCollapsed ? link.name : ""}
                >
                  {/* Background glow effect for active item */}
                  {isActive && <div className="absolute inset-0 bg-indigo-500/5 rounded-lg blur-xl"></div>}

                  {/* Icon with glow effect */}
                  <div
                    className={`relative ${isActive ? "text-indigo-400" : "text-zinc-400 group-hover:text-indigo-400"}`}
                  >
                    <link.icon className="w-4 h-4" />
                    {isActive && <div className="absolute inset-0 bg-indigo-400/20 blur-md rounded-full"></div>}
                  </div>

                  {!isCollapsed && <span className="relative text-xs">{link.name}</span>}

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-r-full"></div>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-30 transition-opacity duration-300"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
    </>
  )
}
