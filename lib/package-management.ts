/**
 * Dominio de Gestión de Paquetes de 10 Clases y Control de Asistencias.
 *
 * Módulo puro de TypeScript sin dependencias de React ni del navegador,
 * cumpliendo con la especificación SPEC-001 y las reglas de negocio de AGENTS.md.
 */

export interface Student {
  id: string
  name: string
  email: string
  phone: string
  notes?: string
  joinedAt: string
}

export type PackageStatus = 'active' | 'exhausted'

export interface Package {
  id: string
  studentId: string
  total: number // Fijo en 10
  used: number // Clases consumidas
  available: number // total - used (0..10)
  assignedAt: string // ISO date
  status: PackageStatus
}

export type MovementType = 'pack_assignment' | 'attendance' | 'adjustment'

export interface Movement {
  id: string
  packageId: string
  studentId: string
  type: MovementType
  delta: number // +10, -1, +N, -N
  sessionId?: string
  reason: string
  performedBy: string
  timestamp: string
}

export interface AttendanceRecord {
  id: string
  studentId: string
  sessionId: string
  packageId: string
  sessionName: string
  timestamp: string
  recordedBy: string
}

export interface StudioDomainState {
  students: Student[]
  packages: Package[]
  movements: Movement[]
  attendances: AttendanceRecord[]
}

export type DomainResult<T> =
  | { ok: true; data: T; state: StudioDomainState; message: string }
  | { ok: false; error: string }

export const PACKAGE_CAPACITY = 10

let idCounter = 100
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`
}

/**
 * Registra una nueva alumna en el sistema.
 */
export function registerStudent(
  state: StudioDomainState,
  input: { name: string; email: string; phone: string; notes?: string },
  now = new Date().toISOString()
): DomainResult<Student> {
  const trimmedName = input.name.trim()
  if (!trimmedName) {
    return { ok: false, error: 'El nombre de la alumna es obligatorio.' }
  }

  const student: Student = {
    id: generateId('stu'),
    name: trimmedName,
    email: input.email.trim(),
    phone: input.phone.trim(),
    notes: input.notes?.trim() || undefined,
    joinedAt: now.slice(0, 10),
  }

  const nextState: StudioDomainState = {
    ...state,
    students: [...state.students, student],
  }

  return {
    ok: true,
    data: student,
    state: nextState,
    message: `Alumna ${student.name} registrada correctamente.`,
  }
}

/**
 * Asigna un nuevo paquete de 10 clases a una alumna (CA-01).
 * Debe iniciar con 10 clases disponibles y 0 utilizadas.
 */
export function assignPackage(
  state: StudioDomainState,
  studentId: string,
  performedBy = 'Andrea',
  now = new Date().toISOString()
): DomainResult<{ package: Package; movement: Movement }> {
  const student = state.students.find((s) => s.id === studentId)
  if (!student) {
    return { ok: false, error: 'La alumna especificada no existe en el sistema.' }
  }

  const packageId = generateId('pkg')
  const newPackage: Package = {
    id: packageId,
    studentId,
    total: PACKAGE_CAPACITY,
    used: 0,
    available: PACKAGE_CAPACITY,
    assignedAt: now,
    status: 'active',
  }

  const movement: Movement = {
    id: generateId('mov'),
    packageId,
    studentId,
    type: 'pack_assignment',
    delta: PACKAGE_CAPACITY,
    reason: 'Asignación de nuevo paquete de 10 clases',
    performedBy,
    timestamp: now,
  }

  const nextState: StudioDomainState = {
    ...state,
    packages: [...state.packages, newPackage],
    movements: [movement, ...state.movements],
  }

  return {
    ok: true,
    data: { package: newPackage, movement },
    state: nextState,
    message: `Paquete de 10 clases asignado a ${student.name}.`,
  }
}

/**
 * Registra una asistencia para una alumna y descuenta 1 clase del paquete (CA-02, CA-03, CA-04).
 */
export function recordAttendance(
  state: StudioDomainState,
  params: {
    studentId: string
    sessionId: string
    sessionName: string
    performedBy?: string
  },
  now = new Date().toISOString()
): DomainResult<{ package: Package; movement: Movement; attendance: AttendanceRecord }> {
  const { studentId, sessionId, sessionName, performedBy = 'Andrea' } = params

  const student = state.students.find((s) => s.id === studentId)
  if (!student) {
    return { ok: false, error: 'La alumna especificada no existe.' }
  }

  if (!sessionId.trim()) {
    return { ok: false, error: 'Debe especificarse el identificador de la sesión o clase.' }
  }

  // CA-03: Prevención de duplicados
  const alreadyAttended = state.attendances.some(
    (att) => att.studentId === studentId && att.sessionId === sessionId
  )
  if (alreadyAttended) {
    return {
      ok: false,
      error: `Ya existe una asistencia registrada para ${student.name} en esta sesión.`,
    }
  }

  // Buscar paquete activo con saldo disponible
  const activePackage = state.packages
    .filter((p) => p.studentId === studentId && p.status === 'active' && p.available > 0)
    .sort((a, b) => a.assignedAt.localeCompare(b.assignedAt))[0]

  // CA-04: Control de saldo
  if (!activePackage || activePackage.available <= 0) {
    return {
      ok: false,
      error: `No es posible registrar la asistencia: ${student.name} no cuenta con clases disponibles en su paquete.`,
    }
  }

  const nextUsed = activePackage.used + 1
  const nextAvailable = activePackage.total - nextUsed
  const nextStatus: PackageStatus = nextAvailable === 0 ? 'exhausted' : 'active'

  const updatedPackage: Package = {
    ...activePackage,
    used: nextUsed,
    available: nextAvailable,
    status: nextStatus,
  }

  const movement: Movement = {
    id: generateId('mov'),
    packageId: activePackage.id,
    studentId,
    type: 'attendance',
    delta: -1,
    sessionId,
    reason: `Asistencia: ${sessionName}`,
    performedBy,
    timestamp: now,
  }

  const attendance: AttendanceRecord = {
    id: generateId('att'),
    studentId,
    sessionId,
    packageId: activePackage.id,
    sessionName,
    timestamp: now,
    recordedBy: performedBy,
  }

  const nextState: StudioDomainState = {
    ...state,
    packages: state.packages.map((p) => (p.id === activePackage.id ? updatedPackage : p)),
    movements: [movement, ...state.movements],
    attendances: [attendance, ...state.attendances],
  }

  return {
    ok: true,
    data: { package: updatedPackage, movement, attendance },
    state: nextState,
    message: `Asistencia registrada para ${student.name}. Quedan ${nextAvailable} clases disponibles.`,
  }
}

/**
 * Realiza un ajuste administrativo justificado en un paquete (CA-05).
 * delta positivo: suma clases disponibles (reduce usadas).
 * delta negativo: descuenta clases disponibles (aumenta usadas).
 * No permite saldos negativos ni mayores a 10. Exige motivo justificado.
 */
export function applyAdjustment(
  state: StudioDomainState,
  params: {
    packageId: string
    delta: number
    reason: string
    performedBy?: string
  },
  now = new Date().toISOString()
): DomainResult<{ package: Package; movement: Movement }> {
  const { packageId, delta, reason, performedBy = 'Andrea' } = params

  const pkg = state.packages.find((p) => p.id === packageId)
  if (!pkg) {
    return { ok: false, error: 'El paquete especificado no existe.' }
  }

  const trimmedReason = reason.trim()
  if (!trimmedReason || trimmedReason.length < 3) {
    return { ok: false, error: 'El motivo del ajuste administrativo es obligatorio (mínimo 3 caracteres).' }
  }

  if (delta === 0) {
    return { ok: false, error: 'La cantidad de clases a ajustar debe ser distinta de cero.' }
  }

  const nextAvailable = pkg.available + delta

  if (nextAvailable < 0) {
    return {
      ok: false,
      error: `Ajuste rechazado: el saldo resultante (${nextAvailable}) no puede ser menor a cero.`,
    }
  }

  if (nextAvailable > PACKAGE_CAPACITY) {
    return {
      ok: false,
      error: `Ajuste rechazado: el saldo resultante (${nextAvailable}) no puede superar el límite de ${PACKAGE_CAPACITY} clases.`,
    }
  }

  const nextUsed = pkg.total - nextAvailable
  const nextStatus: PackageStatus = nextAvailable === 0 ? 'exhausted' : 'active'

  const updatedPackage: Package = {
    ...pkg,
    used: nextUsed,
    available: nextAvailable,
    status: nextStatus,
  }

  const movement: Movement = {
    id: generateId('mov'),
    packageId: pkg.id,
    studentId: pkg.studentId,
    type: 'adjustment',
    delta,
    reason: `Ajuste administrativo: ${trimmedReason}`,
    performedBy,
    timestamp: now,
  }

  const nextState: StudioDomainState = {
    ...state,
    packages: state.packages.map((p) => (p.id === pkg.id ? updatedPackage : p)),
    movements: [movement, ...state.movements],
  }

  return {
    ok: true,
    data: { package: updatedPackage, movement },
    state: nextState,
    message: `Ajuste realizado con éxito. Nuevo saldo: ${nextAvailable} clases disponibles.`,
  }
}

/**
 * Obtiene el historial ordenado cronológicamente para una alumna o paquete.
 */
export function getPackageHistory(state: StudioDomainState, packageId: string): Movement[] {
  return state.movements
    .filter((m) => m.packageId === packageId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export function getStudentHistory(state: StudioDomainState, studentId: string): Movement[] {
  return state.movements
    .filter((m) => m.studentId === studentId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

/**
 * Crea el lote inicial de datos de demostración requerido por la consigna:
 * - Andrea (administradora)
 * - 2 instructoras (Carla Ruiz, Sofía Benítez)
 * - 5 alumnas
 * - 1 alumna con paquete nuevo (10 disp, 0 usadas)
 * - 1 alumna con varias clases usadas (4 disp, 6 usadas)
 * - 1 alumna con paquete agotado (0 disp, 10 usadas)
 * - Movimientos históricos asociados
 */
export function createDemoState(): StudioDomainState {
  const baseDate = '2026-10-15T10:00:00.000Z'
  const date2 = '2026-10-18T18:30:00.000Z'
  const date3 = '2026-10-22T09:00:00.000Z'
  const date4 = '2026-10-25T18:30:00.000Z'
  const dateRecent = '2026-10-29T19:00:00.000Z'

  const students: Student[] = [
    {
      id: 'stu-1',
      name: 'Valentina López',
      email: 'valentina.lopez@mail.com',
      phone: '+54 9 11 4521-8899',
      notes: 'Alumna principiante. Prefiere clases de Hatha Yoga.',
      joinedAt: '2026-10-28',
    },
    {
      id: 'stu-2',
      name: 'Martina Gómez',
      email: 'martina.gomez@mail.com',
      phone: '+54 9 11 5874-1234',
      notes: 'Practica Vinyasa Flow dos veces por semana.',
      joinedAt: '2026-09-10',
    },
    {
      id: 'stu-3',
      name: 'Camila Díaz',
      email: 'camila.diaz@mail.com',
      phone: '+54 9 11 6321-4567',
      notes: 'Asiste a clases de Yoga Suave los viernes.',
      joinedAt: '2026-08-01',
    },
    {
      id: 'stu-4',
      name: 'Lucía Fernández',
      email: 'lucia.fernandez@mail.com',
      phone: '+54 9 11 7412-9630',
      notes: 'Lesión leve en rodilla derecha. Cuidado en flexiones profundas.',
      joinedAt: '2026-09-20',
    },
    {
      id: 'stu-5',
      name: 'Julieta Romero',
      email: 'julieta.romero@mail.com',
      phone: '+54 9 11 3698-5214',
      joinedAt: '2026-10-26',
    },
  ]

  // Paquetes:
  // 1. Valentina: Paquete NUEVO (10 disp, 0 usadas)
  const pkg1: Package = {
    id: 'pkg-1',
    studentId: 'stu-1',
    total: 10,
    used: 0,
    available: 10,
    assignedAt: dateRecent,
    status: 'active',
  }

  // 2. Martina: Paquete con VARIAS USADAS (4 disp, 6 usadas)
  const pkg2: Package = {
    id: 'pkg-2',
    studentId: 'stu-2',
    total: 10,
    used: 6,
    available: 4,
    assignedAt: baseDate,
    status: 'active',
  }

  // 3. Camila: Paquete AGOTADO (0 disp, 10 usadas)
  const pkg3: Package = {
    id: 'pkg-3',
    studentId: 'stu-3',
    total: 10,
    used: 10,
    available: 0,
    assignedAt: '2026-09-01T10:00:00.000Z',
    status: 'exhausted',
  }

  // 4. Lucía: 7 disp, 3 usadas
  const pkg4: Package = {
    id: 'pkg-4',
    studentId: 'stu-4',
    total: 10,
    used: 3,
    available: 7,
    assignedAt: date2,
    status: 'active',
  }

  // Movimientos históricos
  const movements: Movement[] = [
    // Movimientos Valentina (solo alta)
    {
      id: 'mov-1',
      packageId: 'pkg-1',
      studentId: 'stu-1',
      type: 'pack_assignment',
      delta: 10,
      reason: 'Asignación de nuevo paquete de 10 clases',
      performedBy: 'Andrea',
      timestamp: dateRecent,
    },
    // Movimientos Martina (alta + 6 asistencias)
    {
      id: 'mov-2-att6',
      packageId: 'pkg-2',
      studentId: 'stu-2',
      type: 'attendance',
      delta: -1,
      sessionId: 'ses-20261028-1830',
      reason: 'Asistencia: Vinyasa Flow 18:30',
      performedBy: 'Carla',
      timestamp: '2026-10-28T18:35:00.000Z',
    },
    {
      id: 'mov-2-att5',
      packageId: 'pkg-2',
      studentId: 'stu-2',
      type: 'attendance',
      delta: -1,
      sessionId: 'ses-20261026-1830',
      reason: 'Asistencia: Vinyasa Flow 18:30',
      performedBy: 'Carla',
      timestamp: '2026-10-26T18:32:00.000Z',
    },
    {
      id: 'mov-2-att4',
      packageId: 'pkg-2',
      studentId: 'stu-2',
      type: 'attendance',
      delta: -1,
      sessionId: 'ses-20261024-1830',
      reason: 'Asistencia: Vinyasa Flow 18:30',
      performedBy: 'Carla',
      timestamp: '2026-10-24T18:31:00.000Z',
    },
    {
      id: 'mov-2-att3',
      packageId: 'pkg-2',
      studentId: 'stu-2',
      type: 'attendance',
      delta: -1,
      sessionId: 'ses-20261021-1830',
      reason: 'Asistencia: Vinyasa Flow 18:30',
      performedBy: 'Carla',
      timestamp: '2026-10-21T18:30:00.000Z',
    },
    {
      id: 'mov-2-att2',
      packageId: 'pkg-2',
      studentId: 'stu-2',
      type: 'attendance',
      delta: -1,
      sessionId: 'ses-20261019-1830',
      reason: 'Asistencia: Vinyasa Flow 18:30',
      performedBy: 'Carla',
      timestamp: '2026-10-19T18:30:00.000Z',
    },
    {
      id: 'mov-2-att1',
      packageId: 'pkg-2',
      studentId: 'stu-2',
      type: 'attendance',
      delta: -1,
      sessionId: 'ses-20261016-1830',
      reason: 'Asistencia: Vinyasa Flow 18:30',
      performedBy: 'Carla',
      timestamp: '2026-10-16T18:35:00.000Z',
    },
    {
      id: 'mov-2-init',
      packageId: 'pkg-2',
      studentId: 'stu-2',
      type: 'pack_assignment',
      delta: 10,
      reason: 'Asignación de nuevo paquete de 10 clases',
      performedBy: 'Andrea',
      timestamp: baseDate,
    },
    // Movimientos Camila (alta + 10 asistencias previas)
    {
      id: 'mov-3-att10',
      packageId: 'pkg-3',
      studentId: 'stu-3',
      type: 'attendance',
      delta: -1,
      sessionId: 'ses-20261020-1000',
      reason: 'Asistencia: Yoga Suave 10:00',
      performedBy: 'Sofía',
      timestamp: '2026-10-20T10:05:00.000Z',
    },
    {
      id: 'mov-3-init',
      packageId: 'pkg-3',
      studentId: 'stu-3',
      type: 'pack_assignment',
      delta: 10,
      reason: 'Asignación de nuevo paquete de 10 clases',
      performedBy: 'Andrea',
      timestamp: '2026-09-01T10:00:00.000Z',
    },
    // Movimientos Lucía
    {
      id: 'mov-4-att3',
      packageId: 'pkg-4',
      studentId: 'stu-4',
      type: 'attendance',
      delta: -1,
      sessionId: 'ses-20261027-0800',
      reason: 'Asistencia: Hatha Yoga 08:00',
      performedBy: 'Andrea',
      timestamp: '2026-10-27T08:02:00.000Z',
    },
    {
      id: 'mov-4-init',
      packageId: 'pkg-4',
      studentId: 'stu-4',
      type: 'pack_assignment',
      delta: 10,
      reason: 'Asignación de nuevo paquete de 10 clases',
      performedBy: 'Andrea',
      timestamp: date2,
    },
  ]

  const attendances: AttendanceRecord[] = [
    {
      id: 'att-2-6',
      studentId: 'stu-2',
      sessionId: 'ses-20261028-1830',
      packageId: 'pkg-2',
      sessionName: 'Vinyasa Flow 18:30',
      timestamp: '2026-10-28T18:35:00.000Z',
      recordedBy: 'Carla',
    },
    {
      id: 'att-2-5',
      studentId: 'stu-2',
      sessionId: 'ses-20261026-1830',
      packageId: 'pkg-2',
      sessionName: 'Vinyasa Flow 18:30',
      timestamp: '2026-10-26T18:32:00.000Z',
      recordedBy: 'Carla',
    },
    {
      id: 'att-3-10',
      studentId: 'stu-3',
      sessionId: 'ses-20261020-1000',
      packageId: 'pkg-3',
      sessionName: 'Yoga Suave 10:00',
      timestamp: '2026-10-20T10:05:00.000Z',
      recordedBy: 'Sofía',
    },
    {
      id: 'att-4-3',
      studentId: 'stu-4',
      sessionId: 'ses-20261027-0800',
      packageId: 'pkg-4',
      sessionName: 'Hatha Yoga 08:00',
      timestamp: '2026-10-27T08:02:00.000Z',
      recordedBy: 'Andrea',
    },
  ]

  return {
    students,
    packages: [pkg1, pkg2, pkg3, pkg4],
    movements,
    attendances,
  }
}
