'use client'

import { useState } from 'react'
import { FileText, Download, Clock, CheckCircle2, XCircle, Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export function ReportTable({ initialReports }: { initialReports: any[] }) {
  const [reports, setReports] = useState(initialReports)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  const toggleAll = () => {
    if (selectedIds.size === reports.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(reports.map(r => r.upload_id)))
    }
  }

  const toggleOne = (uploadId: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(uploadId)) {
      newSet.delete(uploadId)
    } else {
      newSet.add(uploadId)
    }
    setSelectedIds(newSet)
  }

  const handleDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} report(s)? This action cannot be undone.`)) return

    setIsDeleting(true)
    const supabase = createClient()
    
    try {
      // Deleting the upload cascade deletes reports, transcripts, claims
      const { error } = await supabase
        .from('uploads')
        .delete()
        .in('id', Array.from(selectedIds))

      if (error) throw error

      setReports(reports.filter(r => !selectedIds.has(r.upload_id)))
      setSelectedIds(new Set())
    } catch (e) {
      console.error("Failed to delete reports:", e)
      alert("Failed to delete reports. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden p-12 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 text-zinc-500">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No reports yet</h3>
        <p className="text-zinc-500">Run your first verification from the dashboard to generate a report.</p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
      {selectedIds.size > 0 && (
        <div className="bg-indigo-900/30 border-b border-zinc-800 p-4 flex items-center justify-between">
          <span className="text-indigo-200 text-sm font-medium">{selectedIds.size} report(s) selected</span>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : 'Delete Selected'}
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 bg-zinc-900/50 border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-medium w-12">
                <input 
                  type="checkbox" 
                  checked={selectedIds.size === reports.length && reports.length > 0}
                  onChange={toggleAll}
                  className="rounded border-zinc-700 bg-zinc-800 text-indigo-500 focus:ring-indigo-500/30 w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="px-6 py-4 font-medium">Source File</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Total Claims</th>
              <th className="px-6 py-4 font-medium">Verdict Breakdown</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-zinc-900/50 transition-colors">
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(report.upload_id)}
                    onChange={() => toggleOne(report.upload_id)}
                    className="rounded border-zinc-700 bg-zinc-800 text-indigo-500 focus:ring-indigo-500/30 w-4 h-4 cursor-pointer"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <Link href={`/dashboard/reports/${report.id}`} className="font-medium text-zinc-200 hover:text-indigo-400 transition-colors">
                      {report.uploads?.filename || 'Live Microphone Session'}
                    </Link>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Clock className="w-3 h-3" />
                    {new Date(report.created_at).toLocaleDateString('en-US')}
                  </div>
                </td>
                <td className="px-6 py-4 text-zinc-300 font-medium">
                  {report.total_claims}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> {report.true_claims} True
                    </div>
                    <div className="flex items-center gap-1 text-red-400">
                      <XCircle className="w-3 h-3" /> {report.false_claims} False
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link 
                      href={`/dashboard/reports/${report.id}`}
                      className="text-zinc-400 hover:text-indigo-300 inline-flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </Link>
                    <Link 
                      href={`/report/${report.id}/print`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
