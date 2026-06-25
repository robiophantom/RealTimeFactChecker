import { createClient, createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AdminClientWrapper } from './admin-client'
import { formatDistanceToNow } from 'date-fns'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Ensure Admin Access (Additional safety check)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Create an admin client to bypass RLS and get system-wide data
  const adminClient = await createAdminClient()

  // 1. Fetch Aggregated Counts
  const { count: totalUsers } = await adminClient.from('users').select('*', { count: 'exact', head: true })
  const { count: totalReports } = await adminClient.from('reports').select('*', { count: 'exact', head: true })
  const { count: totalClaims } = await adminClient.from('claims').select('*', { count: 'exact', head: true })
  const { count: trueClaims } = await adminClient.from('claim_verifications').select('*', { count: 'exact', head: true }).eq('verdict', 'True')

  // 2. Fetch Recent Signups (Top 10)
  const { data: recentUsersData } = await adminClient
    .from('users')
    .select('id, full_name, role, created_at, email')
    .order('created_at', { ascending: false })
    .limit(10)

  const recentUsers = (recentUsersData || []).map(u => ({
    name: u.full_name || u.email?.split('@')[0] || 'Unknown',
    email: u.email || 'No email',
    role: u.role || 'user',
    date: formatDistanceToNow(new Date(u.created_at), { addSuffix: true })
  }))

  // 3. Fetch 14-day Activity Chart Data
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13)
  fourteenDaysAgo.setHours(0,0,0,0)

  const { data: reportsData } = await adminClient
    .from('reports')
    .select('created_at')
    .gte('created_at', fourteenDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  // Initialize array of 14 zeros
  const chartData = Array(14).fill(0)
  
  if (reportsData) {
    reportsData.forEach(r => {
      const date = new Date(r.created_at)
      const diffTime = Math.abs(date.getTime() - fourteenDaysAgo.getTime())
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays >= 0 && diffDays < 14) {
        chartData[diffDays] += 1
      }
    })
  }

  const chartLabels = {
    start: fourteenDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    end: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <AdminClientWrapper 
      totalUsers={totalUsers || 0}
      totalReports={totalReports || 0}
      totalClaims={totalClaims || 0}
      trueClaims={trueClaims || 0}
      chartData={chartData}
      chartLabels={chartLabels}
      recentUsers={recentUsers}
    />
  )
}
