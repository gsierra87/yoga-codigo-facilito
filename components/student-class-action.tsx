'use client'

import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { classWaitlist, hasClassStarted, spotsLeft, studentBalance } from '@/lib/selectors'
import { useStudio, type ActionResult } from '@/lib/studio-store'
import type { YogaClass } from '@/lib/types'

export function StudentClassAction({ cls }: { cls: YogaClass }) {
  const { state, actions, currentStudentId } = useStudio()
  const booking = state.bookings.find((b) => b.classId === cls.id && b.studentId === currentStudentId && b.status !== 'cancelled')
  const waitlist = classWaitlist(state, cls.id)
  const waitIndex = waitlist.findIndex((w) => w.studentId === currentStudentId)
  const free = spotsLeft(state, cls)
  const { available } = studentBalance(state, currentStudentId)

  const report = (result: ActionResult) => (result.ok ? toast.success(result.message) : toast.error(result.error))

  if (cls.status === 'cancelled' || hasClassStarted(cls)) {
    if (booking?.status === 'attended') return <p className="text-sm text-primary">Asististe a esta clase</p>
    return <p className="text-sm text-muted-foreground">{cls.status === 'cancelled' ? 'Clase cancelada' : 'Reservas cerradas'}</p>
  }

  if (booking) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          <Check className="size-4" aria-hidden />
          Reservada
        </span>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => report(actions.cancelBooking(booking.id, 'student'))}>
          Cancelar reserva
        </Button>
      </div>
    )
  }

  if (waitIndex >= 0) {
    const entry = waitlist[waitIndex]
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-earth">
          {entry.notifiedAt && free > 0 ? '¡Se liberó un lugar!' : `Estás #${waitIndex + 1} en la lista de espera`}
        </span>
        <div className="flex gap-1.5">
          {free > 0 && (
            <Button size="sm" className="rounded-lg" onClick={() => report(actions.reserve(cls.id, currentStudentId))}>
              Reservar ahora
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => report(actions.leaveWaitlist(entry.id))}>
            Salir
          </Button>
        </div>
      </div>
    )
  }

  if (free === 0) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {waitlist.length ? `${waitlist.length} en espera` : 'Sin lugares'}
        </span>
        <Button variant="secondary" size="sm" className="rounded-lg" onClick={() => report(actions.joinWaitlist(cls.id, currentStudentId))}>
          Anotarme en espera
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">
        {available > 0 ? `Usa 1 de tus ${available} clases` : 'Sin clases disponibles'}
      </span>
      <Button className="h-9 rounded-lg px-4" disabled={available === 0} onClick={() => report(actions.reserve(cls.id, currentStudentId))}>
        Reservar
      </Button>
    </div>
  )
}
