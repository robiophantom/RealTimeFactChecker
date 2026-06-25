'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mic, Square, Radio, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function RealtimeMic({ onStreamStarted }: { onStreamStarted: (id: string) => void }) {
  const [isRecording, setIsRecording] = useState(false)
  const [volume, setVolume] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        // Mock volume meter
        setVolume(Math.random() * 100)
      }, 100)
    } else {
      setVolume(0)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.start(250) // Emit chunks every 250ms
      setIsRecording(true)
    } catch (err) {
      console.error("Error accessing microphone", err)
      alert("Microphone access denied or unavailable.")
    }
  }

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      // First, capture the stop event
      const stopped = new Promise((resolve) => {
        mediaRecorderRef.current!.onstop = resolve
      })
      
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      
      await stopped
      
      // Now all chunks are ready
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      if (blob.size === 0) return
      
      setIsUploading(true)
      
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        const formData = new FormData()
        // Append it as a file
        formData.append('file', blob, 'recorded_audio.webm')

        const response = await fetch('http://localhost:8000/api/v1/upload', {
          method: 'POST',
          headers: {
            ...(session && { 'Authorization': `Bearer ${session.access_token}` })
          },
          body: formData,
        })

        if (!response.ok) throw new Error('Upload failed')

        const data = await response.json()
        if (data.upload_id) {
          onStreamStarted(data.upload_id)
        }
      } catch (err) {
        console.error("Upload error", err)
        alert("Failed to process recording.")
      } finally {
        setIsUploading(false)
      }
    }
  }

  return (
    <div className="w-full flex flex-col items-center justify-center p-8">
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-indigo-500 rounded-full blur-3xl opacity-20" />
        
        <div className="relative w-48 h-48 rounded-full border border-zinc-800 bg-zinc-900/50 flex items-center justify-center">
          {/* Visualizer rings */}
          {isRecording && [1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border border-indigo-500/30"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1 + (volume / 100) * i * 0.5, opacity: 0 }}
              transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
            />
          ))}
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl z-10 disabled:opacity-50
              ${isRecording 
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : isRecording ? (
              <Square className="w-8 h-8 fill-current" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-xl font-medium text-white mb-2">
          {isUploading ? 'Uploading...' : isRecording ? 'Listening live...' : 'Click to start verifying'}
        </h3>
        <p className="text-sm text-zinc-500 flex items-center justify-center gap-2">
          {isRecording ? (
            <>
              <motion.span 
                animate={{ opacity: [1, 0.5, 1] }} 
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-red-500"
              />
              Recording audio securely
            </>
          ) : isUploading ? (
            'Processing your recording...'
          ) : (
            <>
              <Radio className="w-4 h-4" />
              Record audio directly for fact-checking
            </>
          )}
        </p>
      </div>
    </div>
  )
}
