import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LandingContent } from '@/components/landing-content'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return <LandingContent />
}
