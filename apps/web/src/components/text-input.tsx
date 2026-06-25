'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Type, Send } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function TextInput({ onProcessStarted }: { onProcessStarted: (id: string) => void }) {
  const [text, setText] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    
    setProcessing(true)
    
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      // Send the text to the FastAPI backend
      const response = await fetch('http://localhost:8000/api/v1/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session && { 'Authorization': `Bearer ${session.access_token}` })
        },
        body: JSON.stringify({ text: text }),
      })

      if (!response.ok) {
        throw new Error('Failed to send text to backend')
      }

      const data = await response.json()
      
      if (data.upload_id) {
        onProcessStarted(data.upload_id)
      }
      
    } catch (error) {
      console.error("Text processing failed", error)
      alert("There was an error processing your text. Please check if the backend is running.")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <div className="absolute top-4 left-4 text-zinc-500">
            <Type className="w-5 h-5" />
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type the text you want to fact-check here..."
            className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-indigo-500/50 rounded-xl pl-12 pr-4 py-4 min-h-[200px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-y"
            disabled={processing}
            maxLength={5000}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <p className={`text-xs ${text.length >= 5000 ? 'text-red-400 font-medium' : 'text-zinc-500'}`}>
            {text.length} / 5000 characters
          </p>
          <button 
            type="submit"
            disabled={processing || text.trim().length === 0 || text.length > 5000}
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
