'use client'

import { motion } from 'framer-motion'
import { Users, FileText, CheckCircle2, Activity } from 'lucide-react'

type UserTableItem = {
  name: string
  email: string
  role: string
  date: string
}

type AdminClientWrapperProps = {
  totalUsers: number
  totalReports: number
  totalClaims: number
  trueClaims: number
  chartData: number[] // array of 14 numbers
  chartLabels: { start: string, end: string }
  recentUsers: UserTableItem[]
}

export function AdminClientWrapper({ 
  totalUsers, 
  totalReports, 
  totalClaims, 
  trueClaims, 
  chartData, 
  chartLabels, 
  recentUsers 
}: AdminClientWrapperProps) {
  
  const stats = [
    { label: "Total Users", value: totalUsers.toLocaleString(), icon: Users },
    { label: "Verifications Run", value: totalReports.toLocaleString(), icon: FileText },
    { label: "Total Claims Extracted", value: totalClaims.toLocaleString(), icon: Activity },
    { label: "Claims Verified True", value: trueClaims.toLocaleString(), icon: CheckCircle2 },
  ]

  // Find max for chart scaling, fallback to 10 if all zeros
  const maxChartVal = Math.max(...chartData, 10)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <p className="text-zinc-400 mt-2">Monitor platform activity, user growth, and verification usage.</p>
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
  )
}
