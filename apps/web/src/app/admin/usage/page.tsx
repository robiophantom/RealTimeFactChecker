import { Activity, Server, Database } from 'lucide-react'

export default function AdminUsagePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">System Usage</h1>
        <p className="text-zinc-400 mt-2">Monitor API token consumption and background worker health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-white">LLM Tokens</h3>
          </div>
          <p className="text-3xl font-bold text-white mb-1">1.2M</p>
          <p className="text-sm text-zinc-500">Total tokens used this billing cycle</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-white">Worker Queue</h3>
          </div>
          <p className="text-3xl font-bold text-white mb-1">0</p>
          <p className="text-sm text-zinc-500">Jobs pending in Dramatiq Redis</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-white">Verifications</h3>
          </div>
          <p className="text-3xl font-bold text-white mb-1">482</p>
          <p className="text-sm text-zinc-500">Total claims processed globally</p>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 flex items-center justify-center min-h-[300px]">
        <p className="text-zinc-500">Detailed usage charts will be available once more data is collected.</p>
      </div>
    </div>
  )
}
