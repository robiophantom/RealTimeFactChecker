'use client'

import { useEffect, useState, use } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react'

export default function PrintReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [report, setReport] = useState<any>(null)
  const [claims, setClaims] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Fetch Report
      const { data: reportData } = await supabase
        .from('reports')
        .select('*, uploads(filename, file_type, created_at)')
        .eq('id', resolvedParams.id)
        .single()
        
      if (!reportData) return

      // Fetch Claims
      const { data: claimsData } = await supabase
        .from('claims')
        .select(`
          id,
          claim_text,
          context,
          claim_verifications(verdict, confidence_score, explanation, source_references),
          transcripts!inner(upload_id)
        `)
        .eq('transcripts.upload_id', reportData.upload_id)

      setReport(reportData)
      setClaims(claimsData)
      setLoading(false)

      // Trigger print after a short delay to ensure rendering
      setTimeout(() => {
        window.print()
      }, 500)
    }

    loadData()
  }, [resolvedParams.id])

  if (loading) {
    return <div className="p-12 text-center">Loading printable report...</div>
  }

  return (
    <div className="bg-white text-black min-h-screen p-8 max-w-4xl mx-auto print:p-0">
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; margin: 0; padding: 0; }
          .no-print { display: none; }
          .page-break { page-break-inside: avoid; }
        }
      `}} />

      {/* Header */}
      <div className="border-b-2 border-gray-200 pb-6 mb-8">
        <h1 className="text-3xl font-bold mb-2">Fact-Check Report</h1>
        <p className="text-gray-600">
          <strong>Source File:</strong> {report.uploads?.filename || 'Unknown'} <br/>
          <strong>Date Verified:</strong> {new Date(report.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mb-8 page-break">
        <h2 className="text-xl font-bold mb-4">Executive Summary</h2>
        <p className="text-gray-800 mb-6">{report.summary}</p>
        
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{report.total_claims}</div>
            <div className="text-sm text-gray-500 uppercase tracking-wide">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{report.true_claims}</div>
            <div className="text-sm text-green-600 uppercase tracking-wide">True</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{report.false_claims}</div>
            <div className="text-sm text-red-600 uppercase tracking-wide">False</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{report.partially_true_claims}</div>
            <div className="text-sm text-yellow-600 uppercase tracking-wide">Mixed</div>
          </div>
        </div>
      </div>

      {/* Detailed Claims */}
      <h2 className="text-2xl font-bold mb-6">Detailed Analysis</h2>
      <div className="space-y-8">
        {claims?.map((claim: any, index: number) => {
          const verification = claim.claim_verifications[0]
          if (!verification) return null
          
          let verdictColor = 'text-gray-600'
          if (verification.verdict === 'True') verdictColor = 'text-green-600'
          if (verification.verdict === 'False') verdictColor = 'text-red-600'
          if (verification.verdict === 'Partially True') verdictColor = 'text-yellow-600'

          return (
            <div key={claim.id} className="border-l-4 border-gray-300 pl-4 py-2 page-break">
              <div className="mb-2">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Claim {index + 1}</span>
                <h3 className="text-lg font-bold mt-1 text-gray-900">"{claim.claim_text}"</h3>
                {claim.context && <p className="text-sm italic text-gray-500 mt-1">Context: {claim.context}</p>}
              </div>

              <div className="mb-4">
                <div className={`font-bold uppercase tracking-wide flex items-center gap-2 ${verdictColor}`}>
                  Verdict: {verification.verdict} 
                  <span className="text-xs text-gray-500 font-normal normal-case">
                    ({Math.round(verification.confidence_score * 100)}% confidence)
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 text-sm mb-1">Explanation</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{verification.explanation}</p>
              </div>

              {verification.source_references && verification.source_references.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm mb-1">Sources</h4>
                  <ul className="list-disc list-inside text-sm text-blue-600">
                    {verification.source_references.map((src: any, i: number) => (
                      <li key={i}>
                        <a href={src.url} className="hover:underline">{src.title}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Footer */}
      <div className="mt-12 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
        Generated by Antigravity Fact-Checker • {new Date().toLocaleString()}
      </div>
    </div>
  )
}
