'use client'

import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { ClassCard } from '@/components/class-card'
import { EmptyState, PageHeader, Pill, SectionTitle } from '@/components/studio-ui'
import { WeekStrip } from '@/components/week-strip'
import { formatDayLong, todayISO } from '@/lib/format'
import { activeBookings, canTakeAttendance, classesOn, findInstructor } from '@/lib/selectors'
import { useStudio } from '@/lib/studio-store'

export default function InstructorPage() {
  const { state, currentInstructorId } = useStudio()
  const [date, setDate] = useState(todayISO())
  const instructor = findInstructor(state, currentInstructorId)
  const mine = state.classes.filter((c) => c.instructorId === currentInstructorId)
  const classes = classesOn(state, date).filter((c) => c.instructorId === currentInstructorId)
  const marked = new Set(mine.filter((c) => c.status === 'scheduled').map((c) => c.date))

  return (
    <>
      <PageHeader
        eyebrow={formatDayLong(todayISO())}
        title={`Hola, ${instructor?.short ?? ''}`}
        description="Tus clases asignadas. Tocá una clase para ver la lista y tomar asistencia."
      />
      <WeekStrip value={date} onChange={setDate} markedDates={marked} />
      <section className="mt-6" aria-labelledby="day-title">
        <SectionTitle>
          <span id="day-title">{formatDayLong(date)}</span>
        </SectionTitle>
        {classes.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No tenés clases este día" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {classes.map((c) => {
              const pending = activeBookings(state, c.id).filter((b) => b.status === 'booked').length
              return (
                <ClassCard
                  key={c.id}
                  cls={c}
                  href={`/instructora/clases/${c.id}`}
                  extraBadge={
                    c.status === 'scheduled' && canTakeAttendance(c) && pending > 0 ? (
                      <Pill tone="earth">Tomar asistencia</Pill>
                    ) : undefined
                  }
                />
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}
