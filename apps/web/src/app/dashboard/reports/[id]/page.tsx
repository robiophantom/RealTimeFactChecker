import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, ExternalLink, ArrowLeft, Printer } from 'lucide-react'
import Link from 'next/link'

export default async function ReportViewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()
  
  // 1. Fetch Report and Metadata
  const { data: report } = await supabase
    .from('reports')
    .select('*, uploads(filename, file_type, created_at)')
    .eq('id', resolvedParams.id)
    .single()
    
  if (!report) {
    notFound()
  }

  // 2. Fetch all verified claims associated with this upload
  const { data: claims } = await supabase
    .from('claims')
    .select(`
      id,
      claim_text,
      context,
      claim_verifications(verdict, confidence_score, explanation, source_references),
      transcripts!inner(upload_id)
    `)
    .eq('transcripts.upload_id', report.upload_id)

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'True': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      case 'False': return <XCircle className="w-5 h-5 text-red-400" />
      case 'Partially True': return <AlertTriangle className="w-5 h-5 text-amber-400" />
      default: return <HelpCircle className="w-5 h-5 text-zinc-400" />
    }
  }

  const getVerdictBg = (verdict: string) => {
    switch (verdict) {
      case 'True': return 'bg-emerald-500/10 border-emerald-500/20'
      case 'False': return 'bg-red-500/10 border-red-500/20'
      case 'Partially True': return 'bg-amber-500/10 border-amber-500/20'
      default: return 'bg-zinc-500/10 border-zinc-500/20'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/reports" className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Reports
        </Link>
        <Link 
          href={`/dashboard/reports/${report.id}/print`} 
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Printer className="w-4 h-4" /> Export PDF
        </Link>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Fact-Check Report</h1>
        <p className="text-zinc-400 mb-8">
          Source: <span className="text-zinc-200 font-medium">{report.uploads?.filename || 'Unknown Source'}</span> • 
          Verified on {new Date(report.created_at).toLocaleDateString()}
        </p>

        <div className="p-6 bg-indigo-500/10 border border-indigo-500/30 rounded-xl mb-8">
          <p className="text-indigo-200 mb-6 text-lg">{report.summary}</p>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-white">{report.total_claims}</span>
              <span className="text-sm text-zinc-400">Total Claims</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-emerald-400">{report.true_claims}</span>
              <span className="text-sm text-emerald-400/80">True</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-red-400">{report.false_claims}</span>
              <span className="text-sm text-red-400/80">False</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-amber-400">{report.partially_true_claims}</span>
              <span className="text-sm text-amber-400/80">Mixed</span>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-6">Detailed Verifications</h2>
        
        <div className="space-y-6">
          {claims?.map((claim: any) => {
            const verification = claim.claim_verifications[0]
            if (!verification) return null
            
            return (
              <div key={claim.id} className={`p-6 rounded-xl border ${getVerdictBg(verification.verdict)}`}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getVerdictIcon(verification.verdict)}
                      <span className="font-semibold text-sm tracking-wide uppercase text-white">
                        {verification.verdict}
                      </span>
                      <span className="text-xs text-zinc-500 ml-2">
                        {Math.round(verification.confidence_score * 100)}% confidence
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">"{claim.claim_text}"</h3>
                    {claim.context && (
                      <p className="text-sm text-zinc-400 italic mb-4">Context: {claim.context}</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-black/40 rounded-lg p-4">
                  <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                    {verification.explanation}
                  </p>
                  
                  {verification.source_references && verification.source_references.length > 0 && (
                    <div className="pt-4 border-t border-white/10 flex flex-wrap gap-2">
                      {verification.source_references.map((src: any, i: number) => (
                        <a 
                          key={i} 
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 px-2 py-1 rounded transition-colors"
                        >
                          {src.title}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
