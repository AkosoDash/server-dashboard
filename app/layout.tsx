import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SRV MONITOR',
  description: 'Server monitoring dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
