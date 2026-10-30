import { addDays, formatDayShort, toISODate } from './format'
import { PACKAGE_PRICE, PACKAGE_SIZE, PACKAGE_VALID_DAYS, classStart } from './selectors'
import type {
  AppNotification,
  Booking,
  ClassPackage,
  Instructor,
  Movement,
  Student,
  StudioState,
  WaitlistEntry,
  YogaClass,
} from './types'

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const INSTRUCTORS: Instructor[] = [
  { id: 'i1', name: 'Andrea Molina', short: 'Andrea' },
  { id: 'i2', name: 'Carla Ruiz', short: 'Carla' },
  { id: 'i3', name: 'Sofía Benítez', short: 'Sofía' },
]

const STUDENT_NAMES = [
  'Lucía Fernández', 'Martina Gómez', 'Valentina López', 'Camila Díaz', 'Julieta Romero',
  'Florencia Sosa', 'Agustina Torres', 'Micaela Álvarez', 'Paula Ruiz', 'Carolina Acosta',
  'Rocío Medina', 'Natalia Herrera', 'Belén Castro', 'Daniela Suárez', 'Victoria Ríos',
  'Milagros Flores', 'Antonella Vega', 'Sol Benítez', 'Lorena Molina', 'Gabriela Ortiz',
  'Silvina Navarro', 'Mariana Silva', 'Laura Peralta', 'Andrea Cabrera', 'Inés Morales',
  'Clara Ibáñez', 'Elena Rojas', 'Pilar Domínguez', 'Renata Quiroga', 'Celeste Paz',
]

interface Slot {
  key: string
  weekdays: number[]
  start: string
  title: string
  instructorId: string
  duration: number
  room: string
  capacity: number
  weight: number
}

const SLOTS: Slot[] = [
  { key: 'hatha', weekdays: [1, 2, 3, 4, 5], start: '08:00', title: 'Hatha Yoga', instructorId: 'i1', duration: 60, room: 'Sala Sol', capacity: 12, weight: 3 },
  { key: 'suave', weekdays: [1, 3, 5], start: '10:00', title: 'Yoga Suave', instructorId: 'i3', duration: 60, room: 'Sala Luna', capacity: 12, weight: 1.5 },
  { key: 'vinyasa', weekdays: [1, 2, 3, 4, 5], start: '18:30', title: 'Vinyasa Flow', instructorId: 'i2', duration: 75, room: 'Sala Sol', capacity: 12, weight: 6 },
  { key: 'restaurativo', weekdays: [2, 4], start: '20:00', title: 'Restaurativo', instructorId: 'i3', duration: 60, room: 'Sala Luna', capacity: 12, weight: 2 },
  { key: 'yin', weekdays: [6], start: '10:00', title: 'Yin Yoga', instructorId: 'i1', duration: 75, room: 'Sala Sol', capacity: 10, weight: 3 },
]

const LUCIA = 's1'

export function createSeed(): StudioState {
  const rng = mulberry32(20261027)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayIso = toISODate(today)

  const students: Student[] = STUDENT_NAMES.map((name, index) => {
    const [first, last] = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(' ')
    return {
      id: `s${index + 1}`,
      name,
      email: `${first}.${last}@mail.com`,
      phone: `+54 9 11 ${String(4000 + Math.floor(rng() * 5999)).padStart(4, '0')}-${String(1000 + Math.floor(rng() * 8999))}`,
      birthDate: toISODate(new Date(1975 + Math.floor(rng() * 28), Math.floor(rng() * 12), 1 + Math.floor(rng() * 27))),
      notes: index === 3 ? 'Lesión leve en rodilla derecha. Evitar posturas de rodillas prolongadas.' : index === 7 ? 'Embarazada de 5 meses.' : '',
      joinedAt: toISODate(addDays(today, -30 - Math.floor(rng() * 300))),
    }
  })

  const weeklySessions = SLOTS.flatMap((slot) => slot.weekdays.map((weekday) => ({ slot, weekday })))
  const prefs = new Map<string, Set<string>>()
  students.forEach((student, index) => {
    const set = new Set<string>()
    if (index >= 28) {
      prefs.set(student.id, set)
      return
    }
    const target = index === 0 ? 3 : 2 + Math.floor(rng() * 2)
    let guard = 0
    while (set.size < target && guard < 50) {
      guard++
      const totalWeight = weeklySessions.reduce((sum, s) => sum + s.slot.weight, 0)
      let pick = rng() * totalWeight
      for (const session of weeklySessions) {
        pick -= session.slot.weight
        if (pick <= 0) {
          set.add(`${session.slot.key}-${session.weekday}`)
          break
        }
      }
    }
    prefs.set(student.id, set)
  })

  const classes: YogaClass[] = []
  const bookings: Booking[] = []
  const waitlist: WaitlistEntry[] = []

  for (let offset = -14; offset <= 10; offset++) {
    const date = addDays(today, offset)
    const iso = toISODate(date)
    for (const slot of SLOTS) {
      if (!slot.weekdays.includes(date.getDay())) continue
      const cls: YogaClass = {
        id: `c-${iso}-${slot.key}`,
        title: slot.title,
        instructorId: slot.instructorId,
        date: iso,
        start: slot.start,
        duration: slot.duration,
        capacity: slot.capacity,
        room: slot.room,
        status: 'scheduled',
      }
      classes.push(cls)
      const sessionKey = `${slot.key}-${date.getDay()}`
      const candidates = students
        .filter((s) => prefs.get(s.id)?.has(sessionKey) && rng() < 0.85)
        .sort(() => rng() - 0.5)
      const started = classStart(cls) <= now
      candidates.forEach((student, idx) => {
        const createdAt = addDays(date, -2 - Math.floor(rng() * 3)).toISOString()
        if (idx < cls.capacity) {
          let status: Booking['status'] = 'booked'
          if (iso < todayIso) status = rng() < 0.9 ? 'attended' : 'absent'
          else if (started) status = 'booked'
          bookings.push({ id: `b-${cls.id}-${student.id}`, classId: cls.id, studentId: student.id, status, createdAt })
        } else if (!started) {
          waitlist.push({ id: `w-${cls.id}-${student.id}`, classId: cls.id, studentId: student.id, createdAt })
        }
      })
    }
  }

  const upcomingVinyasa = classes.find((c) => c.title === 'Vinyasa Flow' && classStart(c) > now)
  if (upcomingVinyasa) {
    const booked = new Set(bookings.filter((b) => b.classId === upcomingVinyasa.id).map((b) => b.studentId))
    const waiting = new Set(waitlist.filter((w) => w.classId === upcomingVinyasa.id).map((w) => w.studentId))
    const pool = students.filter((s) => s.id !== LUCIA && !booked.has(s.id) && !waiting.has(s.id) && Number(s.id.slice(1)) < 28)
    let i = 0
    while (booked.size < upcomingVinyasa.capacity && i < pool.length) {
      const student = pool[i++]
      booked.add(student.id)
      bookings.push({
        id: `b-${upcomingVinyasa.id}-${student.id}`,
        classId: upcomingVinyasa.id,
        studentId: student.id,
        status: 'booked',
        createdAt: addDays(today, -1).toISOString(),
      })
    }
    const luciaBooking = bookings.find((b) => b.classId === upcomingVinyasa.id && b.studentId === LUCIA)
    if (luciaBooking) {
      bookings.splice(bookings.indexOf(luciaBooking), 1)
      const replacement = pool[i++]
      if (replacement) {
        bookings.push({ ...luciaBooking, id: `b-${upcomingVinyasa.id}-${replacement.id}`, studentId: replacement.id })
      }
    }
    for (let extra = 0; waitlist.filter((w) => w.classId === upcomingVinyasa.id).length < 2 && i < pool.length; extra++) {
      const student = pool[i++]
      waitlist.push({
        id: `w-${upcomingVinyasa.id}-${student.id}`,
        classId: upcomingVinyasa.id,
        studentId: student.id,
        createdAt: new Date(now.getTime() - (3 - extra) * 3600_000).toISOString(),
      })
    }
  }

  const notifications: AppNotification[] = []
  const cancelled = classes.find(
    (c) => c.title === 'Restaurativo' && c.date > todayIso && c.date <= toISODate(addDays(today, 7)),
  )
  if (cancelled) {
    cancelled.status = 'cancelled'
    cancelled.cancelReason = 'Sofía no puede dar la clase por motivos de salud. ¡Nos vemos la próxima!'
    if (!bookings.some((b) => b.classId === cancelled.id && b.studentId === LUCIA)) {
      bookings.push({
        id: `b-${cancelled.id}-${LUCIA}`,
        classId: cancelled.id,
        studentId: LUCIA,
        status: 'booked',
        createdAt: addDays(today, -3).toISOString(),
      })
    }
    bookings
      .filter((b) => b.classId === cancelled.id)
      .forEach((b) => {
        b.status = 'cancelled'
        b.cancelledBy = 'class'
        notifications.push({
          id: `n-cancel-${b.id}`,
          studentId: b.studentId,
          kind: 'class_cancelled',
          title: 'Clase cancelada',
          message: `${cancelled.title} del ${formatDayShort(cancelled.date)} a las ${cancelled.start} fue cancelada. No se descontó ninguna clase de tu paquete.`,
          date: new Date(now.getTime() - 5 * 3600_000).toISOString(),
          read: false,
          classId: cancelled.id,
        })
      })
    for (let idx = waitlist.length - 1; idx >= 0; idx--) {
      if (waitlist[idx].classId === cancelled.id) waitlist.splice(idx, 1)
    }
  }

  const packages: ClassPackage[] = []
  const movements: Movement[] = []
  const classById = new Map(classes.map((c) => [c.id, c]))
  const instructorShort = new Map(INSTRUCTORS.map((i) => [i.id, i.short]))

  students.forEach((student, index) => {
    const own = bookings.filter((b) => b.studentId === student.id)
    if (index >= 28 && own.length === 0) return
    const attended = own
      .filter((b) => b.status === 'attended')
      .sort((a, b) => classStart(classById.get(a.classId)!).getTime() - classStart(classById.get(b.classId)!).getTime())
    const upcoming = own.filter((b) => b.status === 'booked').length
    const migrated = index === 0 ? 2 : Math.floor(rng() * 4)
    const totalConsumed = migrated + attended.length
    const count = Math.max(1, Math.ceil((totalConsumed + upcoming + (rng() < 0.3 ? 1 : 0)) / PACKAGE_SIZE))

    const consumptionDates: string[] = []
    for (let m = 0; m < migrated; m++) consumptionDates.push(addDays(today, -24 + m * 2).toISOString())
    attended.forEach((b) => {
      const c = classById.get(b.classId)!
      consumptionDates.push(new Date(classStart(c).getTime() + c.duration * 60000).toISOString())
    })

    for (let p = 0; p < count; p++) {
      const purchasedAt =
        p === 0
          ? addDays(today, -28 - Math.floor(rng() * 5)).toISOString()
          : (consumptionDates[p * PACKAGE_SIZE - 1] ?? consumptionDates.at(-1) ?? addDays(today, -1).toISOString())
      const pkg: ClassPackage = {
        id: `p-${student.id}-${p + 1}`,
        studentId: student.id,
        total: PACKAGE_SIZE,
        used: Math.max(0, Math.min(PACKAGE_SIZE, totalConsumed - p * PACKAGE_SIZE)),
        purchasedAt,
        expiresAt: addDays(new Date(purchasedAt), PACKAGE_VALID_DAYS).toISOString(),
        price: PACKAGE_PRICE,
      }
      packages.push(pkg)
      movements.push({
        id: `m-buy-${pkg.id}`,
        studentId: student.id,
        packageId: pkg.id,
        type: 'purchase',
        delta: PACKAGE_SIZE,
        date: purchasedAt,
        note: 'Compra de paquete de 10 clases',
        by: 'Andrea',
      })
    }

    for (let m = 0; m < migrated; m++) {
      movements.push({
        id: `m-mig-${student.id}-${m}`,
        studentId: student.id,
        packageId: `p-${student.id}-1`,
        type: 'consumed',
        delta: -1,
        date: consumptionDates[m],
        note: 'Clase registrada en tarjeta de papel (migración)',
        by: 'Andrea',
      })
    }
    attended.forEach((b, i) => {
      const c = classById.get(b.classId)!
      const pkgIndex = Math.floor((migrated + i) / PACKAGE_SIZE)
      b.packageId = `p-${student.id}-${pkgIndex + 1}`
      movements.push({
        id: `m-att-${b.id}`,
        studentId: student.id,
        packageId: b.packageId,
        type: 'consumed',
        delta: -1,
        date: consumptionDates[migrated + i],
        classId: c.id,
        note: `Asistencia · ${c.title} ${formatDayShort(c.date)} ${c.start}`,
        by: instructorShort.get(c.instructorId) ?? 'Instructora',
      })
    })
  })

  bookings
    .filter((b) => b.studentId === LUCIA && b.status === 'booked')
    .forEach((b) => {
      const c = classById.get(b.classId)!
      notifications.push({
        id: `n-conf-${b.id}`,
        studentId: LUCIA,
        kind: 'booking_confirmed',
        title: 'Reserva confirmada',
        message: `Tu lugar en ${c.title} del ${formatDayShort(c.date)} a las ${c.start} está confirmado.`,
        date: b.createdAt,
        read: true,
        classId: c.id,
      })
    })
  notifications.push({
    id: 'n-welcome',
    studentId: LUCIA,
    kind: 'message',
    title: '¡Bienvenida a la app de Prana!',
    message: 'Ahora podés ver tu paquete, reservar tus clases y recibir avisos desde el celular. Tu tarjeta de papel ya fue migrada.',
    date: addDays(today, -20).toISOString(),
    read: true,
  })

  return {
    instructors: INSTRUCTORS,
    students,
    packages,
    classes,
    bookings,
    waitlist,
    movements,
    notifications,
  }
}
