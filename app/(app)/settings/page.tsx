'use client'

import { useEffect, useState } from 'react'
import { formatLoginFromAuthEmail } from '@/lib/auth/login-identifier'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [identity, setIdentity] = useState<string | null>(null)

  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(({ data }) =>
        setIdentity(formatLoginFromAuthEmail(data.user?.email ?? null))
      )
  }, [])

  return (
    <div className="mx-auto max-w-lg space-y-3">
      <h1 className="text-[18px] font-bold text-text-1">Настройки</h1>
      <div className="rounded-card border border-border bg-white p-3.5 text-[13px]">
        <div className="text-[9px] font-black uppercase tracking-[0.08em] text-text-2">
          Ваш логин
        </div>
        <p className="mt-2 font-mono text-text-1">{identity ?? '…'}</p>
      </div>
    </div>
  )
}
