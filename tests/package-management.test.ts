import { describe, it, expect, beforeEach } from 'vitest'
import {
  createDemoState,
  assignPackage,
  recordAttendance,
  applyAdjustment,
  registerStudent,
  getPackageHistory,
  getStudentHistory,
  type StudioDomainState,
  PACKAGE_CAPACITY,
} from '../lib/package-management'

describe('SPEC-001 — Gestión de Paquetes de 10 Clases y Control de Asistencias', () => {
  let state: StudioDomainState

  beforeEach(() => {
    state = createDemoState()
  })

  describe('CA-01 — Asignación de paquete', () => {
    it('dada una alumna registrada, cuando Andrea le asigna un paquete nuevo de 10 clases, el sistema debe mostrar 10 clases disponibles y 0 utilizadas', () => {
      // Alumna sin paquete activo previo (Julieta Romero)
      const studentId = 'stu-5'
      const initialPackagesCount = state.packages.filter((p) => p.studentId === studentId).length
      expect(initialPackagesCount).toBe(0)

      const result = assignPackage(state, studentId, 'Andrea')

      expect(result.ok).toBe(true)
      if (!result.ok) return

      const { package: newPkg, movement } = result.data
      expect(newPkg.total).toBe(10)
      expect(newPkg.used).toBe(0)
      expect(newPkg.available).toBe(10)
      expect(newPkg.status).toBe('active')
      expect(newPkg.studentId).toBe(studentId)

      // Verificar que el movimiento se registró en el historial
      expect(movement.type).toBe('pack_assignment')
      expect(movement.delta).toBe(10)
      expect(movement.performedBy).toBe('Andrea')

      // Verificar el estado resultante
      const updatedPkg = result.state.packages.find((p) => p.id === newPkg.id)
      expect(updatedPkg).toBeDefined()
      expect(updatedPkg?.available).toBe(10)
      expect(updatedPkg?.used).toBe(0)
    })

    it('rechaza la asignación si la alumna no existe', () => {
      const result = assignPackage(state, 'alumno-fantasma', 'Andrea')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toContain('no existe')
      }
    })
  })

  describe('CA-02 — Registro de asistencia', () => {
    it('dado un paquete activo con saldo disponible, cuando se registra una asistencia válida, el sistema debe descontar una clase y guardar el movimiento correspondiente en el historial', () => {
      // Valentina tiene un paquete nuevo con 10 clases disponibles y 0 usadas
      const studentId = 'stu-1'
      const session = {
        studentId,
        sessionId: 'ses-20261030-0800',
        sessionName: 'Hatha Yoga 08:00',
        performedBy: 'Carla',
      }

      const initialPkg = state.packages.find((p) => p.studentId === studentId && p.status === 'active')!
      expect(initialPkg.available).toBe(10)
      expect(initialPkg.used).toBe(0)

      const result = recordAttendance(state, session)

      expect(result.ok).toBe(true)
      if (!result.ok) return

      // Descontó exactamente 1 clase
      expect(result.data.package.available).toBe(9)
      expect(result.data.package.used).toBe(1)
      expect(result.data.package.status).toBe('active')

      // Registró movimiento en historial
      expect(result.data.movement.type).toBe('attendance')
      expect(result.data.movement.delta).toBe(-1)
      expect(result.data.movement.sessionId).toBe(session.sessionId)
      expect(result.data.movement.performedBy).toBe('Carla')

      // Asentó la asistencia
      expect(result.data.attendance.sessionId).toBe(session.sessionId)
      expect(result.state.attendances).toHaveLength(state.attendances.length + 1)
    })
  })

  describe('CA-03 — Prevención de duplicados', () => {
    it('dada una asistencia registrada para una alumna y una sesión determinada, cuando se intenta registrar nuevamente esa misma asistencia, el sistema debe rechazar la operación sin modificar el saldo', () => {
      // Martina ya tiene registrada la asistencia para 'ses-20261028-1830' en el demo seed
      const studentId = 'stu-2'
      const duplicateSessionId = 'ses-20261028-1830'

      const pkgBefore = state.packages.find((p) => p.studentId === studentId && p.id === 'pkg-2')!
      const availableBefore = pkgBefore.available
      const usedBefore = pkgBefore.used
      const movementsCountBefore = state.movements.length

      const result = recordAttendance(state, {
        studentId,
        sessionId: duplicateSessionId,
        sessionName: 'Vinyasa Flow 18:30 (Reintento)',
        performedBy: 'Carla',
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toMatch(/ya existe una asistencia registrada/i)
      }

      // El estado original no debe haberse alterado
      const pkgAfter = state.packages.find((p) => p.studentId === studentId && p.id === 'pkg-2')!
      expect(pkgAfter.available).toBe(availableBefore)
      expect(pkgAfter.used).toBe(usedBefore)
      expect(state.movements.length).toBe(movementsCountBefore)
    })
  })

  describe('CA-04 — Control de saldo', () => {
    it('dado un paquete sin clases disponibles, cuando se intenta registrar otra asistencia, el sistema debe impedir la operación y mostrar un mensaje claro', () => {
      // Camila Díaz tiene un paquete agotado (0 disp, 10 usadas)
      const studentId = 'stu-3'
      const pkgCamila = state.packages.find((p) => p.studentId === studentId)!
      expect(pkgCamila.available).toBe(0)
      expect(pkgCamila.status).toBe('exhausted')

      const result = recordAttendance(state, {
        studentId,
        sessionId: 'ses-20261030-1000',
        sessionName: 'Yoga Suave 10:00',
        performedBy: 'Sofía',
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toMatch(/no cuenta con clases disponibles/i)
      }

      // No se creó ningún movimiento
      const movementsCamila = getStudentHistory(state, studentId)
      expect(movementsCamila.some((m) => m.sessionId === 'ses-20261030-1000')).toBe(false)
    })

    it('transiciona a estado exhausted cuando se consume la última clase disponible', () => {
      // Crear un estado donde a Lucía le queda exactamente 1 clase
      const customPkg = { ...state.packages[3], available: 1, used: 9, status: 'active' as const }
      const customState: StudioDomainState = {
        ...state,
        packages: state.packages.map((p) => (p.id === customPkg.id ? customPkg : p)),
      }

      const res = recordAttendance(customState, {
        studentId: customPkg.studentId,
        sessionId: 'ses-ultima-clase',
        sessionName: 'Última clase de prueba',
      })

      expect(res.ok).toBe(true)
      if (!res.ok) return

      expect(res.data.package.available).toBe(0)
      expect(res.data.package.used).toBe(10)
      expect(res.data.package.status).toBe('exhausted')
    })
  })

  describe('CA-05 — Historial y ajustes', () => {
    it('dado un paquete con movimientos registrados, Andrea debe poder consultar su historial completo y realizar ajustes justificados dentro de los límites válidos (0 a 10)', () => {
      const studentId = 'stu-2' // Martina
      const pkg = state.packages.find((p) => p.studentId === studentId && p.id === 'pkg-2')!
      expect(pkg.available).toBe(4)

      // 1. Consultar historial
      const history = getStudentHistory(state, studentId)
      expect(history.length).toBeGreaterThan(0)
      expect(history[0].timestamp >= history[history.length - 1].timestamp).toBe(true)

      // 2. Ajuste positivo válido: devolver 1 clase por error humano previo
      const adjustRes = applyAdjustment(state, {
        packageId: pkg.id,
        delta: 1,
        reason: 'Corrección por clase suspendida por lluvia que se había sellado',
        performedBy: 'Andrea',
      })

      expect(adjustRes.ok).toBe(true)
      if (!adjustRes.ok) return

      expect(adjustRes.data.package.available).toBe(5)
      expect(adjustRes.data.package.used).toBe(5)
      expect(adjustRes.data.movement.type).toBe('adjustment')
      expect(adjustRes.data.movement.delta).toBe(1)
      expect(adjustRes.data.movement.reason).toContain('lluvia')

      // Verificar que el historial ahora incluye el ajuste
      const updatedHistory = getPackageHistory(adjustRes.state, pkg.id)
      expect(updatedHistory[0].type).toBe('adjustment')
    })

    it('impide realizar un ajuste que deje el saldo por debajo de 0', () => {
      const pkg = state.packages.find((p) => p.id === 'pkg-2')! // available: 4
      const result = applyAdjustment(state, {
        packageId: pkg.id,
        delta: -5, // Quedaría en -1
        reason: 'Ajuste excesivo erróneo',
        performedBy: 'Andrea',
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toMatch(/no puede ser menor a cero/i)
      }
    })

    it('impide realizar un ajuste que haga que el saldo supere el límite de 10 clases', () => {
      const pkg = state.packages.find((p) => p.id === 'pkg-1')! // Valentina tiene 10 disp
      const result = applyAdjustment(state, {
        packageId: pkg.id,
        delta: 1, // Quedaría en 11
        reason: 'Intento de cargar clase extra fuera de cupo',
        performedBy: 'Andrea',
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toMatch(/no puede superar el límite de 10 clases/i)
      }
    })

    it('exige obligatoriamente un motivo descriptivo para el ajuste', () => {
      const pkg = state.packages.find((p) => p.id === 'pkg-2')!
      const result = applyAdjustment(state, {
        packageId: pkg.id,
        delta: 1,
        reason: '   ', // Motivo vacío
        performedBy: 'Andrea',
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toMatch(/motivo del ajuste administrativo es obligatorio/i)
      }
    })
  })

  describe('Registro de nuevas alumnas', () => {
    it('registra una nueva alumna con sus datos básicos', () => {
      const res = registerStudent(state, {
        name: 'Sofía Morán',
        email: 'sofia.moran@mail.com',
        phone: '+54 9 11 2233-4455',
        notes: 'Viene recomendada por Martina.',
      })

      expect(res.ok).toBe(true)
      if (!res.ok) return

      expect(res.data.name).toBe('Sofía Morán')
      expect(res.data.notes).toBe('Viene recomendada por Martina.')
      expect(res.state.students).toHaveLength(state.students.length + 1)
    })

    it('rechaza el registro si el nombre está vacío', () => {
      const res = registerStudent(state, {
        name: '   ',
        email: 'test@mail.com',
        phone: '12345',
      })

      expect(res.ok).toBe(false)
      if (!res.ok) {
        expect(res.error).toMatch(/nombre de la alumna es obligatorio/i)
      }
    })
  })
})
