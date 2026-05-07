import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Navbar from '@/components/Navbar'
import AnalyzeForm from './AnalyzeForm'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data: analyses } = await supabase
    .from('analyses')
    .select('id, content, result, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Content Analyzer
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Paste your content and receive an instant virality intelligence report.
          </p>
        </div>
        <AnalyzeForm recentAnalyses={analyses ?? []} />
      </main>
    </div>
  )
}
