import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AP Election Simulator',
  description: 'Simulation dashboard for Andhra Pradesh election analytics.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen font-sans">
        <main className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
