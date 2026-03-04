import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DayLoop — Your daily planning loop',
  description: 'Plan tomorrow each evening. Get a morning email with one-click done buttons.',
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
