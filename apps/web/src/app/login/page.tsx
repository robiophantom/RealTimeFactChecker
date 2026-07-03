'use client'

import { useState, Suspense, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { login, signup, signInWithGoogle, resetPassword } from './actions'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginContent() {
  const [isLogin, setIsLogin] = useState(true)
  const [pending, setPending] = useState(false)
  const searchParams = useSearchParams()
  const urlMessage = searchParams.get('message')
  const [alertMsg, setAlertMsg] = useState<string | null>(null)

  useEffect(() => {
    if (urlMessage) {
      setAlertMsg(urlMessage)
      const timer = setTimeout(() => {
        setAlertMsg(null)
      }, 2000)
      
      // Clean up the URL so a manual refresh doesn't trigger the toast again
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('message')
      window.history.replaceState({}, '', newUrl.toString())
      
      return () => clearTimeout(timer)
    }
  }, [urlMessage])

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-4 selection:bg-indigo-500/30">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.03)_0,rgba(0,0,0,0)_50%)]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-zinc-950 border border-zinc-800/50 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center flex flex-col items-center">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center gap-2 mb-2"
            >
              <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Satya
              </h1>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse mt-1" />
            </motion.div>
            <p className="text-zinc-500 mt-2 text-sm">
              {isLogin ? 'Welcome back to your dashboard' : 'Create your account to get started'}
            </p>
          </div>

          <div className="h-12 mb-2">
            <AnimatePresence>
              {alertMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-3 rounded-lg border text-sm text-center ${
                    alertMsg.includes('sent') || alertMsg.includes('success') 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}
                >
                  {alertMsg}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <form action={isLogin ? login : signup} onSubmit={() => setPending(true)} className="space-y-4">
            {/* Hidden submit button so pressing Enter triggers main action, not 'Forgot password?' */}
            <button type="submit" className="hidden" aria-hidden="true" />
            
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400" htmlFor="full_name">Full Name</label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  autoComplete="name"
                  required={!isLogin}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="John Doe"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400" htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-zinc-400" htmlFor="password">Password</label>
                {isLogin && (
                  <button 
                    formAction={resetPassword} 
                    onClick={() => setPending(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required={!isLogin}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {pending ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 flex items-center">
            <div className="flex-1 border-t border-zinc-800"></div>
            <span className="px-3 text-xs text-zinc-500">or continue with</span>
            <div className="flex-1 border-t border-zinc-800"></div>
          </div>

          <form action={signInWithGoogle} className="mt-6">
            <button
              type="submit"
              className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg px-4 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-zinc-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
