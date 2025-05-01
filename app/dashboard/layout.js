"use client"

import { useSession } from "next-auth/react"
import Sidebar from "@/components/Sidebar"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
    }
  }, [session, status, router])

  if (!mounted || status === "loading" || !session)
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
      </div>
    )

  return (
    <div className="flex min-h-screen bg-zinc-900">
      <Sidebar role={session.user.role} onCollapseChange={(collapsed) => setSidebarCollapsed(collapsed)} />
      <main
        className={`
          flex-1 transition-all duration-300 
          ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-64 xl:ml-72"} 
          w-full max-w-full
        `}
      >
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 h-full max-w-full">
          <div className="w-full max-w-[1600px] mx-auto">{children}</div>
        </div>
      </main>
    </div>
  )
}