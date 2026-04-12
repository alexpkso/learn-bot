import type { Metadata } from 'next'
import { unstable_noStore as noStore } from 'next/cache'
import { SupabaseEnvInjector } from '@/components/supabase/SupabaseEnvInjector'
import { getSupabasePublicEnvOrNull } from '@/lib/supabase/env'
import './globals.css'

/** Иначе env читается на этапе `next build` и в статическую разметку попадает publicEnv=null. */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Language Lab',
  description: 'Персональные занятия по иностранному языку',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  noStore()
  const publicEnv = getSupabasePublicEnvOrNull()
  return (
    <html lang="ru">
      <body>
        <SupabaseEnvInjector env={publicEnv}>{children}</SupabaseEnvInjector>
      </body>
    </html>
  )
}
