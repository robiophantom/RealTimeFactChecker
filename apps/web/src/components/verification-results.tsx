'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, ExternalLink } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface Verification {
  id: string
  claim_text: string
  context: string
  verdict: 'True' | 'False' | 'Partially True' | 'Insufficient Evidence'
  confidence_score: number
  explanation: string
  source_references: Array<{title: string, url: string}>
}

export function VerificationResults({ uploadId }: { uploadId: string }) {
  const [results, setResults] = useState<Verification[]>([])
  const [processingStep, setProcessingStep] = useState<string>('Initializing processing...')
  const [processingStatus, setProcessingStatus] = useState<string>('processing')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [reportSummary, setReportSummary] = useState<any>(null)
  
  useEffect(() => {
    // 1. Initialize the Supabase browser client
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 2. Create a realtime channel to listen for changes to claim_verifications
    const channel = supabase
      .channel(`verifications-for-${uploadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'claim_verifications',
          // Note: In a production scenario with high concurrency, you might want to filter
          // directly here if your table had an `upload_id` column, but since our schema links
          // claim_verifications -> claims -> transcripts -> uploads, we listen broadly and 
          // filter if needed, or simply assume a dedicated room per upload.
        },
        (payload) => {
          // 3. Update the state with the newly verified claim
          const newVerification = payload.new as Verification
          setResults((prev) => [newVerification, ...prev])
        }
      )
      .subscribe()

    // 4. Poll for backend status
    const pollInterval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(`http://localhost:8000/api/v1/upload/${uploadId}/status`, {
          headers: {
            ...(session && { 'Authorization': `Bearer ${session.access_token}` })
          }
        })
        
        if (res.ok) {
          const data = await res.json()
          setProcessingStep(data.step)
          setProcessingStatus(data.status)
          if (data.status === 'failed') {
            setErrorMessage(data.error_message || 'An unknown error occurred.')
            clearInterval(pollInterval)
          }
          if (data.status === 'completed') {
            clearInterval(pollInterval)
            const { data: report } = await supabase.from('reports').select('*').eq('upload_id', uploadId).single()
            if (report) setReportSummary(report)
          }
        }
      } catch (err) {
        console.error("Failed to poll status", err)
      }
    }, 2000)

    // 5. Cleanup the subscription and interval when the component unmounts
    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [uploadId])

  const handleCancel = async () => {
    setIsCancelling(true)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { session } } = await supabase.auth.getSession()
    
    await fetch(`http://localhost:8000/api/v1/upload/${uploadId}/cancel`, {
      method: 'POST',
      headers: {
        ...(session && { 'Authorization': `Bearer ${session.access_token}` })
      }
    })
  }

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

  if (processingStatus === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-500/10 border border-red-500/20 rounded-2xl">
        <XCircle className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Processing Failed</h3>
        <p className="text-red-400/80 text-center max-w-md">{errorMessage || 'An unknown error occurred during processing.'}</p>
      </div>
    )
  }

  if (results.length === 0 && processingStatus !== 'completed') {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-zinc-950 border border-zinc-800/50 rounded-2xl">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full mb-4"
        />
        <p className="text-white font-medium mb-1">{processingStep}</p>
        <p className="text-sm text-zinc-500 mb-6">Processing input and analyzing claims...</p>
        
        <button 
          onClick={handleCancel}
          disabled={isCancelling}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg transition-colors border border-red-500/20 disabled:opacity-50"
        >
          {isCancelling ? 'Stopping...' : 'Stop Processing'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {reportSummary && (
        <div className="p-6 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl">
          <h2 className="text-2xl font-bold text-white mb-2">Verification Complete</h2>
          <p className="text-indigo-200 mb-6">{reportSummary.summary}</p>
          
          <div className="flex gap-6 mb-6">
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-white">{reportSummary.total_claims}</span>
              <span className="text-sm text-zinc-400">Total Claims</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-emerald-400">{reportSummary.true_claims}</span>
              <span className="text-sm text-emerald-400/80">True</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-red-400">{reportSummary.false_claims}</span>
              <span className="text-sm text-red-400/80">False</span>
            </div>
          </div>
          
          <div className="flex gap-4">
            <a 
              href={`/dashboard/reports/${reportSummary.id}`}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              View Full Report
            </a>
            <a 
              href={`/dashboard/reports/${reportSummary.id}/print`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 rounded-lg text-sm font-medium transition-colors"
            >
              Export PDF
            </a>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold flex items-center gap-2">
        {processingStatus !== 'completed' && (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
        )}
        {processingStatus === 'completed' ? 'Verified Claims' : 'Live Verifications'}
      </h2>
      
      <div className="space-y-4">
        <AnimatePresence>
          {results.map((res) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`p-6 rounded-xl border ${getVerdictBg(res.verdict)}`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getVerdictIcon(res.verdict)}
                    <span className="font-semibold text-sm tracking-wide uppercase text-white">
                      {res.verdict}
                    </span>
                    <span className="text-xs text-zinc-500 ml-2">
                      {Math.round(res.confidence_score * 100)}% confidence
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-white">"{res.claim_text}"</h3>
                </div>
              </div>
              
              <div className="bg-black/40 rounded-lg p-4">
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {res.explanation}
                </p>
                
                {res.source_references && res.source_references.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2">
                    {res.source_references.map((src, i) => (
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
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
