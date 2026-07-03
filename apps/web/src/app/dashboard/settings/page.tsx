import { createClient } from '@/utils/supabase/server'
import { User, Shield, CreditCard, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { resetCurrentUserPassword, updatePassword } from '@/app/login/actions'

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const resolvedSearchParams = await searchParams
  const message = resolvedSearchParams.message

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let maxTokens = 10000
  const { data: settingsData } = await supabase.from('system_settings').select('setting_value').eq('setting_key', 'limits').single()
  if (settingsData && settingsData.setting_value) {
    maxTokens = settingsData.setting_value.user_monthly_token_limit || 10000
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  
  const { data: usageData } = await supabase
    .from('usage_logs')
    .select('input_tokens, output_tokens')
    .eq('user_id', user?.id)
    .gte('created_at', monthStart)
    
  let usedTokens = 0
  if (usageData) {
    usedTokens = usageData.reduce((acc, row) => acc + (row.input_tokens || 0) + (row.output_tokens || 0), 0)
  }
  
  const remainingTokens = Math.max(0, maxTokens - usedTokens)
  const percentageUsed = Math.min(100, Math.round((usedTokens / maxTokens) * 100))

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <Link href="/dashboard" className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors font-medium mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-zinc-400 mt-2">Manage your personal information, security preferences, and subscription.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border text-sm ${message.includes('sent') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
            <User className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-medium">Profile Information</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-zinc-400">Email Address</label>
              <input 
                type="text" 
                disabled 
                value={user?.email || ''} 
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-500 cursor-not-allowed w-full max-w-md"
              />
              <p className="text-xs text-zinc-500">Your email address is managed through your authentication provider.</p>
            </div>
          </div>
        </div>

        {/* Plan Section */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-medium">Subscription & Usage</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl mb-4">
              <div>
                <h3 className="font-medium text-white mb-1">Current Tier</h3>
                <p className="text-sm text-zinc-400">{remainingTokens.toLocaleString()} API tokens remaining this month</p>
              </div>
              <button className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors">
                Upgrade Plan
              </button>
            </div>
            
            <div className="w-full bg-zinc-900 rounded-full h-2 mb-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${percentageUsed}%` }}></div>
            </div>
            <p className="text-xs text-zinc-500 text-right">{usedTokens.toLocaleString()} / {maxTokens.toLocaleString()} used</p>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-rose-400" />
              <h2 className="text-lg font-medium">Security</h2>
            </div>
            <form action={resetCurrentUserPassword}>
              <button type="submit" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                Send Reset Email
              </button>
            </form>
          </div>
          <div className="p-6">
            <form action={updatePassword} className="space-y-4 max-w-sm">
              <h3 className="text-sm font-medium text-white mb-4">Set New Password</h3>
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400" htmlFor="password">New Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400" htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors mt-2">
                Update Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
