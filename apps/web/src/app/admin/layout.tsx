import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Users, LayoutDashboard, Activity, Shield } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Double check admin role in DB
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  
  if (profile?.role !== 'admin') {
    redirect('/dashboard') // Redirect non-admins back to their dashboard
  }

  return (
    <div className="flex h-screen bg-black text-white selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col">
        <div className="p-6">
          <Link href="/admin" className="text-xl font-bold flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 text-indigo-500" />
            Admin Panel
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-300 rounded-lg hover:bg-zinc-800/50 hover:text-white transition-colors">
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 rounded-lg hover:bg-zinc-800/50 hover:text-white transition-colors">
            <Users className="w-4 h-4" />
            Manage Users
          </Link>
          <Link href="/admin/usage" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 rounded-lg hover:bg-zinc-800/50 hover:text-white transition-colors">
            <Activity className="w-4 h-4" />
            System Usage
          </Link>
        </nav>
        
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
              A
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">Admin User</p>
            </div>
          </div>
          <Link href="/dashboard" className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 rounded-lg hover:bg-zinc-800/50 hover:text-white transition-colors">
            Exit Admin
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
