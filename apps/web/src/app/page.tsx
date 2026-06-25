import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center selection:bg-indigo-500/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.15)_0,rgba(0,0,0,0)_50%)]" />
      <div className="z-10 max-w-3xl space-y-8">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Trust, but <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">verify</span>.
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          The ultimate platform for extracting, analyzing, and verifying factual claims from audio, video, and text in real-time.
        </p>
        <div className="pt-8">
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center rounded-full bg-white text-black px-8 py-3.5 text-sm font-semibold hover:bg-zinc-200 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}
