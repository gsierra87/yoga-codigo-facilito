'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { addDays, formatDayShort } from './format'
import { createSeed } from './seed'
import {
  PACKAGE_PRICE,
  PACKAGE_SIZE,
  PACKAGE_VALID_DAYS,
  activeBookings,
  classWaitlist,
  findInstructor,
  findStudent,
  hasClassStarted,
  isPackageActive,
  packageRemaining,
  spotsLeft,
  studentBalance,
} from './selectors'
import type { AppNotification, NotificationKind, Student, StudioState, YogaClass } from './types'

export type ActionResult = { ok: true; message: string } | { ok: false; error: string }

type ClassInput = Omit<YogaClass, 'id' | 'status' | 'cancelReason'>
type StudentInput = Omit<Student, 'id' | 'joinedAt'>

let counter = 0
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`
const nowIso = () => new Date().toISOString()

function makeNotification(
  studentId: string,
  kind: NotificationKind,
  title: string,
  message: string,
  classId?: string,
): AppNotification {
  return { id: uid('n'), studentId, kind, title, message, date: nowIso(), read: false, classId }
}

const describe = (c: YogaClass) => `${c.title} del ${formatDayShort(c.date)} a las ${c.start}`

function useStudioStore() {
  const [state, setState] = useState<StudioState>(createSeed)
  const ref = useRef(state)
  const [currentStudentId, setCurrentStudentId] = useState('s1')
  const [currentInstructorId, setCurrentInstructorId] = useState('i2')

  const commit = (next: StudioState) => {
    ref.current = next
    setState(next)
  }

  function offerFreedSpot(s: StudioState, classId: string): { state: StudioState; notified?: string } {
    const c = s.classes.find((cl) => cl.id === classId)
    if (!c || c.status !== 'scheduled' || hasClassStarted(c)) return { state: s }
    const next = classWaitlist(s, classId).find((w) => !w.notifiedAt)
    if (!next) return { state: s }
    return {
      notified: findStudent(s, next.studentId)?.name,
      state: {
        ...s,
        waitlist: s.waitlist.map((w) => (w.id === next.id ? { ...w, notifiedAt: nowIso() } : w)),
        notifications: [
          makeNotification(
            next.studentId,
            'spot_available',
            '¡Se liberó un lugar!',
            `Hay un cupo disponible en ${describe(c)}. Reservalo antes de que lo tome otra persona.`,
            c.id,
          ),
          ...s.notifications,
        ],
      },
    }
  }

  const actions = {
    reserve(classId: string, studentId: string): ActionResult {
      const s = ref.current
      const c = s.classes.find((cl) => cl.id === classId)
      if (!c) return { ok: false, error: 'La clase no existe.' }
      if (c.status === 'cancelled') return { ok: false, error: 'La clase fue cancelada.' }
      if (hasClassStarted(c)) return { ok: false, error: 'La clase ya comenzó.' }
      if (s.bookings.some((b) => b.classId === classId && b.studentId === studentId && b.status === 'booked'))
        return { ok: false, error: 'Ya hay una reserva para esta clase.' }
      if (spotsLeft(s, c) <= 0) return { ok: false, error: 'La clase está completa. Podés anotarte en la lista de espera.' }
      if (studentBalance(s, studentId).available <= 0)
        return { ok: false, error: 'No hay clases disponibles en el paquete. Consultá con Andrea para renovarlo.' }
      commit({
        ...s,
        bookings: [
          ...s.bookings,
          { id: uid('b'), classId, studentId, status: 'booked', createdAt: nowIso() },
        ],
        waitlist: s.waitlist.filter((w) => !(w.classId === classId && w.studentId === studentId)),
        notifications: [
          makeNotification(studentId, 'booking_confirmed', 'Reserva confirmada', `Tu lugar en ${describe(c)} está confirmado.`, c.id),
          ...s.notifications,
        ],
      })
      return { ok: true, message: `Reserva confirmada: ${c.title} ${c.start}` }
    },

    cancelBooking(bookingId: string, by: 'student' | 'studio'): ActionResult {
      const s = ref.current
      const booking = s.bookings.find((b) => b.id === bookingId)
      if (!booking || booking.status !== 'booked') return { ok: false, error: 'La reserva no se puede cancelar.' }
      const c = s.classes.find((cl) => cl.id === booking.classId)!
      let next: StudioState = {
        ...s,
        bookings: s.bookings.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled', cancelledBy: by } : b)),
        notifications: [
          makeNotification(
            booking.studentId,
            'booking_cancelled',
            'Reserva cancelada',
            `${by === 'studio' ? 'El estudio canceló' : 'Cancelaste'} tu reserva en ${describe(c)}. La clase no se descontó de tu paquete.`,
            c.id,
          ),
          ...s.notifications,
        ],
      }
      const offered = offerFreedSpot(next, c.id)
      next = offered.state
      commit(next)
      return {
        ok: true,
        message: offered.notified ? `Reserva cancelada. Avisamos a ${offered.notified} (lista de espera).` : 'Reserva cancelada.',
      }
    },

    joinWaitlist(classId: string, studentId: string): ActionResult {
      const s = ref.current
      const c = s.classes.find((cl) => cl.id === classId)
      if (!c || c.status !== 'scheduled' || hasClassStarted(c)) return { ok: false, error: 'La clase no está disponible.' }
      if (s.waitlist.some((w) => w.classId === classId && w.studentId === studentId))
        return { ok: false, error: 'Ya estás en la lista de espera.' }
      if (s.bookings.some((b) => b.classId === classId && b.studentId === studentId && b.status === 'booked'))
        return { ok: false, error: 'Ya tenés una reserva en esta clase.' }
      if (spotsLeft(s, c) > 0) return { ok: false, error: 'Todavía hay lugares. ¡Reservá directamente!' }
      const position = classWaitlist(s, classId).length + 1
      commit({ ...s, waitlist: [...s.waitlist, { id: uid('w'), classId, studentId, createdAt: nowIso() }] })
      return { ok: true, message: `Te anotamos en la lista de espera (puesto ${position}).` }
    },

    leaveWaitlist(entryId: string): ActionResult {
      const s = ref.current
      commit({ ...s, waitlist: s.waitlist.filter((w) => w.id !== entryId) })
      return { ok: true, message: 'Saliste de la lista de espera.' }
    },

    promoteFromWaitlist(entryId: string): ActionResult {
      const entry = ref.current.waitlist.find((w) => w.id === entryId)
      if (!entry) return { ok: false, error: 'No se encontró la inscripción.' }
      return actions.reserve(entry.classId, entry.studentId)
    },

    setAttendance(bookingId: string, status: 'attended' | 'absent'): ActionResult {
      const s = ref.current
      const booking = s.bookings.find((b) => b.id === bookingId)
      if (!booking || booking.status === 'cancelled') return { ok: false, error: 'Reserva no válida.' }
      if (booking.status === status) return { ok: true, message: '' }
      const c = s.classes.find((cl) => cl.id === booking.classId)!
      const instructor = findInstructor(s, c.instructorId)?.short ?? 'Instructora'
      let next = s

      if (status === 'attended') {
        const pkg = s.packages
          .filter((p) => p.studentId === booking.studentId && packageRemaining(p) > 0)
          .sort((a, b) => Number(isPackageActive(b)) - Number(isPackageActive(a)) || a.purchasedAt.localeCompare(b.purchasedAt))[0]
        if (!pkg) return { ok: false, error: `${findStudent(s, booking.studentId)?.name} no tiene clases disponibles en su paquete.` }
        next = {
          ...next,
          packages: next.packages.map((p) => (p.id === pkg.id ? { ...p, used: p.used + 1 } : p)),
          bookings: next.bookings.map((b) => (b.id === bookingId ? { ...b, status, packageId: pkg.id } : b)),
          movements: [
            {
              id: uid('m'),
              studentId: booking.studentId,
              packageId: pkg.id,
              type: 'consumed',
              delta: -1,
              date: nowIso(),
              classId: c.id,
              note: `Asistencia · ${c.title} ${formatDayShort(c.date)} ${c.start}`,
              by: instructor,
            },
            ...next.movements,
          ],
        }
      } else {
        next = { ...next, bookings: next.bookings.map((b) => (b.id === bookingId ? { ...b, status, packageId: undefined } : b)) }
        if (booking.status === 'attended' && booking.packageId) {
          next = {
            ...next,
            packages: next.packages.map((p) => (p.id === booking.packageId ? { ...p, used: Math.max(0, p.used - 1) } : p)),
            movements: [
              {
                id: uid('m'),
                studentId: booking.studentId,
                packageId: booking.packageId,
                type: 'refund',
                delta: 1,
                date: nowIso(),
                classId: c.id,
                note: `Corrección de asistencia · ${c.title} ${formatDayShort(c.date)}`,
                by: instructor,
              },
              ...next.movements,
            ],
          }
        }
      }
      commit(next)
      return { ok: true, message: status === 'attended' ? 'Asistencia registrada' : 'Marcada como ausente' }
    },

    createClass(input: ClassInput): ActionResult {
      const s = ref.current
      commit({ ...s, classes: [...s.classes, { ...input, id: uid('c'), status: 'scheduled' }] })
      return { ok: true, message: 'Clase creada' }
    },

    updateClass(classId: string, input: ClassInput): ActionResult {
      const s = ref.current
      const c = s.classes.find((cl) => cl.id === classId)
      if (!c) return { ok: false, error: 'La clase no existe.' }
      const booked = activeBookings(s, classId).length
      if (input.capacity < booked) return { ok: false, error: `Ya hay ${booked} reservas. El cupo no puede ser menor.` }
      const changes: string[] = []
      if (input.date !== c.date || input.start !== c.start) changes.push(`nuevo horario: ${formatDayShort(input.date)} a las ${input.start}`)
      if (input.instructorId !== c.instructorId)
        changes.push(`la clase la dará ${findInstructor(s, input.instructorId)?.short ?? 'otra instructora'}`)
      if (input.room !== c.room) changes.push(`sala: ${input.room}`)
      const affected = [
        ...s.bookings.filter((b) => b.classId === classId && b.status === 'booked').map((b) => b.studentId),
        ...classWaitlist(s, classId).map((w) => w.studentId),
      ]
      const notifications =
        changes.length > 0
          ? affected.map((id) =>
              makeNotification(id, 'class_changed', 'Cambio en tu clase', `${describe(c)} tiene cambios: ${changes.join(', ')}.`, classId),
            )
          : []
      commit({
        ...s,
        classes: s.classes.map((cl) => (cl.id === classId ? { ...cl, ...input } : cl)),
        notifications: [...notifications, ...s.notifications],
      })
      return {
        ok: true,
        message: notifications.length ? `Clase actualizada. Avisamos a ${notifications.length} alumnas.` : 'Clase actualizada',
      }
    },

    cancelClass(classId: string, reason: string): ActionResult {
      const s = ref.current
      const c = s.classes.find((cl) => cl.id === classId)
      if (!c || c.status === 'cancelled') return { ok: false, error: 'La clase ya está cancelada.' }
      if (s.bookings.some((b) => b.classId === classId && b.status === 'attended'))
        return { ok: false, error: 'Ya se registraron asistencias. Corregilas antes de cancelar.' }
      const affected = [
        ...s.bookings.filter((b) => b.classId === classId && b.status !== 'cancelled').map((b) => b.studentId),
        ...classWaitlist(s, classId).map((w) => w.studentId),
      ]
      const message = `${describe(c)} fue cancelada.${reason ? ` Motivo: ${reason}` : ''} No se descontó ninguna clase de tu paquete.`
      commit({
        ...s,
        classes: s.classes.map((cl) => (cl.id === classId ? { ...cl, status: 'cancelled', cancelReason: reason } : cl)),
        bookings: s.bookings.map((b) =>
          b.classId === classId && b.status !== 'cancelled' ? { ...b, status: 'cancelled', cancelledBy: 'class' } : b,
        ),
        waitlist: s.waitlist.filter((w) => w.classId !== classId),
        notifications: [...affected.map((id) => makeNotification(id, 'class_cancelled', 'Clase cancelada', message, classId)), ...s.notifications],
      })
      return { ok: true, message: `Clase cancelada. Avisamos a ${affected.length} alumnas.` }
    },

    notifyClass(classId: string, title: string, message: string, includeWaitlist: boolean): ActionResult {
      const s = ref.current
      const ids = new Set([
        ...activeBookings(s, classId).map((b) => b.studentId),
        ...(includeWaitlist ? classWaitlist(s, classId).map((w) => w.studentId) : []),
      ])
      if (ids.size === 0) return { ok: false, error: 'No hay alumnas para avisar.' }
      commit({
        ...s,
        notifications: [...[...ids].map((id) => makeNotification(id, 'message', title, message, classId)), ...s.notifications],
      })
      return { ok: true, message: `Aviso enviado a ${ids.size} alumnas.` }
    },

    addStudent(input: StudentInput, withPackage: boolean): ActionResult & { id?: string } {
      const s = ref.current
      const id = uid('s')
      commit({ ...s, students: [...s.students, { ...input, id, joinedAt: nowIso().slice(0, 10) }] })
      if (withPackage) actions.addPackage(id, PACKAGE_PRICE)
      return { ok: true, message: `${input.name} fue registrada.`, id }
    },

    updateStudent(id: string, input: StudentInput): ActionResult {
      const s = ref.current
      commit({ ...s, students: s.students.map((st) => (st.id === id ? { ...st, ...input } : st)) })
      return { ok: true, message: 'Datos actualizados' }
    },

    addPackage(studentId: string, price: number): ActionResult {
      const s = ref.current
      const id = uid('p')
      const purchasedAt = nowIso()
      commit({
        ...s,
        packages: [
          ...s.packages,
          {
            id,
            studentId,
            total: PACKAGE_SIZE,
            used: 0,
            purchasedAt,
            expiresAt: addDays(new Date(), PACKAGE_VALID_DAYS).toISOString(),
            price,
          },
        ],
        movements: [
          { id: uid('m'), studentId, packageId: id, type: 'purchase', delta: PACKAGE_SIZE, date: purchasedAt, note: 'Compra de paquete de 10 clases', by: 'Andrea' },
          ...s.movements,
        ],
        notifications: [
          makeNotification(studentId, 'message', 'Nuevo paquete activo', `Se cargó un paquete de ${PACKAGE_SIZE} clases en tu cuenta.`),
          ...s.notifications,
        ],
      })
      return { ok: true, message: 'Paquete de 10 clases asignado' }
    },

    adjustPackage(packageId: string, delta: number, reason: string, performedBy = 'Andrea'): ActionResult {
      const s = ref.current
      const pkg = s.packages.find((p) => p.id === packageId)
      if (!pkg) return { ok: false, error: 'El paquete especificado no existe.' }
      const trimmed = reason.trim()
      if (!trimmed || trimmed.length < 3)
        return { ok: false, error: 'El motivo del ajuste administrativo es obligatorio (mínimo 3 caracteres).' }
      if (delta === 0) return { ok: false, error: 'La variación debe ser distinta de cero.' }
      const currentAvailable = pkg.total - pkg.used
      const nextAvailable = currentAvailable + delta
      if (nextAvailable < 0)
        return { ok: false, error: `Ajuste rechazado: el saldo resultante (${nextAvailable}) no puede ser menor a cero.` }
      if (nextAvailable > PACKAGE_SIZE)
        return { ok: false, error: `Ajuste rechazado: el saldo resultante (${nextAvailable}) no puede superar ${PACKAGE_SIZE} clases.` }
      const nextUsed = pkg.total - nextAvailable
      commit({
        ...s,
        packages: s.packages.map((p) => (p.id === packageId ? { ...p, used: nextUsed } : p)),
        movements: [
          {
            id: uid('m'),
            studentId: pkg.studentId,
            packageId: pkg.id,
            type: delta > 0 ? 'refund' : 'consumed',
            delta,
            date: nowIso(),
            note: `Ajuste administrativo: ${trimmed}`,
            by: performedBy,
          },
          ...s.movements,
        ],
      })
      return { ok: true, message: `Ajuste registrado. Nuevo saldo: ${nextAvailable} clases disponibles.` }
    },

    markNotificationRead(id: string) {
      const s = ref.current
      commit({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })
    },

    markAllRead(studentId: string) {
      const s = ref.current
      commit({ ...s, notifications: s.notifications.map((n) => (n.studentId === studentId ? { ...n, read: true } : n)) })
    },
  }

  return { state, actions, currentStudentId, setCurrentStudentId, currentInstructorId, setCurrentInstructorId }
}

type StudioContextValue = ReturnType<typeof useStudioStore>

const StudioContext = createContext<StudioContextValue | null>(null)

export function StudioProvider({ children }: { children: ReactNode }) {
  const store = useStudioStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <StudioContext.Provider value={store}>
      {mounted ? (
        children
      ) : (
        <div className="flex min-h-dvh items-center justify-center" role="status">
          <span className="font-serif text-2xl text-primary">Prana</span>
          <span className="sr-only">Cargando</span>
        </div>
      )}
    </StudioContext.Provider>
  )
}

export function useStudio() {
  const ctx = useContext(StudioContext)
  if (!ctx) throw new Error('useStudio debe usarse dentro de StudioProvider')
  return ctx
}
