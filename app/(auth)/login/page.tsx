'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.refresh()
      router.push('/dashboard')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Theme toggle top right */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex mb-5">
            <img src="/logo-dark.png" alt="ViralLens" className="hidden dark:block h-8 w-auto" />
            <img src="/logo-light.png" alt="ViralLens" className="block dark:hidden h-8 w-auto" />
          </div>
          <h1 className="font-serif text-2xl mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Welcome back
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Sign in to your ViralLens account
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'var(--red-subtle)',
                border: '1px solid var(--red-border)',
                color: 'var(--red-text)',
              }}
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full rounded-xl px-4 py-3 text-sm"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="mt-6 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-50"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              boxShadow: '0 2px 8px color-mix(in srgb, var(--accent) 30%, transparent)',
            }}
            onMouseEnter={e => !loading && ((e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)')}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Signing in...
              </span>
            ) : 'Sign in'}
          </button>

          <p className="mt-5 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            No account?{' '}
            <Link
              href="/signup"
              className="font-medium transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              Create one
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-faint)' }}>
          AI-powered content intelligence
        </p>
      </div>
    </div>
  )
}
