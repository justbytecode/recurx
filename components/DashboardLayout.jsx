"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Toaster } from "@/components/ui/toaster"
import DashboardSidebar from "@/components/Sidebar"
import WalletConnectPopup from "@/components/WalletConnectPopup"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function DashboardLayout({ children, role }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== role) {
      router.push("/auth/signin")
    }
  }, [session, status, router, role])

  if (status === "loading" || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-black text-white">
        <DashboardSidebar role={role} />
        {!session.user.walletAddress && <WalletConnectPopup role={role} />}
        <SidebarInset>
          <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-full overflow-x-hidden">
            {children}
          </div>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}
