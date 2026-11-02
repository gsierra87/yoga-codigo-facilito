import { describe, it, expect, beforeEach } from 'vitest'
import {
  createLiveRoomSession,
  performQuickCheckIn,
  releaseMat,
  calculateStatusTier,
  getRoomOccupancy,
  ROOM_CAPACITY,
} from '../lib/live-room'
import {
  createDemoState,
  assignPackage,
  registerStudent,
  type StudioDomainState,
} from '../lib/package-management'

describe('SPEC-002 — Monitor de Sala en Vivo (12 Mats) y Alertas Preventivas', () => {
  let domainState: StudioDomainState

  beforeEach(() => {
    domainState = createDemoState()
  })

  it('determina correctamente el Semáforo Zen según clases disponibles', () => {
    expect(calculateStatusTier(10)).toBe('optimal')
    expect(calculateStatusTier(3)).toBe('optimal')
    expect(calculateStatusTier(2)).toBe('warning_low')
    expect(calculateStatusTier(1)).toBe('warning_low')
    expect(calculateStatusTier(0)).toBe('exhausted')
  })

  it('CA-02: Check-in rápido asigna el primer mat libre y descuenta 1 clase', () => {
    // Valentina (stu-1) tiene 10 clases disponibles
    const room = createLiveRoomSession('ses-test-1', 'Vinyasa Tarde 18:30', 'Carla')
    const result = performQuickCheckIn(room, domainState, 'stu-1', 'Carla')

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.matNumber).toBe(1)
      expect(result.data.occupancy.remainingClassesAfterCheckIn).toBe(9)
      expect(result.data.occupancy.statusTier).toBe('optimal')
      expect(result.data.room.occupiedMats).toHaveLength(1)

      // Verificamos que en el dominio se descontó la clase
      const updatedPkg = result.data.domainState.packages.find((p) => p.studentId === 'stu-1')
      expect(updatedPkg?.available).toBe(9)
      expect(updatedPkg?.used).toBe(1)
    }
  })

  it('CA-03: Activa alerta preventiva (warning_low) cuando quedan 1 o 2 clases', () => {
    // Martina Gómez (stu-2) tiene 4 disponibles inicialmente.
    // Hacemos que tenga 2 clases disponibles asignándole un ajuste o consumiendo
    let room = createLiveRoomSession('ses-test-2', 'Vinyasa Tarde 18:30', 'Carla')

    // Primera asistencia de Martina
    const res1 = performQuickCheckIn(room, domainState, 'stu-2', 'Carla')
    expect(res1.ok).toBe(true)
    if (!res1.ok) return

    // Quedan 3 (optimal)
    expect(res1.data.occupancy.remainingClassesAfterCheckIn).toBe(3)
    expect(res1.data.occupancy.statusTier).toBe('optimal')

    // Segunda clase en otra sesión para llevarla a 2 disponibles
    const room2 = createLiveRoomSession('ses-test-3', 'Vinyasa Tarde 20:00', 'Carla')
    const res2 = performQuickCheckIn(room2, res1.data.domainState, 'stu-2', 'Carla')
    expect(res2.ok).toBe(true)
    if (!res2.ok) return

    // Ahora quedan 2 -> Alerta preventiva
    expect(res2.data.occupancy.remainingClassesAfterCheckIn).toBe(2)
    expect(res2.data.occupancy.statusTier).toBe('warning_low')
    expect(res2.message).toContain('¡Alerta de renovación!')
  })

  it('CA-04: Bloquea check-in si la alumna tiene 0 clases disponibles', () => {
    // Camila Díaz (stu-3) tiene paquete agotado (0 disponibles)
    const room = createLiveRoomSession('ses-test-camila', 'Hatha Yoga', 'Andrea')
    const result = performQuickCheckIn(room, domainState, 'stu-3', 'Andrea')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('NO_BALANCE')
      expect(result.error).toContain('Sin clases disponibles en el paquete')
    }
  })

  it('CA-01: Control estricto de cupo de 12 mats (bloquea la 13ª alumna)', () => {
    let currentDomain = domainState
    let room = createLiveRoomSession('ses-llena', 'Vinyasa Tarde 18:30', 'Carla')

    // Registramos 12 alumnas para llenar la sala
    for (let i = 1; i <= 12; i++) {
      const stuRes = registerStudent(currentDomain, {
        name: `Alumna Número ${i}`,
        email: `alumna${i}@test.com`,
        phone: `11000000${i}`,
      })
      expect(stuRes.ok).toBe(true)
      if (!stuRes.ok) return
      currentDomain = stuRes.state

      const pkgRes = assignPackage(currentDomain, stuRes.data.id, 'Andrea')
      expect(pkgRes.ok).toBe(true)
      if (!pkgRes.ok) return
      currentDomain = pkgRes.state

      const checkInRes = performQuickCheckIn(room, currentDomain, stuRes.data.id, 'Carla')
      expect(checkInRes.ok).toBe(true)
      if (!checkInRes.ok) return
      room = checkInRes.data.room
      currentDomain = checkInRes.data.domainState
    }

    // Verificamos que la sala está llena con 12 mats
    const occ = getRoomOccupancy(room)
    expect(occ.total).toBe(ROOM_CAPACITY)
    expect(occ.occupied).toBe(12)
    expect(occ.free).toBe(0)
    expect(occ.isFull).toBe(true)

    // Creamos la alumna 13 e intentamos registrarla
    const stu13Res = registerStudent(currentDomain, {
      name: 'Alumna Trece',
      email: 'trece@test.com',
      phone: '1199999999',
    })
    if (!stu13Res.ok) return
    currentDomain = stu13Res.state
    const pkg13Res = assignPackage(currentDomain, stu13Res.data.id, 'Andrea')
    if (!pkg13Res.ok) return
    currentDomain = pkg13Res.state

    // Intento de Check-in de la 13ª alumna
    const overCapacityRes = performQuickCheckIn(room, currentDomain, stu13Res.data.id, 'Carla')
    expect(overCapacityRes.ok).toBe(false)
    if (!overCapacityRes.ok) {
      expect(overCapacityRes.code).toBe('ROOM_FULL')
      expect(overCapacityRes.error).toContain('Cupo completo: la sala alcanzó el límite estricto de 12 personas')
    }
  })

  it('CA-05: Libera un mat, reintegra la clase (+1) y disminuye ocupación', () => {
    const room = createLiveRoomSession('ses-liberar', 'Vinyasa Flow', 'Carla')
    const checkInRes = performQuickCheckIn(room, domainState, 'stu-1', 'Carla')
    expect(checkInRes.ok).toBe(true)
    if (!checkInRes.ok) return

    const roomCon1 = checkInRes.data.room
    expect(roomCon1.occupiedMats).toHaveLength(1)
    expect(checkInRes.data.domainState.packages.find((p) => p.studentId === 'stu-1')?.available).toBe(9)

    // Liberar Mat #1
    const releaseRes = releaseMat(roomCon1, checkInRes.data.domainState, 1, 'Carla', 'Se retiró por urgencia')
    expect(releaseRes.ok).toBe(true)
    if (releaseRes.ok) {
      expect(releaseRes.data.room.occupiedMats).toHaveLength(0)
      const restoredPkg = releaseRes.data.domainState.packages.find((p) => p.studentId === 'stu-1')
      expect(restoredPkg?.available).toBe(10) // Vuelve a tener 10
      expect(releaseRes.message).toContain('Mat #1 liberado y 1 clase reintegrada')
    }
  })

  it('rechaza check-in duplicado en la misma sala para la misma alumna', () => {
    const room = createLiveRoomSession('ses-dup', 'Hatha Yoga', 'Andrea')
    const res1 = performQuickCheckIn(room, domainState, 'stu-1', 'Andrea')
    expect(res1.ok).toBe(true)
    if (!res1.ok) return

    const res2 = performQuickCheckIn(res1.data.room, res1.data.domainState, 'stu-1', 'Andrea')
    expect(res2.ok).toBe(false)
    if (!res2.ok) {
      expect(res2.code).toBe('ALREADY_CHECKED_IN')
    }
  })
})
