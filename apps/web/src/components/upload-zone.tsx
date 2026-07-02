'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, File as FileIcon, X, AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function UploadZone({ onUploadStarted }: { onUploadStarted: (id: string) => void }) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limits, setLimits] = useState({ max_media_size_mb: 50, max_text_size_mb: 10 })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/limits`)
      .then(res => res.json())
      .then(data => {
        if (data) setLimits(data)
      })
      .catch(console.error)
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleFile = (selectedFile: File) => {
    setError(null)
    const validTypes = ['audio/mpeg', 'audio/wav', 'video/mp4', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload audio, video, PDF, DOCX, or TXT.')
      return
    }
    
    const isMedia = selectedFile.type.startsWith("audio/") || selectedFile.type.startsWith("video/")
    const max_mb = isMedia ? limits.max_media_size_mb : limits.max_text_size_mb
    
    if (selectedFile.size > max_mb * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${max_mb}MB for this file type.`)
      return
    }
    setFile(selectedFile)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/upload`, {
        method: 'POST',
        headers: {
          ...(session && { 'Authorization': `Bearer ${session.access_token}` })
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to upload file to backend')
      }
      
      if (data.upload_id) {
        onUploadStarted(data.upload_id)
      }
      
    } catch (e: any) {
      console.error("Upload failed", e)
      setError(e.message || "There was an error uploading your file.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full">
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
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors flex flex-col items-center justify-center
              ${dragActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={handleChange}
              accept="audio/*,video/*,application/pdf,.txt,.docx"
            />
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4 text-zinc-400">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Click or drag file to this area to upload</h3>
            <p className="text-sm text-zinc-500 max-w-sm">
              Support for audio (mp3, wav), video (mp4), and documents (pdf, docx, txt).
            </p>
            <button 
              onClick={() => inputRef.current?.click()}
              className="mt-6 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Select File
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-400">
              <FileIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-white truncate max-w-[80%]">{file.name}</h3>
            <p className="text-sm text-zinc-500 mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            
            <div className="flex gap-4 w-full max-w-xs">
              <button 
                onClick={() => setFile(null)}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {uploading ? (
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  'Process'
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
