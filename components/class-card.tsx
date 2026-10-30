'use client'

import { ChevronRight, MapPin, User } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { OccupancyBar, Pill } from '@/components/studio-ui'
import { endTime } from '@/lib/format'
import { activeBookings, classWaitlist, findInstructor, hasClassStarted } from '@/lib/selectors'
import { useStudio } from '@/lib/studio-store'
import type { YogaClass } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ClassCardProps {
  cls: YogaClass
  href?: string
  footer?: ReactNode
  extraBadge?: ReactNode
}

export function ClassCard({ cls, href, footer, extraBadge }: ClassCardProps) {
  const { state } = useStudio()
  const booked = activeBookings(state, cls.id).length
  const waiting = classWaitlist(state, cls.id).length
  const instructor = findInstructor(state, cls.instructorId)
  const cancelled = cls.status === 'cancelled'
  const full = booked >= cls.capacity
  const past = hasClassStarted(cls)

  const body = (
    <div className="flex gap-4">
      <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-secondary py-2">
        <span className="font-serif text-lg leading-none font-medium tabular-nums">{cls.start}</span>
        <span className="mt-1 text-[11px] text-muted-foreground tabular-nums">{endTime(cls.start, cls.duration)}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={cn('truncate font-medium', cancelled && 'text-muted-foreground line-through')}>{cls.title}</p>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <User className="size-3" aria-hidden />
                {instructor?.short}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" aria-hidden />
                {cls.room}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {cancelled ? (
              <Pill tone="danger">Cancelada</Pill>
            ) : full ? (
              <Pill tone="earth">Completa</Pill>
            ) : past ? (
              <Pill>Finalizada</Pill>
            ) : (
              <Pill tone="sage">{cls.capacity - booked} libres</Pill>
            )}
            {extraBadge}
          </div>
        </div>
        {!cancelled && (
          <div className="flex items-center gap-3">
            <OccupancyBar value={booked} max={cls.capacity} />
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {booked}/{cls.capacity}
              {waiting > 0 && ` · ${waiting} en espera`}
            </span>
          </div>
        )}
      </div>
      {href && <ChevronRight className="size-4 shrink-0 self-center text-muted-foreground" aria-hidden />}
    </div>
  )

  return (
    <div className={cn('rounded-3xl border bg-card transition-colors', href && 'hover:border-primary/40', cancelled && 'bg-card/60')}>
      {href ? (
        <Link href={href} className="block p-4">
          {body}
        </Link>
      ) : (
        <div className="p-4">{body}</div>
      )}
      {footer && <div className="border-t px-4 py-3">{footer}</div>}
    </div>
  )
}
