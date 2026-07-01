'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Type, Send, AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function TextInput({ onProcessStarted }: { onProcessStarted: (id: string) => void }) {
  const [text, setText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limits, setLimits] = useState({ max_text_length: 100000 })

  // Load from localStorage and fetch limits on mount
  useEffect(() => {
    const saved = localStorage.getItem('factCheckerTextDraft')
    if (saved) setText(saved)
    
    fetch('http://localhost:8000/api/v1/limits')
      .then(res => res.json())
      .then(data => {
        if (data) setLimits(data)
      })
      .catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    
    setProcessing(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('http://localhost:8000/api/v1/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session && { 'Authorization': `Bearer ${session.access_token}` })
        },
        body: JSON.stringify({ text: text }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send text to backend')
      }
      
      if (data.upload_id) {
        localStorage.removeItem('factCheckerTextDraft')
        setText('')
        onProcessStarted(data.upload_id)
      }
      
    } catch (e: any) {
      console.error("Text processing failed", e)
      setError(e.message || "There was an error processing your text. Please check if the backend is running.")
    } finally {
      setProcessing(false)
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setText(newText)
    localStorage.setItem('factCheckerTextDraft', newText)
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-rose-400">{error}</p>
        </motion.div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <div className="absolute top-4 left-4 text-zinc-500">
            <Type className="w-5 h-5" />
          </div>
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Paste or type the text you want to fact-check here..."
            className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-500/50 rounded-xl pl-12 pr-4 py-4 min-h-[200px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-y"
            disabled={processing}
            maxLength={limits.max_text_length}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <p className={`text-xs ${text.length >= limits.max_text_length ? 'text-red-400 font-medium' : 'text-zinc-500'}`}>
            {text.length} / {limits.max_text_length} characters
          </p>
          <button 
            type="submit"
            disabled={processing || text.trim().length === 0 || text.length > limits.max_text_length}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Fact-Check Text
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
