'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, ExternalLink, Printer, FileText, CheckSquare } from 'lucide-react'
import Link from 'next/link'

export function ReportViewer({ report, claims, transcript }: { report: any, claims: any, transcript: string }) {
  const [activeTab, setActiveTab] = useState<'report' | 'source'>('report')

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'True': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      case 'False': return <XCircle className="w-5 h-5 text-red-400" />
      case 'Partially True': return <AlertTriangle className="w-5 h-5 text-indigo-400" />
      default: return <HelpCircle className="w-5 h-5 text-zinc-400" />
    }
  }

  const getVerdictBg = (verdict: string) => {
    switch (verdict) {
      case 'True': return 'bg-emerald-500/10 border-emerald-500/20'
      case 'False': return 'bg-red-500/10 border-red-500/20'
      case 'Partially True': return 'bg-indigo-500/10 border-indigo-500/20'
      default: return 'bg-zinc-500/10 border-zinc-500/20'
    }
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-8 border-b border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Fact-Check Report</h1>
            <p className="text-zinc-400">
              Source: <span className="text-zinc-200 font-medium">{report.uploads?.filename || 'Unknown Source'}</span> • 
              Verified on {new Date(report.created_at).toLocaleDateString('en-US')}
            </p>
          </div>
          <Link 
            href={`/report/${report.id}/print`} 
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Printer className="w-4 h-4" /> Export PDF
          </Link>
        </div>

        <div className="flex bg-zinc-900 rounded-lg p-1 w-full max-w-md border border-zinc-800">
          <button
            onClick={() => setActiveTab('report')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${activeTab === 'report' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
          >
            <CheckSquare className="w-4 h-4" />
            Verification Results
          </button>
          <button
            onClick={() => setActiveTab('source')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${activeTab === 'source' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
          >
            <FileText className="w-4 h-4" />
            Source Text
          </button>
        </div>
      </div>

      <div className="p-8">
        {activeTab === 'report' ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl mb-8 shadow-inner">
              <p className="text-indigo-100 mb-6 text-lg leading-relaxed">{report.summary}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col p-4 bg-black/20 rounded-lg border border-white/5">
                  <span className="text-3xl font-bold text-white">{report.total_claims}</span>
                  <span className="text-sm text-zinc-400 font-medium">Total Claims</span>
                </div>
                <div className="flex flex-col p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                  <span className="text-3xl font-bold text-emerald-400">{report.true_claims}</span>
                  <span className="text-sm text-emerald-400/80 font-medium">True</span>
                </div>
                <div className="flex flex-col p-4 bg-red-500/5 rounded-lg border border-red-500/10">
                  <span className="text-3xl font-bold text-red-400">{report.false_claims}</span>
                  <span className="text-sm text-red-400/80 font-medium">False</span>
                </div>
                <div className="flex flex-col p-4 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
                  <span className="text-3xl font-bold text-indigo-400">{report.partially_true_claims}</span>
                  <span className="text-sm text-indigo-400/80 font-medium">Mixed</span>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-400" />
              Detailed Verifications
            </h2>
            
            <div className="space-y-6">
              {claims?.map((claim: any) => {
                const verification = claim.claim_verifications[0]
                if (!verification) return null
                
                return (
                  <div key={claim.id} className={`p-6 rounded-xl border transition-all duration-300 hover:shadow-lg ${getVerdictBg(verification.verdict)}`}>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          {getVerdictIcon(verification.verdict)}
                          <span className="font-semibold text-sm tracking-wide uppercase text-white">
                            {verification.verdict}
                          </span>
                          <span className="text-xs font-medium px-2 py-1 bg-black/30 rounded-full text-zinc-400 ml-2 border border-white/5">
                            {Math.round(verification.confidence_score * 100)}% confidence
                          </span>
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2 leading-snug">"{claim.claim_text}"</h3>
                        {claim.context && (
                          <p className="text-sm text-zinc-400 italic mb-4">Context: {claim.context}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-black/40 rounded-lg p-5 border border-white/5">
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
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/30 px-3 py-1.5 rounded-md transition-colors border border-indigo-500/20"
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
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Source Transcript
            </h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-inner">
              {transcript ? (
                <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-loose whitespace-pre-wrap">
                  {transcript}
                </div>
              ) : (
                <div className="text-zinc-500 italic text-center py-12">
                  No source transcript available for this report.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
