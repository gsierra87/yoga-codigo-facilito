'use client'

import {
  Bell,
  CalendarCheck,
  CalendarX,
  CircleMinus,
  CirclePlus,
  Clock,
  MessageCircle,
  RotateCcw,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { EmptyState } from '@/components/studio-ui'
import { formatDateTime, timeAgo } from '@/lib/format'
import type { AppNotification, Movement, NotificationKind } from '@/lib/types'
import { cn } from '@/lib/utils'

const movementMeta: Record<Movement['type'], { icon: LucideIcon; label: string; tone: string }> = {
  purchase: { icon: CirclePlus, label: 'Compra', tone: 'bg-accent text-accent-foreground' },
  consumed: { icon: CircleMinus, label: 'Clase consumida', tone: 'bg-secondary text-secondary-foreground' },
  refund: { icon: RotateCcw, label: 'Devolución', tone: 'bg-earth-soft text-earth' },
}

export function MovementList({ movements, studentNames }: { movements: Movement[]; studentNames?: Map<string, string> }) {
  if (movements.length === 0) return <EmptyState icon={Clock} title="Sin movimientos" />
  return (
    <ul className="divide-y rounded-3xl border bg-card">
      {movements.map((m) => {
        const meta = movementMeta[m.type]
        return (
          <li key={m.id} className="flex items-center gap-3 px-4 py-3">
            <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', meta.tone)}>
              <meta.icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {studentNames ? `${studentNames.get(m.studentId) ?? 'Alumna'} · ` : ''}
                {meta.label}
              </p>
              <p className="truncate text-xs text-muted-foreground">{m.note}</p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(m.date)} · registrado por {m.by}
              </p>
            </div>
            <span
              className={cn('shrink-0 font-serif text-lg tabular-nums', m.delta > 0 ? 'text-primary' : 'text-muted-foreground')}
            >
              {m.delta > 0 ? `+${m.delta}` : m.delta}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

const notificationIcon: Record<NotificationKind, LucideIcon> = {
  booking_confirmed: CalendarCheck,
  booking_cancelled: CalendarX,
  class_changed: Clock,
  class_cancelled: CalendarX,
  spot_available: Sparkles,
  message: MessageCircle,
}

export function NotificationList({
  notifications,
  onRead,
}: {
  notifications: AppNotification[]
  onRead?: (id: string) => void
}) {
  if (notifications.length === 0) return <EmptyState icon={Bell} title="No tenés avisos" />
  return (
    <ul className="flex flex-col gap-2">
      {notifications.map((n) => {
        const Icon = notificationIcon[n.kind]
        const highlight = n.kind === 'spot_available' || n.kind === 'class_cancelled' || n.kind === 'class_changed'
        return (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => onRead?.(n.id)}
              className={cn(
                'flex w-full items-start gap-3 rounded-3xl border bg-card p-4 text-left transition-colors',
                !n.read && 'border-primary/30 bg-accent/40',
              )}
            >
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full',
                  highlight ? 'bg-earth-soft text-earth' : 'bg-accent text-accent-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{n.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(n.date)}</span>
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground text-pretty">{n.message}</span>
              </span>
              {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-earth" aria-label="No leído" />}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
