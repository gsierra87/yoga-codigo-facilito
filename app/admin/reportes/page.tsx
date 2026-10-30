'use client'

import { Banknote, CalendarX, Percent, UserCheck } from 'lucide-react'
import { Card, OccupancyBar, PageHeader, SectionTitle, StatCard } from '@/components/studio-ui'
import { addDays, formatMoney, toISODate, todayISO } from '@/lib/format'
import { activeBookings, findInstructor } from '@/lib/selectors'
import { useStudio } from '@/lib/studio-store'

export default function ReportsPage() {
  const { state } = useStudio()
  const today = todayISO()
  const from = toISODate(addDays(new Date(), -14))
  const past = state.classes.filter((c) => c.date >= from && c.date < today)
  const held = past.filter((c) => c.status === 'scheduled')
  const pastBookings = state.bookings.filter((b) => held.some((c) => c.id === b.classId))
  const attended = pastBookings.filter((b) => b.status === 'attended').length
  const absent = pastBookings.filter((b) => b.status === 'absent').length
  const capacity = held.reduce((sum, c) => sum + c.capacity, 0)
  const income = state.packages.filter((p) => p.purchasedAt.slice(0, 10) >= from).reduce((sum, p) => sum + p.price, 0)

  const byTitle = new Map<string, { booked: number; capacity: number; count: number }>()
  for (const c of held) {
    const entry = byTitle.get(c.title) ?? { booked: 0, capacity: 0, count: 0 }
    entry.booked += activeBookings(state, c.id).length
    entry.capacity += c.capacity
    entry.count++
    byTitle.set(c.title, entry)
  }
  const titleRows = [...byTitle.entries()].sort((a, b) => b[1].booked / b[1].capacity - a[1].booked / a[1].capacity)

  const byInstructor = state.instructors.map((i) => {
    const own = held.filter((c) => c.instructorId === i.id)
    const students = pastBookings.filter((b) => b.status === 'attended' && own.some((c) => c.id === b.classId)).length
    return { instructor: i, classes: own.length, students }
  })

  const hours = [...new Set(held.map((c) => c.start))].sort()
  const byHour = hours.map((h) => {
    const list = held.filter((c) => c.start === h)
    const booked = list.reduce((s, c) => s + activeBookings(state, c.id).length, 0)
    const cap = list.reduce((s, c) => s + c.capacity, 0)
    return { hour: h, pct: cap ? Math.round((booked / cap) * 100) : 0 }
  })

  return (
    <>
      <PageHeader title="Reportes" description="Resumen de las últimas dos semanas." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Percent} label="Ocupación promedio" value={`${capacity ? Math.round(((attended + absent) / capacity) * 100) : 0}%`} />
        <StatCard icon={UserCheck} label="Asistencias" value={attended} hint={`${absent} ausencias`} />
        <StatCard icon={CalendarX} label="Clases canceladas" value={past.length - held.length} tone="earth" />
        <StatCard icon={Banknote} label="Paquetes vendidos" value={formatMoney(income)} tone="sand" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="by-hour-title">
          <SectionTitle>
            <span id="by-hour-title">Ocupación por horario</span>
          </SectionTitle>
          <Card>
            <div className="flex h-48 items-end gap-3" role="list">
              {byHour.map(({ hour, pct }) => (
                <div key={hour} role="listitem" className="flex flex-1 flex-col items-center gap-2" aria-label={`${hour}: ${pct}%`}>
                  <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
                  <div className="flex w-full flex-1 items-end">
                    <div className={pct >= 90 ? 'w-full rounded-t-xl bg-earth' : 'w-full rounded-t-xl bg-primary'} style={{ height: `${Math.max(pct, 4)}%` }} />
                  </div>
                  <span className="text-xs font-medium tabular-nums">{hour}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section aria-labelledby="by-title-title">
          <SectionTitle>
            <span id="by-title-title">Ocupación por tipo de clase</span>
          </SectionTitle>
          <Card className="flex flex-col gap-4">
            {titleRows.map(([title, data]) => (
              <div key={title} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{title}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {Math.round((data.booked / data.capacity) * 100)}% · {data.count} clases
                  </span>
                </div>
                <OccupancyBar value={data.booked} max={data.capacity} className="h-2" />
              </div>
            ))}
          </Card>
        </section>
      </div>

      <section className="mt-6" aria-labelledby="instructors-title">
        <SectionTitle>
          <span id="instructors-title">Por instructora</span>
        </SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          {byInstructor.map(({ instructor, classes, students }) => (
            <Card key={instructor.id}>
              <p className="font-medium">{findInstructor(state, instructor.id)?.name}</p>
              <p className="mt-2 font-serif text-3xl tabular-nums">{classes}</p>
              <p className="text-sm text-muted-foreground">clases dictadas · {students} asistencias</p>
            </Card>
          ))}
        </div>
      </section>
    </>
  )
}
