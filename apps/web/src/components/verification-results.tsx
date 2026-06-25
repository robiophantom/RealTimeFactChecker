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

    // 4. Cleanup the subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel)
    }
  }, [uploadId])

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

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-zinc-950 border border-zinc-800/50 rounded-2xl">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full mb-4"
        />
        <p className="text-zinc-400">Processing input and analyzing claims...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
        </span>
        Live Verifications
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
