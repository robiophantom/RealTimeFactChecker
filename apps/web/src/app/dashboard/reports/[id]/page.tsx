import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ReportViewer } from '@/components/report-viewer'

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

  // 3. Fetch transcript source text
  const { data: transcript } = await supabase
    .from('transcripts')
    .select('content')
    .eq('upload_id', report.upload_id)
    .single()

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/reports" className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Reports
        </Link>
      </div>
      
      <ReportViewer 
        report={report} 
        claims={claims} 
        transcript={transcript?.content || ''} 
      />
    </div>
  )
}
