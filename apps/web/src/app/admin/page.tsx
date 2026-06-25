'use client'

import { motion } from 'framer-motion'
import { Users, FileText, CheckCircle2, Activity } from 'lucide-react'

export default function AdminDashboard() {
  // Mock data for Admin Overview
  const stats = [
    { label: "Total Users", value: "1,248", change: "+12%", icon: Users },
    { label: "Verifications Run", value: "45,821", change: "+24%", icon: FileText },
    { label: "Claims Verified True", value: "12,431", change: "+5%", icon: CheckCircle2 },
    { label: "API Token Usage", value: "4.2M", change: "+18%", icon: Activity },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <p className="text-zinc-400 mt-2">Monitor platform activity, user growth, and API usage.</p>
      </div>

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
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                    {stat.change}
                  </span>
                </div>
                <div className="text-3xl font-bold text-white tracking-tight">
                  {stat.value}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Activity Chart Mockup */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6"
      >
        <h3 className="text-lg font-medium mb-6">Recent Verifications</h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {/* Mock Bars */}
          {[40, 60, 45, 80, 55, 70, 90, 85, 65, 75, 50, 85, 95, 100].map((height, i) => (
            <div key={i} className="w-full bg-zinc-900 rounded-t-sm relative group cursor-pointer hover:bg-zinc-800 transition-colors" style={{ height: '100%' }}>
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: 0.5 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                className="absolute bottom-0 w-full bg-indigo-500 rounded-t-sm"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4 text-xs text-zinc-500">
          <span>Jun 10</span>
          <span>Jun 24</span>
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
              {[
                { name: "Alice Johnson", email: "alice@example.com", role: "user", date: "2 mins ago" },
                { name: "Bob Smith", email: "bob@example.com", role: "user", date: "1 hour ago" },
                { name: "Charlie Davis", email: "charlie@example.com", role: "admin", date: "3 hours ago" },
                { name: "Diana Prince", email: "diana@example.com", role: "user", date: "5 hours ago" },
              ].map((user, i) => (
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
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
