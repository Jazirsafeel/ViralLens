import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export default async function RootPage() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (session) redirect('/dashboard')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* ── NAV ── */}
      <nav
        className="sticky top-0 z-40"
        style={{
          background: 'color-mix(in srgb, var(--bg-base) 85%, transparent)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo-dark.png" alt="ViralLens" className="hidden dark:block h-7 w-auto" />
            <img src="/logo-light.png" alt="ViralLens" className="block dark:hidden h-7 w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8"
          style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', color: 'var(--accent-text)' }}
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          AI-powered · Built for short-form creators
        </div>

        <h1
          className="font-serif text-4xl sm:text-5xl md:text-6xl mb-6 leading-tight"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
        >
          Know if your content<br />
          will go viral —<br />
          <span style={{ color: 'var(--accent)' }}>before you post.</span>
        </h1>

        <p className="text-lg max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Paste a caption, upload a thumbnail, or drop a video. Get an AI virality score, hook diagnosis, hashtag kit, trending audio picks, and competitor comparison in seconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <Link
            href="/signup"
            className="px-8 py-4 rounded-2xl text-base font-semibold transition-all"
            style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 20px color-mix(in srgb, var(--accent) 35%, transparent)' }}
          >
            Analyze content free
          </Link>
          <a
            href="#how-it-works"
            className="px-8 py-4 rounded-2xl text-base font-medium transition-all"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            See how it works
          </a>
        </div>

        {/* ── MOCK RESULT CARD ── */}
        <div
          className="max-w-sm mx-auto rounded-3xl p-6 text-left"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-faint)', letterSpacing: '0.1em' }}>Virality Score</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}>TikTok</span>
          </div>
          <div className="flex items-end gap-3 mb-5">
            <span className="font-serif text-6xl" style={{ color: 'var(--text-primary)', lineHeight: 1 }}>84</span>
            <span className="text-sm font-medium mb-1" style={{ color: 'var(--green-text)' }}>High Potential</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[['Hook Strength', '9/10', true], ['Emotion', '8/10', true], ['Clarity', '7/10', false], ['Retention', '8/10', true]].map(([label, val, good]) => (
              <div key={label as string} className="rounded-xl p-3" style={{ background: 'var(--bg-surface-2)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--text-faint)' }}>{label}</div>
                <div className="text-sm font-bold" style={{ color: good ? 'var(--green-text)' : 'var(--yellow-text)' }}>{val}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-3" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}>
            <span className="text-xs" style={{ color: 'var(--accent-text)' }}>
              <strong>Shock Hook</strong> detected · Strong open — reinforce with pattern interrupt at 0:08
            </span>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        <h2 className="font-serif text-3xl text-center mb-2" style={{ color: 'var(--text-primary)' }}>Everything a creator needs</h2>
        <p className="text-center text-sm mb-12" style={{ color: 'var(--text-muted)' }}>One tool for the full content optimization loop.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
              title: 'Virality Score',
              desc: 'Instant 0–100 score across hook strength, emotional pull, clarity, and retention potential.',
              accent: true,
            },
            {
              icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>,
              title: 'Trending Audio Picks',
              desc: 'Get 3 platform-matched audio style recommendations that fit your content\'s tone and mood.',
              accent: false,
            },
            {
              icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
              title: 'Hashtag Toolkit',
              desc: 'Platform-specific hashtag sets generated from your content. Copy individually or all at once.',
              accent: false,
            },
            {
              icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
              title: 'Thumbnail / Post Rating',
              desc: 'Upload any image — thumbnail, post, or graphic — and get scored on color, text, emotion, and contrast.',
              accent: false,
            },
            {
              icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.869v6.262a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
              title: 'Video Analysis',
              desc: 'Drop a short-form video — AI transcribes the audio, rates the opening hook, and scores the first frame.',
              accent: false,
            },
            {
              icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
              title: 'Competitor Compare',
              desc: 'Paste any competitor\'s content side-by-side and see exactly where you\'re winning or falling short.',
              accent: false,
            },
          ].map(({ icon, title, desc, accent }) => (
            <div
              key={title}
              className="rounded-2xl p-5 transition-all"
              style={{
                background: accent ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                border: `1px solid ${accent ? 'var(--accent-border)' : 'var(--border)'}`,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: accent ? 'var(--accent-border)' : 'var(--bg-surface-2)', color: accent ? 'var(--accent-text)' : 'var(--accent)' }}
              >
                {icon}
              </div>
              <h3 className="font-semibold text-sm mb-1.5" style={{ color: accent ? 'var(--accent-text)' : 'var(--text-primary)' }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: accent ? 'var(--accent-text)' : 'var(--text-muted)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        <h2 className="font-serif text-3xl text-center mb-2" style={{ color: 'var(--text-primary)' }}>How it works</h2>
        <p className="text-center text-sm mb-12" style={{ color: 'var(--text-muted)' }}>Three steps from content to confident post.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Paste, upload, or drop',
              desc: 'Add your caption, post image, or short-form video. Select your platform — TikTok, Instagram, or YouTube.',
              icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
            },
            {
              step: '02',
              title: 'Get your score',
              desc: 'AI breaks down virality across hook, emotion, clarity, and retention. See your hook type, diagnosis, and a rewritten version.',
              icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
            },
            {
              step: '03',
              title: 'Apply and post',
              desc: 'Copy your hashtags, pick a trending audio style, steal the improved hook, and post with confidence.',
              icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
            },
          ].map(({ step, title, desc, icon }) => (
            <div key={step} className="relative rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}
              >
                {icon}
              </div>
              <div className="font-serif text-4xl absolute top-5 right-5 opacity-10" style={{ color: 'var(--accent)' }}>{step}</div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PLATFORM BADGES ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 text-center">
        <p className="text-xs font-medium uppercase tracking-widest mb-6" style={{ color: 'var(--text-faint)', letterSpacing: '0.12em' }}>Optimized for</p>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { name: 'TikTok', desc: 'Hook + trend weighting' },
            { name: 'Instagram', desc: 'Visual + caption scoring' },
            { name: 'YouTube', desc: 'Retention + thumbnail' },
          ].map(({ name, desc }) => (
            <div
              key={name}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{name}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-28 text-center">
        <div
          className="rounded-3xl p-12"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--accent-border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <h2 className="font-serif text-3xl mb-3" style={{ color: 'var(--text-primary)' }}>Ready to go viral?</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Free to use. No card required. Results in seconds.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold transition-all"
            style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 20px color-mix(in srgb, var(--accent) 35%, transparent)' }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Start analyzing free
          </Link>
          <p className="mt-4 text-xs" style={{ color: 'var(--text-faint)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent-text)' }}>Sign in</Link>
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="text-center pb-10" style={{ color: 'var(--text-faint)', fontSize: 12 }}>
        ViralLens · AI Content Intelligence
      </footer>
    </div>
  )
}
