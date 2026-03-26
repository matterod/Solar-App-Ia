'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Breadcrumb } from '@/components/dashboard/breadcrumb'
import { queryKeys } from '@/lib/query-keys'
import { clients } from '@/services/api'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default function ClientDetailLayout({ children, params }: LayoutProps) {
  const { id } = use(params)

  const { data: client } = useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: () => clients.get(id),
    staleTime: 1000 * 60 * 5,
  })

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/5 bg-slate-950/80 px-6 py-4 backdrop-blur-sm">
        <Link
          href="/dashboard/clients"
          className="mb-3 flex w-fit items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a Clientes
        </Link>
        <Breadcrumb
          items={[
            { label: 'Clientes', href: '/dashboard/clients' },
            { label: client?.name ?? 'Detalle' },
          ]}
        />
      </div>
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  )
}
