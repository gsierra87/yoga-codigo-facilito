'use client'

import { History } from 'lucide-react'
import { MovementList } from '@/components/activity-lists'
import { EmptyState, PageHeader, Pill, SectionTitle } from '@/components/studio-ui'
import { formatDayShort } from '@/lib/format'
import { findInstructor, hasClassStarted } from '@/lib/selectors'
import { useStudio } from '@/lib/studio-store'

const statusLabel = {
  attended: { label: 'Asistió', tone: 'sage' },
  absent: { label: 'Ausente', tone: 'earth' },
  cancelled: { label: 'Cancelada', tone: 'sand' },
  booked: { label: 'Sin registrar', tone: 'sand' },
} as const

export default function HistoryPage() {
  const { state, currentStudentId } = useStudio()
  const movements = state.movements.filter((m) => m.studentId === currentStudentId).sort((a, b) => b.date.localeCompare(a.date))
  const pastClasses = state.bookings
    .filter((b) => b.studentId === currentStudentId)
    .map((b) => ({ booking: b, cls: state.classes.find((c) => c.id === b.classId)! }))
    .filter(({ cls, booking }) => cls && (hasClassStarted(cls) || booking.status === 'cancelled' || cls.status === 'cancelled'))
    .sort((a, b) => `${b.cls.date}${b.cls.start}`.localeCompare(`${a.cls.date}${a.cls.start}`))

  return (
    <>
      <PageHeader title="Historial" description="Tus clases y cada movimiento de tu paquete." />
      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="classes-title">
          <SectionTitle>
            <span id="classes-title">Clases</span>
          </SectionTitle>
          {pastClasses.length === 0 ? (
            <EmptyState icon={History} title="Todavía no hay clases" />
          ) : (
            <ul className="divide-y rounded-3xl border bg-card">
              {pastClasses.map(({ booking, cls }) => {
                const status = cls.status === 'cancelled' ? statusLabel.cancelled : statusLabel[booking.status]
                return (
                  <li key={booking.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{cls.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDayShort(cls.date)} · {cls.start} · {findInstructor(state, cls.instructorId)?.short}
                      </p>
                    </div>
                    <Pill tone={status.tone}>{status.label}</Pill>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
        <section aria-labelledby="movements-title">
          <SectionTitle>
            <span id="movements-title">Movimientos del paquete</span>
          </SectionTitle>
          <MovementList movements={movements} />
        </section>
      </div>
    </>
  )
}
