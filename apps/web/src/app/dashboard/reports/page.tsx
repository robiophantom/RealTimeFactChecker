import { createClient } from '@/utils/supabase/server'
import { ReportTable } from '@/components/report-table'

export default async function ReportsPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch historical reports for this user
  const { data: reports } = await supabase
    .from('reports')
    .select('*, uploads(filename, file_type)')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historical Reports</h1>
        <p className="text-zinc-400 mt-2">View and export all your past fact-checking verifications.</p>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
        <ReportTable initialReports={reports || []} />
      </div>
    </div>
  )
}
