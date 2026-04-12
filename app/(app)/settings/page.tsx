'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  return (
    <div className="mx-auto max-w-lg space-y-3">
      <h1 className="text-[18px] font-bold text-text-1">Настройки</h1>
      <div className="rounded-card border border-border bg-white p-3.5 text-[13px]">
        <div className="text-[9px] font-black uppercase tracking-[0.08em] text-text-2">
          Аккаунт
        </div>
        <p className="mt-2 text-text-1">{email ?? '…'}</p>
      </div>
    </div>
  )
}
