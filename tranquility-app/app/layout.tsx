import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tranquility',
  description: 'Created to help you manage your mental health and well-being.',
  generator: 'v0.app',
  icons: {
  icon: [
    {
      url: '/logo.svg', // Maps directly to public/logo.svg
      type: 'image/svg+xml',
    },
  ],
  apple: '/logo.svg', // SVG works here too, or keep a separate PNG if preferred
},
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
