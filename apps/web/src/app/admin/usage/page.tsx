import { Activity, Server, Database, FileText, UploadCloud, Video } from 'lucide-react'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminUsagePage() {
  const supabase = await createClient()

  // Ensure Admin Access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminClient = await createAdminClient()

  // 1. Fetch Total Media Uploads (Audio/Video)
  const { count: mediaUploads } = await adminClient
    .from('uploads')
    .select('*', { count: 'exact', head: true })
    .or('file_type.ilike.audio/%,file_type.ilike.video/%')

  // 2. Fetch Total Text Uploads
  const { count: textUploads } = await adminClient
    .from('uploads')
    .select('*', { count: 'exact', head: true })
    .ilike('file_type', 'text/%')

  // 3. Fetch Total Processed Claims
  const { count: totalClaims } = await adminClient
    .from('claims')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">System Usage</h1>
        <p className="text-zinc-400 mt-2">Monitor data processing metrics and system load.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-white">Media Processed</h3>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{(mediaUploads || 0).toLocaleString()}</p>
          <p className="text-sm text-zinc-500">Audio and Video files uploaded</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-white">Text Verifications</h3>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{(textUploads || 0).toLocaleString()}</p>
          <p className="text-sm text-zinc-500">Direct text and document inputs</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-white">Total Claims</h3>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{(totalClaims || 0).toLocaleString()}</p>
          <p className="text-sm text-zinc-500">Individual facts processed globally</p>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 flex items-center justify-center min-h-[300px]">
        <p className="text-zinc-500">Detailed usage charts will be available once more data is collected.</p>
      </div>
    </div>
  )
}
