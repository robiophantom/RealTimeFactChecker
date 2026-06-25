import { createClient, createAdminClient } from '@/utils/supabase/server'
import { Users as UsersIcon, ShieldAlert, Mail } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  
  // Ensure Admin Access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch users using Service Role to bypass RLS
  const adminClient = await createAdminClient()
  const { data: users } = await adminClient.from('users').select('*').order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Manage Users</h1>
        <p className="text-zinc-400 mt-2">View and manage all registered accounts in the system.</p>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-zinc-300">
            <thead className="text-xs text-zinc-500 bg-zinc-900/50 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">User ID</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {users?.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                    {u.id.split('-')[0]}...
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-zinc-500" />
                      {u.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-rose-400 hover:text-rose-300 inline-flex items-center gap-1 transition-colors text-xs font-medium">
                      <ShieldAlert className="w-4 h-4" />
                      Suspend
                    </button>
                  </td>
                </tr>
              ))}
              {(!users || users.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
