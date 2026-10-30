'use client'

import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { ClassCard } from '@/components/class-card'
import { StudentClassAction } from '@/components/student-class-action'
import { EmptyState, PageHeader, Pill, SectionTitle } from '@/components/studio-ui'
import { WeekStrip } from '@/components/week-strip'
import { formatDayLong, todayISO } from '@/lib/format'
import { classesOn, studentBalance } from '@/lib/selectors'
import { useStudio } from '@/lib/studio-store'

export default function BookPage() {
  const { state, currentStudentId } = useStudio()
  const today = todayISO()
  const [date, setDate] = useState(today)
  const classes = classesOn(state, date)
  const mine = new Set(
    state.bookings
      .filter((b) => b.studentId === currentStudentId && b.status === 'booked')
      .map((b) => state.classes.find((c) => c.id === b.classId)?.date)
      .filter((d): d is string => !!d),
  )
  const { available } = studentBalance(state, currentStudentId)

  return (
    <>
      <PageHeader
        title="Reservar clase"
        description="Si cancelás antes de que empiece la clase, se te devuelve al paquete."
        action={<Pill tone={available > 0 ? 'sage' : 'danger'}>{available} clases disponibles</Pill>}
      />
      <WeekStrip value={date} onChange={setDate} markedDates={mine} minDate={today} />
      <section className="mt-6" aria-labelledby="day-title">
        <SectionTitle>
          <span id="day-title">{formatDayLong(date)}</span>
        </SectionTitle>
        {classes.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No hay clases este día" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {classes.map((c) => (
              <ClassCard key={c.id} cls={c} footer={<StudentClassAction cls={c} />} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
