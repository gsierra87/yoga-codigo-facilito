'use client'

import {
  ArrowLeft,
  Ban,
  CalendarClock,
  Check,
  CheckCheck,
  ListOrdered,
  MapPin,
  Megaphone,
  Pencil,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { ClassForm } from '@/components/class-form'
import { Modal } from '@/components/modal'
import { Card, EmptyState, OccupancyBar, Pill, SectionTitle, fieldClass } from '@/components/studio-ui'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { endTime, formatDayLong, formatDateTime, initials } from '@/lib/format'
import {
  activeBookings,
  canTakeAttendance,
  classWaitlist,
  findInstructor,
  findStudent,
  hasClassStarted,
  spotsLeft,
  studentBalance,
} from '@/lib/selectors'
import { useStudio, type ActionResult } from '@/lib/studio-store'
import { cn } from '@/lib/utils'

interface ClassDetailProps {
  classId: string
  backHref: string
  canManage: boolean
}

export function ClassDetail({ classId, backHref, canManage }: ClassDetailProps) {
  const { state, actions } = useStudio()
  const [modal, setModal] = useState<'edit' | 'cancel' | 'notify' | 'add' | null>(null)
  const cls = state.classes.find((c) => c.id === classId)

  if (!cls) {
    return <EmptyState icon={CalendarClock} title="Clase no encontrada" action={<Link href={backHref}>Volver</Link>} />
  }

  const report = (result: ActionResult) => {
    if (result.ok) {
      if (result.message) toast.success(result.message)
      return true
    }
    toast.error(result.error)
    return false
  }

  const bookings = activeBookings(state, cls.id)
  const waitlist = classWaitlist(state, cls.id)
  const instructor = findInstructor(state, cls.instructorId)
  const free = spotsLeft(state, cls)
  const started = hasClassStarted(cls)
  const cancelled = cls.status === 'cancelled'
  const attendanceOpen = canTakeAttendance(cls)
  const attendedCount = bookings.filter((b) => b.status === 'attended').length
  const pendingCount = bookings.filter((b) => b.status === 'booked').length
  const editable = canManage && !cancelled

  const markAllPresent = () => {
    let count = 0
    for (const b of bookings.filter((bk) => bk.status === 'booked')) {
      const result = actions.setAttendance(b.id, 'attended')
      if (result.ok) count++
      else toast.error(result.error)
    }
    if (count) toast.success(`${count} asistencias registradas`)
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href={backHref} className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Volver
      </Link>

      <Card className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">{formatDayLong(cls.date)}</p>
            <h1 className={cn('font-serif text-3xl font-medium', cancelled && 'line-through decoration-1')}>{cls.title}</h1>
            <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="size-4" aria-hidden />
                {cls.start} – {endTime(cls.start, cls.duration)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <User className="size-4" aria-hidden />
                {instructor?.name}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden />
                {cls.room}
              </span>
            </p>
          </div>
          {cancelled ? <Pill tone="danger">Cancelada</Pill> : free === 0 ? <Pill tone="earth">Completa</Pill> : <Pill tone="sage">{free} lugares libres</Pill>}
        </div>

        {cancelled ? (
          <div className="rounded-2xl bg-destructive/5 p-4 text-sm">
            <p className="font-medium text-destructive">Clase cancelada</p>
            <p className="mt-1 text-muted-foreground">{cls.cancelReason || 'Sin motivo indicado.'} No se descontaron clases de los paquetes.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ocupación</span>
              <span className="font-medium tabular-nums">
                {bookings.length} de {cls.capacity}
              </span>
            </div>
            <OccupancyBar value={bookings.length} max={cls.capacity} className="h-2" />
          </div>
        )}

        {!cancelled && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="h-10 rounded-xl px-4" onClick={() => setModal('notify')}>
              <Megaphone data-icon="inline-start" aria-hidden />
              Avisar a las alumnas
            </Button>
            {editable && !started && (
              <>
                <Button variant="outline" className="h-10 rounded-xl px-4" onClick={() => setModal('edit')}>
                  <Pencil data-icon="inline-start" aria-hidden />
                  Modificar
                </Button>
                <Button variant="destructive" className="h-10 rounded-xl px-4" onClick={() => setModal('cancel')}>
                  <Ban data-icon="inline-start" aria-hidden />
                  Cancelar clase
                </Button>
              </>
            )}
          </div>
        )}
      </Card>

      {!cancelled && (
        <section aria-labelledby="roster-title">
          <SectionTitle
            action={
              <div className="flex gap-2">
                {canManage && !started && free > 0 && (
                  <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setModal('add')}>
                    <UserPlus data-icon="inline-start" aria-hidden />
                    Agregar
                  </Button>
                )}
                {attendanceOpen && pendingCount > 0 && (
                  <Button size="sm" className="rounded-lg" onClick={markAllPresent}>
                    <CheckCheck data-icon="inline-start" aria-hidden />
                    Todas presentes
                  </Button>
                )}
              </div>
            }
          >
            <span id="roster-title">Alumnas anotadas</span>
          </SectionTitle>

          {attendanceOpen ? (
            <p className="mb-3 text-sm text-muted-foreground">
              {attendedCount} presentes · {pendingCount} sin registrar. Al marcar presente se descuenta 1 clase del paquete.
            </p>
          ) : (
            <p className="mb-3 text-sm text-muted-foreground">La asistencia se habilita el día de la clase.</p>
          )}

          {bookings.length === 0 ? (
            <EmptyState icon={Users} title="Todavía no hay reservas" />
          ) : (
            <ul className="divide-y rounded-3xl border bg-card">
              {bookings.map((b) => {
                const student = findStudent(state, b.studentId)
                const balance = studentBalance(state, b.studentId)
                return (
                  <li key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                      {initials(student?.name ?? '')}
                    </span>
                    <div className="min-w-0 flex-1">
                      {canManage ? (
                        <Link href={`/admin/alumnas/${b.studentId}`} className="truncate font-medium hover:underline">
                          {student?.name}
                        </Link>
                      ) : (
                        <p className="truncate font-medium">{student?.name}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Saldo: {balance.remaining} {balance.remaining === 1 ? 'clase' : 'clases'}
                        {student?.notes ? ` · ${student.notes}` : ''}
                      </p>
                    </div>
                    {attendanceOpen ? (
                      <div className="flex gap-1.5" role="group" aria-label={`Asistencia de ${student?.name}`}>
                        <button
                          type="button"
                          aria-pressed={b.status === 'attended'}
                          onClick={() => report(actions.setAttendance(b.id, 'attended'))}
                          className={cn(
                            'flex h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors',
                            b.status === 'attended' ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
                          )}
                        >
                          <Check className="size-4" aria-hidden />
                          Presente
                        </button>
                        <button
                          type="button"
                          aria-pressed={b.status === 'absent'}
                          onClick={() => report(actions.setAttendance(b.id, 'absent'))}
                          className={cn(
                            'flex h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors',
                            b.status === 'absent' ? 'border-earth bg-earth-soft text-earth' : 'hover:bg-muted',
                          )}
                        >
                          <X className="size-4" aria-hidden />
                          Ausente
                        </button>
                      </div>
                    ) : canManage && !started ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => report(actions.cancelBooking(b.id, 'studio'))}
                      >
                        Quitar
                      </Button>
                    ) : (
                      <Pill>Reservada</Pill>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      {!cancelled && !started && (
        <section aria-labelledby="waitlist-title">
          <SectionTitle>
            <span id="waitlist-title">Lista de espera</span>
          </SectionTitle>
          {waitlist.length === 0 ? (
            <EmptyState icon={ListOrdered} title="Nadie en espera" description="Cuando la clase se complete, las alumnas podrán anotarse aquí." />
          ) : (
            <ol className="divide-y rounded-3xl border bg-card">
              {waitlist.map((w, i) => {
                const student = findStudent(state, w.studentId)
                return (
                  <li key={w.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-earth-soft font-serif text-earth">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{student?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {w.notifiedAt ? `Avisada del cupo ${formatDateTime(w.notifiedAt)}` : `Anotada ${formatDateTime(w.createdAt)}`}
                      </p>
                    </div>
                    {canManage && (
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          className="rounded-lg"
                          disabled={free === 0}
                          onClick={() => report(actions.promoteFromWaitlist(w.id))}
                        >
                          Asignar lugar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => report(actions.leaveWaitlist(w.id))}>
                          Quitar
                        </Button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </section>
      )}

      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Modificar clase" description="Si cambiás horario, sala o instructora avisaremos a las alumnas anotadas.">
        <ClassForm
          initial={cls}
          submitLabel="Guardar cambios"
          onSubmit={(input) => {
            if (report(actions.updateClass(cls.id, input))) setModal(null)
          }}
        />
      </Modal>

      <Modal open={modal === 'cancel'} onClose={() => setModal(null)} title="Cancelar clase" description={`Se cancelarán ${bookings.length} reservas y se avisará a todas las alumnas. No se descontarán clases.`}>
        <CancelClassForm
          onSubmit={(reason) => {
            if (report(actions.cancelClass(cls.id, reason))) setModal(null)
          }}
        />
      </Modal>

      <Modal open={modal === 'notify'} onClose={() => setModal(null)} title="Avisar a las alumnas" description={`${bookings.length} anotadas${waitlist.length ? ` · ${waitlist.length} en espera` : ''}`}>
        <NotifyForm
          hasWaitlist={waitlist.length > 0}
          onSubmit={(title, message, includeWaitlist) => {
            if (report(actions.notifyClass(cls.id, title, message, includeWaitlist))) setModal(null)
          }}
        />
      </Modal>

      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Agregar alumna" description="Reservá un lugar en nombre de una alumna.">
        <AddStudentToClass
          excludeIds={new Set(bookings.map((b) => b.studentId))}
          onSubmit={(studentId) => {
            if (report(actions.reserve(cls.id, studentId))) setModal(null)
          }}
        />
      </Modal>
    </div>
  )
}

function CancelClassForm({ onSubmit }: { onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState('')
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(reason.trim())
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cancel-reason">Motivo (se incluye en el aviso)</Label>
        <Textarea
          id="cancel-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: la instructora no puede asistir por enfermedad."
          className="min-h-24 rounded-xl"
        />
      </div>
      <Button type="submit" variant="destructive" className="h-11 rounded-xl">
        Confirmar cancelación
      </Button>
    </form>
  )
}

const TEMPLATES = [
  { title: 'Cambio de instructora', message: 'Hoy la clase la dará otra instructora del estudio. ¡Te esperamos igual!' },
  { title: 'Recordatorio', message: 'Te recordamos tu clase de hoy. Traé tu mat y una botella de agua.' },
  { title: 'Demora en el inicio', message: 'La clase empezará 15 minutos más tarde. Disculpá las molestias.' },
]

function NotifyForm({
  hasWaitlist,
  onSubmit,
}: {
  hasWaitlist: boolean
  onSubmit: (title: string, message: string, includeWaitlist: boolean) => void
}) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [includeWaitlist, setIncludeWaitlist] = useState(false)
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(title.trim(), message.trim(), includeWaitlist)
      }}
    >
      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.title}
            type="button"
            onClick={() => {
              setTitle(t.title)
              setMessage(t.message)
            }}
            className="rounded-full border px-3 py-1.5 text-xs hover:bg-muted"
          >
            {t.title}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notify-title">Asunto</Label>
        <input id="notify-title" required value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notify-message">Mensaje</Label>
        <Textarea id="notify-message" required value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-24 rounded-xl" />
      </div>
      {hasWaitlist && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={includeWaitlist} onChange={(e) => setIncludeWaitlist(e.target.checked)} className="size-4 accent-primary" />
          Incluir lista de espera
        </label>
      )}
      <Button type="submit" className="h-11 rounded-xl">
        Enviar aviso
      </Button>
    </form>
  )
}

function AddStudentToClass({ excludeIds, onSubmit }: { excludeIds: Set<string>; onSubmit: (studentId: string) => void }) {
  const { state } = useStudio()
  const options = state.students.filter((s) => !excludeIds.has(s.id)).sort((a, b) => a.name.localeCompare(b.name))
  const [studentId, setStudentId] = useState(options[0]?.id ?? '')
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (studentId) onSubmit(studentId)
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="add-student">Alumna</Label>
        <select id="add-student" value={studentId} onChange={(e) => setStudentId(e.target.value)} className={fieldClass}>
          {options.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {studentBalance(state, s.id).available} disponibles
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" className="h-11 rounded-xl">
        Reservar lugar
      </Button>
    </form>
  )
}
