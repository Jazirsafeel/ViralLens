import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Navbar from '@/components/Navbar'
import HistoryClient from './HistoryClient'

export default async function HistoryPage() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const { data: analyses } = await supabase
    .from('analyses').select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl mb-1.5" style={{ color: 'var(--text-primary)' }}>History</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All your past analyses, searchable and filterable.</p>
        </div>
        <HistoryClient analyses={analyses ?? []} />
      </main>
    </div>
  )
}
