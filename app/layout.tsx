import type { Metadata } from 'next'
import { SupabaseEnvInjector } from '@/components/supabase/SupabaseEnvInjector'
import { getSupabasePublicEnvOrNull } from '@/lib/supabase/env'
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
  const publicEnv = getSupabasePublicEnvOrNull()
  return (
    <html lang="ru">
      <body>
        <SupabaseEnvInjector env={publicEnv}>{children}</SupabaseEnvInjector>
      </body>
    </html>
  )
}
