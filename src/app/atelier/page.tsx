import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AtelierLoginClient from './LoginClient'

export default async function AtelierPage() {
  const cookieStore = await cookies()
  if (cookieStore.get('atelier_auth')?.value === 'true') {
    redirect('/atelier/dashboard')
  }
  return <AtelierLoginClient />
}
