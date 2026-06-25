import { createClient } from '@/utils/supabase/server'
import { FileText, Download, Clock, CheckCircle2, XCircle } from 'lucide-react'

export default async function ReportsPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch historical reports for this user
  const { data: reports } = await supabase
    .from('reports')
    .select('*, uploads(file_name, file_type)')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historical Reports</h1>
        <p className="text-zinc-400 mt-2">View and export all your past fact-checking verifications.</p>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
        {(!reports || reports.length === 0) ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 text-zinc-500">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No reports yet</h3>
            <p className="text-zinc-500">Run your first verification from the dashboard to generate a report.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 bg-zinc-900/50 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Source File</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Total Claims</th>
                  <th className="px-6 py-4 font-medium">Verdict Breakdown</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span className="font-medium text-zinc-200">
                          {report.uploads?.file_name || 'Live Microphone Session'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Clock className="w-3 h-3" />
                        {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-300 font-medium">
                      {report.total_claims}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4 text-xs">
                        <div className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> {report.true_claims} True
                        </div>
                        <div className="flex items-center gap-1 text-red-400">
                          <XCircle className="w-3 h-3" /> {report.false_claims} False
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 transition-colors">
                        <Download className="w-4 h-4" />
                        <span>Export PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
