'use client'

import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import ThemeToggle from './ThemeToggle'
import Image from 'next/image'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav
      className="sticky top-0 z-40"
      style={{
        background: 'color-mix(in srgb, var(--bg-base) 85%, transparent)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between">
        {/* Logo */}
        <a href="/dashboard" className="flex items-center flex-shrink-0" style={{ height: 28 }}>
          {/* Dark mode logo */}
          <img
            src="/logo-dark.png"
            alt="ViralLens"
            className="hidden dark:block h-7 w-auto"
            style={{ height: 28 }}
          />
          {/* Light mode logo */}
          <img
            src="/logo-light.png"
            alt="ViralLens"
            className="block dark:hidden h-7 w-auto"
            style={{ height: 28 }}
          />
        </a>

        {/* Nav Links */}
        <div className="hidden sm:flex items-center gap-1">
          {[
            { href: '/dashboard', label: 'Analyze' },
            { href: '/history', label: 'History' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                color: pathname === href ? 'var(--text-primary)' : 'var(--text-muted)',
                background: pathname === href ? 'var(--bg-surface-2)' : 'transparent',
              }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-150"
            style={{
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              background: 'var(--bg-surface-2)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
          {/* Mobile sign out */}
          <button
            onClick={handleLogout}
            className="sm:hidden p-2 rounded-lg"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}
            aria-label="Sign out"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}
