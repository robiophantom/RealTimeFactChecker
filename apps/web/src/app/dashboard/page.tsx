'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { UploadZone } from '@/components/upload-zone'
import { RealtimeMic } from '@/components/realtime-mic'
import { TextInput } from '@/components/text-input'
import { VerificationResults } from '@/components/verification-results'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'mic' | 'text'>('upload')
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Verification</h1>
        <p className="text-zinc-400 mt-2">Upload media, stream audio, or paste text to extract and verify factual claims.</p>
      </div>

      <div className="bg-zinc-950 border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex border-b border-zinc-800/50">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === 'upload' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            File Upload
            {activeTab === 'upload' && (
              <motion.div layoutId="active-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === 'text' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Paste Text
            {activeTab === 'text' && (
              <motion.div layoutId="active-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('mic')}
            className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === 'mic' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Live Microphone
            {activeTab === 'mic' && (
              <motion.div layoutId="active-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
            )}
          </button>
        </div>

        <div className="p-8 min-h-[300px]">
          {activeTab === 'upload' && <UploadZone onUploadStarted={(id) => setCurrentUploadId(id)} />}
          {activeTab === 'text' && <TextInput onProcessStarted={(id) => setCurrentUploadId(id)} />}
          {activeTab === 'mic' && <RealtimeMic onStreamStarted={(id) => setCurrentUploadId(id)} />}
        </div>
      </div>

      {currentUploadId && (
        <VerificationResults uploadId={currentUploadId} />
      )}
    </div>
  )
}
