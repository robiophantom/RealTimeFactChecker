'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, FileText, CheckCircle2, Activity, Settings, Save, AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

type UserTableItem = {
  name: string
  email: string
  role: string
  date: string
}

type SystemSettings = {
  max_text_size_mb: number
  max_media_size_mb: number
  max_text_length: number
  max_transcript_tokens: number
  user_monthly_token_limit: number
}

type AdminClientWrapperProps = {
  totalUsers: number
  totalReports: number
  totalTokenUsage: number
  totalApiRequests: number
  chartData: number[]
  chartLabels: { start: string, end: string }
  recentUsers: UserTableItem[]
  systemSettings: SystemSettings
}

export function AdminClientWrapper({ 
  totalUsers, 
  totalReports, 
  totalTokenUsage, 
  totalApiRequests, 
  chartData, 
  chartLabels, 
  recentUsers,
  systemSettings
}: AdminClientWrapperProps) {
  
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview')
  const [settings, setSettings] = useState<SystemSettings>(systemSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{text: string, type: 'success'|'error'} | null>(null)

  const stats = [
    { label: "Total Users", value: totalUsers.toLocaleString(), icon: Users },
    { label: "Verifications Run", value: totalReports.toLocaleString(), icon: FileText },
    { label: "Total API Requests", value: totalApiRequests.toLocaleString(), icon: Activity },
    { label: "Total Token Usage", value: totalTokenUsage.toLocaleString(), icon: CheckCircle2 },
  ]

  const maxChartVal = Math.max(...chartData, 10)

  const handleSaveSettings = async () => {
    setIsSaving(true)
    setMessage(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('http://localhost:8000/api/v1/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session && { 'Authorization': `Bearer ${session.access_token}` })
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }
      
      setMessage({ text: 'Settings updated successfully.', type: 'success' })
    } catch (err: any) {
      console.error(err)
      setMessage({ text: 'Error updating settings.', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Admin</h1>
          <p className="text-zinc-400 mt-2">Monitor platform activity and configure global constraints.</p>
        </div>
        <div className="flex gap-2 bg-zinc-900/80 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Settings
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden"
                >
                  <div className="absolute -right-4 -top-4 opacity-5">
                    <Icon className="w-32 h-32" />
                  </div>
                  <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-400">{stat.label}</span>
                    </div>
                    <div className="text-3xl font-bold text-white tracking-tight">
                      {stat.value}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Activity Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6"
          >
            <h3 className="text-lg font-medium mb-6">Recent Verifications (Last 14 Days)</h3>
            <div className="h-64 flex items-end justify-between gap-2">
              {chartData.map((val, i) => {
                const heightPct = (val / maxChartVal) * 100
                return (
                  <div key={i} className="w-full bg-zinc-900 rounded-t-sm relative group cursor-pointer hover:bg-zinc-800 transition-colors flex items-end" style={{ height: '100%' }}>
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                      className="w-full bg-indigo-500 rounded-t-sm relative"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-white text-xs px-2 py-1 rounded">
                        {val}
                      </div>
                    </motion.div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-4 text-xs text-zinc-500">
              <span>{chartLabels.start}</span>
              <span>{chartLabels.end}</span>
            </div>
          </motion.div>
          
          {/* Recent Users Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-800">
              <h3 className="text-lg font-medium">New Signups</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 bg-zinc-900/50 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Joined</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {recentUsers.map((user, i) => (
                    <tr key={i} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-200">{user.name}</span>
                          <span className="text-zinc-500">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-800 text-zinc-300'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">{user.date}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="text-zinc-300">Active</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {recentUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'settings' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden max-w-3xl"
        >
          <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-medium">Global System Limits</h2>
          </div>
          
          <div className="p-6 space-y-6">
            {message && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'error' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Max Text Document Size (MB)</label>
                <input 
                  type="number" 
                  value={settings.max_text_size_mb}
                  onChange={e => setSettings({...settings, max_text_size_mb: parseInt(e.target.value) || 0})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Max Audio/Video Size (MB)</label>
                <input 
                  type="number" 
                  value={settings.max_media_size_mb}
                  onChange={e => setSettings({...settings, max_media_size_mb: parseInt(e.target.value) || 0})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Max Paste Text Length</label>
                <input 
                  type="number" 
                  value={settings.max_text_length}
                  onChange={e => setSettings({...settings, max_text_length: parseInt(e.target.value) || 0})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Max Transcript Tokens</label>
                <input 
                  type="number" 
                  value={settings.max_transcript_tokens}
                  onChange={e => setSettings({...settings, max_transcript_tokens: parseInt(e.target.value) || 0})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-zinc-300">User Monthly Token Limit</label>
                <input 
                  type="number" 
                  value={settings.user_monthly_token_limit}
                  onChange={e => setSettings({...settings, user_monthly_token_limit: parseInt(e.target.value) || 0})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-zinc-500">Applies across all users on the platform.</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-zinc-800">
              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Settings
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
