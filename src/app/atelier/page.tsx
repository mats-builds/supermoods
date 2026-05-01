import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AtelierLoginClient from './LoginClient'

export default async function AtelierPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/atelier/dashboard')
  return <AtelierLoginClient />
}
