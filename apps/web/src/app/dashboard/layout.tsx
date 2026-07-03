import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, LogOut, Settings, BarChart2, Shield } from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the user's role and name
  const { data: profile } = await supabase.from('users').select('role, full_name').eq('id', user.id).single()
  
  const displayName = profile?.full_name || user.email

  return (
    <div className="flex flex-col md:flex-row h-screen bg-black text-white selection:bg-indigo-500/30 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-950 flex flex-col shrink-0">
        <div className="p-4 md:p-6 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-black tracking-tighter flex items-center gap-2 group">
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent transition-all duration-500">
              Satya
            </span>
          </Link>
          
          {/* Mobile Profile & Signout */}
          <div className="md:hidden flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
              {displayName?.[0].toUpperCase()}
            </div>
            <form action="/auth/signout" method="post">
              <button className="p-2 text-zinc-400 hover:text-red-400 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
        
        <nav className="flex-none md:flex-1 px-4 py-2 md:py-0 overflow-x-auto flex md:flex-col gap-2 md:gap-0 md:space-y-2 pb-3 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-300 rounded-lg hover:bg-zinc-800/50 hover:text-white transition-colors whitespace-nowrap">
            <FileText className="w-4 h-4 shrink-0" />
            Verification
          </Link>
          <Link href="/dashboard/reports" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 rounded-lg hover:bg-zinc-800/50 hover:text-white transition-colors whitespace-nowrap">
            <BarChart2 className="w-4 h-4 shrink-0" />
            Reports
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 rounded-lg hover:bg-zinc-800/50 hover:text-white transition-colors whitespace-nowrap">
            <Settings className="w-4 h-4 shrink-0" />
            Settings
          </Link>
          
          {profile?.role === 'admin' && (
            <Link href="/admin" className="flex items-center gap-3 px-3 py-2 md:mt-4 text-sm font-medium text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors border border-indigo-500/20 whitespace-nowrap">
              <Shield className="w-4 h-4 shrink-0" />
              Admin Panel
            </Link>
          )}
        </nav>
        
        {/* Desktop Profile & Signout */}
        <div className="hidden md:block p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
              {displayName?.[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{displayName}</p>
              {profile?.full_name && (
                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              )}
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 rounded-lg hover:bg-zinc-800/50 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4 shrink-0" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
