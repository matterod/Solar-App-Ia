import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: { value: number; label: string }
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  className?: string
}

const variantStyles = {
  default: 'border-white/5',
  primary: 'border-sky-500/20',
  success: 'border-emerald-500/20',
  warning: 'border-amber-500/20',
  danger: 'border-red-500/20',
}

const trendColor = (value: number) =>
  value > 0 ? 'text-emerald-400' : value < 0 ? 'text-red-400' : 'text-slate-400'

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-slate-900 p-5 shadow-2xl',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-1.5 text-2xl font-semibold text-slate-50">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="rounded-lg bg-sky-500/10 p-2.5 text-sky-400">
            <Icon className="h-4 w-4 text-sky-400" />
          </div>
        )}
      </div>
      {trend && (
        <p className={cn('mt-3 text-xs font-medium', trendColor(trend.value))}>
          {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
        </p>
      )}
    </div>
  )
}
