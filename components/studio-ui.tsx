import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string
  description?: string
  eyebrow?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        {eyebrow && <p className="text-sm text-muted-foreground">{eyebrow}</p>}
        <h1 className="font-serif text-3xl font-medium text-balance md:text-4xl">{title}</h1>
        {description && <p className="max-w-prose text-sm text-muted-foreground text-pretty">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-serif text-xl font-medium">{children}</h2>
      {action}
    </div>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-3xl border bg-card p-5', className)}>{children}</div>
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'sage',
}: {
  label: string
  value: ReactNode
  hint?: string
  icon: LucideIcon
  tone?: 'sage' | 'earth' | 'sand'
}) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border bg-card p-4">
      <span
        className={cn(
          'flex size-9 items-center justify-center rounded-full',
          tone === 'sage' && 'bg-accent text-accent-foreground',
          tone === 'earth' && 'bg-earth-soft text-earth',
          tone === 'sand' && 'bg-secondary text-secondary-foreground',
        )}
      >
        <Icon className="size-4.5" aria-hidden />
      </span>
      <div>
        <p className="font-serif text-3xl font-medium tabular-nums">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}

export function OccupancyBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label="Ocupación"
    >
      <div className={cn('h-full rounded-full', pct >= 100 ? 'bg-earth' : 'bg-primary')} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed bg-card/50 px-6 py-10 text-center">
      <Icon className="size-6 text-muted-foreground" aria-hidden />
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted-foreground text-pretty">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function Pill({ tone = 'sand', children }: { tone?: 'sage' | 'earth' | 'sand' | 'danger'; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        tone === 'sage' && 'bg-accent text-accent-foreground',
        tone === 'earth' && 'bg-earth-soft text-earth',
        tone === 'sand' && 'bg-secondary text-secondary-foreground',
        tone === 'danger' && 'bg-destructive/10 text-destructive',
      )}
    >
      {children}
    </span>
  )
}

export const fieldClass =
  'h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30'
