'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BookOpen,
  ChartColumnBig,
  Grid2X2,
  GraduationCap,
  List,
  LogOut,
  Settings,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navBase =
  'flex items-center gap-2.5 rounded-md px-3.5 py-2 text-[12.5px] text-slate-600 transition-colors hover:bg-gray-50'
const navActive =
  'bg-primary-light font-semibold text-primary before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:rounded-r-sm before:bg-primary'

const items = [
  { href: '/dashboard', label: 'Дашборд', Icon: Grid2X2 },
  { href: '/lesson', label: 'Занятие', Icon: BookOpen },
  { href: '/vocabulary', label: 'Словарь', Icon: List },
  { href: '/progress', label: 'Прогресс', Icon: ChartColumnBig },
  { href: '/program', label: 'Программа', Icon: GraduationCap },
  { href: '/settings', label: 'Настройки', Icon: Settings },
] as const

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-border bg-white px-2 py-4">
      <div className="mb-4 px-3">
        <span className="text-[11px] font-black uppercase tracking-[0.05em] text-text-1">
          Language Lab
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5" aria-label="Основное меню">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={`relative ${navBase} ${active ? navActive : ''}`}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={1.75} />
              {label}
            </Link>
          )
        })}
      </nav>
      <button
        type="button"
        onClick={() => void logout()}
        className="mt-auto flex items-center gap-2.5 rounded-md px-3.5 py-2 text-left text-[12.5px] font-medium text-red-600 hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.75} />
        Выйти
      </button>
    </aside>
  )
}
