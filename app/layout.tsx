import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'ViralLens — AI Content Virality Analyzer',
    template: '%s | ViralLens',
  },
  description: 'Know if your content will go viral before you post. AI-powered virality scores, hook analysis, hashtag kits, and thumbnail ratings for TikTok, Instagram, and YouTube creators.',
  keywords: ['virality analyzer', 'content score', 'TikTok hook analyzer', 'viral score', 'AI content tool', 'hashtag generator', 'thumbnail rating', 'Instagram Reels', 'YouTube Shorts'],
  authors: [{ name: 'ViralLens' }],
  creator: 'ViralLens',
  metadataBase: new URL('https://virallens.app'), // replace with your domain
  openGraph: {
    type: 'website',
    url: 'https://virallens.app',
    title: 'ViralLens — AI Content Virality Analyzer',
    description: 'Know if your content will go viral before you post. Instant AI scores for TikTok, Instagram, and YouTube.',
    siteName: 'ViralLens',
    images: [
      {
        url: '/og-image.png', // put a 1200x630 image in public/
        width: 1200,
        height: 630,
        alt: 'ViralLens — AI Content Virality Analyzer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ViralLens — AI Content Virality Analyzer',
    description: 'Know if your content will go viral before you post.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/logo-light.png',
    apple: '/logo-light.png',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No-flash theme init — must run before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('vl-theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored === 'dark' || (!stored && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
