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
  
  // Total API requests (actions in usage_logs) and total tokens
  const { data: usageData, count: totalApiRequests } = await adminClient.from('usage_logs').select('input_tokens, output_tokens', { count: 'exact' })
  let totalTokenUsage = 0
  if (usageData) {
    totalTokenUsage = usageData.reduce((acc, row) => acc + (row.input_tokens || 0) + (row.output_tokens || 0), 0)
  }

  // Global Settings
  let systemSettings = {
    max_text_size_mb: 10,
    max_media_size_mb: 50,
    max_text_length: 100000,
    max_transcript_tokens: 7000,
    user_monthly_token_limit: 10000
  }
  const { data: settingsData } = await adminClient.from('system_settings').select('setting_value').eq('setting_key', 'limits').single()
  if (settingsData && settingsData.setting_value) {
    systemSettings = settingsData.setting_value
  }

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
      totalTokenUsage={totalTokenUsage}
      totalApiRequests={totalApiRequests || 0}
      chartData={chartData}
      chartLabels={chartLabels}
      recentUsers={recentUsers}
      systemSettings={systemSettings}
    />
  )
}
