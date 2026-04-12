import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Language Lab',
  description: 'Персональные занятия по иностранному языку',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
