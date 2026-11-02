/**
 * Dominio de Sala en Vivo (12 Mats) y Alertas Preventivas de Saldo ("Semáforo Zen").
 *
 * Módulo puro de TypeScript sin dependencias de UI, implementando SPEC-002.
 */

import {
  type StudioDomainState,
  type DomainResult,
  recordAttendance,
  applyAdjustment,
  getActivePackage,
} from './package-management'

export const ROOM_CAPACITY = 12 // Capacidad física estricta de mats en la sala de Andrea

export type StatusTier = 'optimal' | 'warning_low' | 'exhausted'

export interface LiveMatOccupancy {
  matNumber: number // 1..12
  studentId: string
  studentName: string
  packageId: string
  remainingClassesAfterCheckIn: number
  statusTier: StatusTier
  checkedInAt: string
}

export interface LiveRoomSession {
  sessionId: string
  sessionName: string
  instructor: string
  capacity: number // 12
  occupiedMats: LiveMatOccupancy[]
}

/**
 * Determina el nivel del Semáforo Zen según clases disponibles restantes:
 * - >= 3 clases: optimal (🟢)
 * - 1..2 clases: warning_low (🟡 Alerta de renovación preventiva)
 * - 0 clases: exhausted (🔴 Paquete agotado)
 */
export function calculateStatusTier(available: number): StatusTier {
  if (available >= 3) return 'optimal'
  if (available >= 1) return 'warning_low'
  return 'exhausted'
}

/**
 * Crea o inicializa el estado de una sala en vivo para una sesión determinada.
 */
export function createLiveRoomSession(
  sessionId: string,
  sessionName: string,
  instructor: string,
  existingOccupants: LiveMatOccupancy[] = []
): LiveRoomSession {
  return {
    sessionId,
    sessionName,
    instructor,
    capacity: ROOM_CAPACITY,
    occupiedMats: existingOccupants,
  }
}

/**
 * Obtiene métricas en tiempo real de la sala.
 */
export function getRoomOccupancy(room: LiveRoomSession) {
  const occupied = room.occupiedMats.length
  const free = Math.max(0, room.capacity - occupied)
  const percentage = Math.round((occupied / room.capacity) * 100)
  const isFull = occupied >= room.capacity

  return {
    total: room.capacity,
    occupied,
    free,
    percentage,
    isFull,
  }
}

export type QuickCheckInResult =
  | {
      ok: true
      data: {
        matNumber: number
        occupancy: LiveMatOccupancy
        room: LiveRoomSession
        domainState: StudioDomainState
      }
      message: string
    }
  | {
      ok: false
      error: string
      code: 'ROOM_FULL' | 'STUDENT_NOT_FOUND' | 'NO_ACTIVE_PACKAGE' | 'NO_BALANCE' | 'ALREADY_CHECKED_IN'
    }

/**
 * Ejecuta el Check-in Rápido de una alumna en la sala en vivo (CA-01, CA-02, CA-03, CA-04).
 */
export function performQuickCheckIn(
  room: LiveRoomSession,
  domainState: StudioDomainState,
  studentId: string,
  performedBy: string,
  now = new Date().toISOString()
): QuickCheckInResult {
  // CA-01: Validar límite estricto de 12 mats
  if (room.occupiedMats.length >= room.capacity) {
    return {
      ok: false,
      code: 'ROOM_FULL',
      error: `Cupo completo: la sala alcanzó el límite estricto de ${room.capacity} personas.`,
    }
  }

  // Validar si la alumna ya está registrada en la sala actual
  if (room.occupiedMats.some((m) => m.studentId === studentId)) {
    return {
      ok: false,
      code: 'ALREADY_CHECKED_IN',
      error: 'La alumna ya tiene un mat asignado en esta clase.',
    }
  }

  const student = domainState.students.find((s) => s.id === studentId)
  if (!student) {
    return {
      ok: false,
      code: 'STUDENT_NOT_FOUND',
      error: 'La alumna seleccionada no existe en el sistema.',
    }
  }

  // CA-04: Validar paquete activo y saldo
  const pkg = getActivePackage(domainState, studentId)
  if (!pkg) {
    return {
      ok: false,
      code: 'NO_ACTIVE_PACKAGE',
      error: 'La alumna no posee ningún paquete de clases asignado.',
    }
  }

  if (pkg.available <= 0) {
    return {
      ok: false,
      code: 'NO_BALANCE',
      error: 'Sin clases disponibles en el paquete. Debe asignar o renovar un paquete de 10 clases.',
    }
  }

  // CA-02: Registrar asistencia a nivel dominio (descuenta 1 clase e impacta movimientos)
  const domainRes = recordAttendance(
    domainState,
    {
      studentId,
      sessionId: room.sessionId,
      sessionName: room.sessionName,
      performedBy,
    },
    now
  )

  if (!domainRes.ok) {
    return {
      ok: false,
      code: 'ALREADY_CHECKED_IN',
      error: domainRes.error,
    }
  }

  // Asignar el primer número de mat físico disponible entre 1 y 12
  const occupiedNumbers = new Set(room.occupiedMats.map((m) => m.matNumber))
  let assignedMat = 1
  for (let i = 1; i <= room.capacity; i++) {
    if (!occupiedNumbers.has(i)) {
      assignedMat = i
      break
    }
  }

  // CA-03: Calcular saldo restante y Semáforo Zen
  const updatedPkg = domainRes.state.packages.find((p) => p.id === pkg.id)
  const remaining = updatedPkg ? updatedPkg.available : pkg.available - 1
  const tier = calculateStatusTier(remaining)

  const occupancy: LiveMatOccupancy = {
    matNumber: assignedMat,
    studentId: student.id,
    studentName: student.name,
    packageId: pkg.id,
    remainingClassesAfterCheckIn: remaining,
    statusTier: tier,
    checkedInAt: now,
  }

  const nextRoom: LiveRoomSession = {
    ...room,
    occupiedMats: [...room.occupiedMats, occupancy].sort((a, b) => a.matNumber - b.matNumber),
  }

  let msg = `Check-in exitoso: Mat #${assignedMat} asignado a ${student.name}.`
  if (tier === 'warning_low') {
    msg += ` ¡Alerta de renovación! Le quedan ${remaining} ${remaining === 1 ? 'clase' : 'clases'}.`
  }

  return {
    ok: true,
    data: {
      matNumber: assignedMat,
      occupancy,
      room: nextRoom,
      domainState: domainRes.state,
    },
    message: msg,
  }
}

export type ReleaseMatResult =
  | {
      ok: true
      data: {
        releasedMatNumber: number
        room: LiveRoomSession
        domainState: StudioDomainState
      }
      message: string
    }
  | {
      ok: false
      error: string
    }

/**
 * Libera un mat de la sala reintegrando la clase al paquete de la alumna (CA-05).
 */
export function releaseMat(
  room: LiveRoomSession,
  domainState: StudioDomainState,
  matNumber: number,
  performedBy: string,
  reason = 'Cancelación de check-in / retiro de sala',
  now = new Date().toISOString()
): ReleaseMatResult {
  const occupant = room.occupiedMats.find((m) => m.matNumber === matNumber)
  if (!occupant) {
    return {
      ok: false,
      error: `El Mat #${matNumber} no está ocupado en esta sesión.`,
    }
  }

  // Reintegrar la clase con un ajuste administrativo (+1) justificando la liberación
  const adjustRes = applyAdjustment(
    domainState,
    {
      packageId: occupant.packageId,
      delta: 1,
      reason: `Reintegro por liberación de Mat #${matNumber} en ${room.sessionName}: ${reason}`,
      performedBy,
    },
    now
  )

  if (!adjustRes.ok) {
    return {
      ok: false,
      error: `No se pudo reintegrar la clase: ${adjustRes.error}`,
    }
  }

  // Eliminar asistencia asociada a esta sesión para no bloquear un futuro ingreso legítimo
  const nextAttendances = adjustRes.state.attendances.filter(
    (a) => !(a.studentId === occupant.studentId && a.sessionId === room.sessionId)
  )

  const nextDomainState: StudioDomainState = {
    ...adjustRes.state,
    attendances: nextAttendances,
  }

  const nextRoom: LiveRoomSession = {
    ...room,
    occupiedMats: room.occupiedMats.filter((m) => m.matNumber !== matNumber),
  }

  return {
    ok: true,
    data: {
      releasedMatNumber: matNumber,
      room: nextRoom,
      domainState: nextDomainState,
    },
    message: `Mat #${matNumber} liberado y 1 clase reintegrada a ${occupant.studentName}.`,
  }
}
