'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export interface TabNavItem {
  label: string
  href: string
}

interface InstallationTabNavProps {
  tabs: TabNavItem[]
}

export function InstallationTabNav({ tabs }: InstallationTabNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 border-b border-white/5">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              isActive
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
