'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?message=Could not authenticate user')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('full_name') as string,
      }
    }
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      redirect('/login?message=Email already exists')
    }
    redirect(`/login?message=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (data.url) {
    redirect(data.url)
  }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  
  if (!email) {
    redirect('/login?message=Email is required for password reset')
  }

  const adminClient = await createAdminClient()
  const { data: user } = await adminClient.from('users').select('id').eq('email', email).single()

  if (!user) {
    redirect('/login?message=No account found with this email address')
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
  })

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/login?message=Password reset email sent. Please check your inbox.')
}

export async function setNewPasswordAndSignOut(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    redirect('/reset-password?message=Passwords do not match')
  }

  if (password.length < 6) {
    redirect('/reset-password?message=Password must be at least 6 characters')
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect(`/reset-password?message=${encodeURIComponent(error.message)}`)
  }

  // Sign out after updating password
  await supabase.auth.signOut()

  redirect('/login?message=Password updated successfully. Please sign in with your new password.')
}

export async function resetCurrentUserPassword() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || !user.email) {
    redirect('/dashboard/settings?message=Could not find user email')
  }

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings`,
  })

  if (error) {
    redirect(`/dashboard/settings?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/dashboard/settings?message=Password reset email sent. Please check your inbox.')
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  
  if (!password || password !== confirmPassword) {
    redirect('/dashboard/settings?message=Passwords do not match')
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect(`/dashboard/settings?message=${encodeURIComponent(error.message)}`)
  }

  redirect('/dashboard/settings?message=Password updated successfully')
}
