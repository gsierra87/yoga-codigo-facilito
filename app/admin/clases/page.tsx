'use client'

import { CalendarDays, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ClassCard } from '@/components/class-card'
import { ClassForm } from '@/components/class-form'
import { Modal } from '@/components/modal'
import { EmptyState, PageHeader, SectionTitle } from '@/components/studio-ui'
import { Button } from '@/components/ui/button'
import { WeekStrip } from '@/components/week-strip'
import { formatDayLong, todayISO } from '@/lib/format'
import { classesOn } from '@/lib/selectors'
import { useStudio } from '@/lib/studio-store'

export default function AdminClassesPage() {
  const { state, actions } = useStudio()
  const [date, setDate] = useState(todayISO())
  const [creating, setCreating] = useState(false)
  const classes = classesOn(state, date)
  const marked = new Set(state.classes.filter((c) => c.status === 'scheduled').map((c) => c.date))

  return (
    <>
      <PageHeader
        title="Agenda de clases"
        description="Creá, modificá o cancelá clases. Las alumnas anotadas reciben un aviso automático."
        action={
          <Button className="h-10 rounded-xl px-4" onClick={() => setCreating(true)}>
            <Plus data-icon="inline-start" aria-hidden />
            Nueva clase
          </Button>
        }
      />
      <WeekStrip value={date} onChange={setDate} markedDates={marked} />
      <section className="mt-6" aria-labelledby="day-title">
        <SectionTitle>
          <span id="day-title">{formatDayLong(date)}</span>
        </SectionTitle>
        {classes.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Sin clases este día" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {classes.map((c) => (
              <ClassCard key={c.id} cls={c} href={`/admin/clases/${c.id}`} />
            ))}
          </div>
        )}
      </section>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva clase">
        <ClassForm
          initial={{ date }}
          submitLabel="Crear clase"
          onSubmit={(input) => {
            const result = actions.createClass(input)
            if (result.ok) {
              toast.success(result.message)
              setDate(input.date)
              setCreating(false)
            }
          }}
        />
      </Modal>
    </>
  )
}
