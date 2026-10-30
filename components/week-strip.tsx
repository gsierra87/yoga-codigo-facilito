'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, formatMonth, formatWeekday, parseISODate, startOfWeek, toISODate, todayISO } from '@/lib/format'
import { cn } from '@/lib/utils'

interface WeekStripProps {
  value: string
  onChange: (iso: string) => void
  markedDates?: Set<string>
  minDate?: string
}

export function WeekStrip({ value, onChange, markedDates, minDate }: WeekStripProps) {
  const selected = parseISODate(value)
  const weekStart = startOfWeek(selected)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = todayISO()
  const prevWeekEnd = toISODate(addDays(weekStart, -1))
  const canGoBack = !minDate || prevWeekEnd >= minDate

  const shift = (weeks: number) => {
    let next = toISODate(addDays(selected, weeks * 7))
    if (minDate && next < minDate) next = minDate
    onChange(next)
  }

  return (
    <div className="rounded-3xl border bg-card p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-sm font-medium">{formatMonth(selected)}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(today)}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-primary hover:bg-accent"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => shift(-1)}
            disabled={!canGoBack}
            className="rounded-full p-2 hover:bg-muted disabled:opacity-30"
          >
            <ChevronLeft className="size-4" aria-hidden />
            <span className="sr-only">Semana anterior</span>
          </button>
          <button type="button" onClick={() => shift(1)} className="rounded-full p-2 hover:bg-muted">
            <ChevronRight className="size-4" aria-hidden />
            <span className="sr-only">Semana siguiente</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1" role="listbox" aria-label="Elegir día">
        {days.map((day) => {
          const iso = toISODate(day)
          const isSelected = iso === value
          const disabled = !!minDate && iso < minDate
          return (
            <button
              key={iso}
              type="button"
              role="option"
              aria-selected={isSelected}
              disabled={disabled}
              onClick={() => onChange(iso)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-2xl py-2 text-xs transition-colors hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary',
              )}
            >
              <span className={cn('text-[11px]', !isSelected && 'text-muted-foreground')}>{formatWeekday(day)}</span>
              <span className={cn('text-base font-medium tabular-nums', iso === today && !isSelected && 'text-primary')}>
                {day.getDate()}
              </span>
              <span
                className={cn(
                  'size-1 rounded-full',
                  markedDates?.has(iso) ? (isSelected ? 'bg-primary-foreground' : 'bg-primary') : 'bg-transparent',
                )}
                aria-hidden
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
