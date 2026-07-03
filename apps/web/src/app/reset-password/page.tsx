import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { setNewPasswordAndSignOut } from '@/app/login/actions'
import { ShieldAlert } from 'lucide-react'

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const resolvedSearchParams = await searchParams

  if (!user) {
    redirect('/login?message=Invalid or expired password reset link.')
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-4 selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.15)_0,rgba(0,0,0,0)_50%)]" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 mb-6">
            <ShieldAlert className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Secure Your Account
          </h1>
          <p className="text-zinc-500 mt-2 text-sm">
            Enter a new password for {user.email}
          </p>
        </div>

        <div className="bg-zinc-950/50 backdrop-blur-xl border border-zinc-800/50 p-8 rounded-2xl shadow-2xl">
          <form action={setNewPasswordAndSignOut} className="space-y-4">
            {resolvedSearchParams?.message && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {resolvedSearchParams.message}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">New Password</label>
              <input 
                type="password"
                name="password"
                required
                minLength={6}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Confirm New Password</label>
              <input 
                type="password"
                name="confirmPassword"
                required
                minLength={6}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mt-4"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
