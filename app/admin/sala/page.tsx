'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Users,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  PlusCircle,
  MessageCircle,
  ArrowLeft,
  XCircle,
  CalendarCheck,
  ShieldCheck,
  Package,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  createLiveRoomSession,
  performQuickCheckIn,
  releaseMat,
  getRoomOccupancy,
  calculateStatusTier,
  ROOM_CAPACITY,
  type LiveRoomSession,
  type LiveMatOccupancy,
} from '@/lib/live-room'
import {
  createDemoState,
  assignPackage,
  type StudioDomainState,
  type Student,
} from '@/lib/package-management'

const SESSIONS_DEMO = [
  { id: 'ses-hoy-1830-vinyasa', name: 'Vinyasa Flow · Hoy 18:30', instructor: 'Carla' },
  { id: 'ses-hoy-2000-restaurativo', name: 'Yoga Restaurativo · Hoy 20:00', instructor: 'Sofía' },
  { id: 'ses-hoy-0800-hatha', name: 'Hatha Yoga · Hoy 08:00', instructor: 'Andrea' },
  { id: 'ses-hoy-1000-suave', name: 'Yoga Suave · Hoy 10:00', instructor: 'Sofía' },
]

export default function LiveRoomPage() {
  const [mounted, setMounted] = useState(false)
  const [domainState, setDomainState] = useState<StudioDomainState>(createDemoState)
  const [selectedSession, setSelectedSession] = useState(SESSIONS_DEMO[0])
  const [roomSession, setRoomSession] = useState<LiveRoomSession>(() =>
    createLiveRoomSession(SESSIONS_DEMO[0].id, SESSIONS_DEMO[0].name, SESSIONS_DEMO[0].instructor)
  )
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null) // studentId

  // Cargar estado desde localStorage para sincronía total con la app
  useEffect(() => {
    setMounted(true)
    const savedDomain = localStorage.getItem('yoga_sdd_state')
    if (savedDomain) {
      try {
        setDomainState(JSON.parse(savedDomain))
      } catch {
        // mantener createDemoState
      }
    }

    const savedRoom = localStorage.getItem(`yoga_room_${selectedSession.id}`)
    if (savedRoom) {
      try {
        setRoomSession(JSON.parse(savedRoom))
      } catch {
        setRoomSession(
          createLiveRoomSession(selectedSession.id, selectedSession.name, selectedSession.instructor)
        )
      }
    } else {
      setRoomSession(
        createLiveRoomSession(selectedSession.id, selectedSession.name, selectedSession.instructor)
      )
    }
  }, [selectedSession])

  // Persistir cambios
  const updateStateAndRoom = (newDomain: StudioDomainState, newRoom: LiveRoomSession) => {
    setDomainState(newDomain)
    setRoomSession(newRoom)
    if (typeof window !== 'undefined') {
      localStorage.setItem('yoga_sdd_state', JSON.stringify(newDomain))
      localStorage.setItem(`yoga_room_${newRoom.sessionId}`, JSON.stringify(newRoom))
    }
  }

  const occupancy = getRoomOccupancy(roomSession)

  // Alumnas disponibles que no han hecho check-in en esta sesión
  const availableStudents = domainState.students.filter(
    (s) => !roomSession.occupiedMats.some((m) => m.studentId === s.id)
  )

  const handleQuickCheckIn = (studentIdToUse?: string) => {
    const targetStudentId = studentIdToUse || selectedStudentId
    if (!targetStudentId) {
      toast.error('Por favor seleccioná una alumna para el check-in.')
      return
    }

    const res = performQuickCheckIn(
      roomSession,
      domainState,
      targetStudentId,
      selectedSession.instructor
    )

    if (!res.ok) {
      if (res.code === 'NO_BALANCE') {
        toast.error(res.error, {
          action: {
            label: 'Asignar Pack',
            onClick: () => setShowAssignModal(targetStudentId),
          },
        })
      } else {
        toast.error(res.error)
      }
      return
    }

    updateStateAndRoom(res.data.domainState, res.data.room)
    toast.success(res.message)
    if (!studentIdToUse) {
      setSelectedStudentId('')
    }
  }

  const handleReleaseMat = (matNumber: number) => {
    const res = releaseMat(
      roomSession,
      domainState,
      matNumber,
      selectedSession.instructor,
      'Liberación manual desde monitor de sala'
    )

    if (!res.ok) {
      toast.error(res.error)
      return
    }

    updateStateAndRoom(res.data.domainState, res.data.room)
    toast.success(res.message)
  }

  const handleAssignNewPackage = (studentId: string) => {
    const res = assignPackage(domainState, studentId, 'Andrea')
    if (!res.ok) {
      toast.error(res.error)
      return
    }

    setDomainState(res.state)
    if (typeof window !== 'undefined') {
      localStorage.setItem('yoga_sdd_state', JSON.stringify(res.state))
    }
    setShowAssignModal(null)
    toast.success('¡Nuevo paquete de 10 clases asignado exitosamente!')
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#314A3A]">
      {/* Barra superior Zen */}
      <header className="border-b border-[#EEE5D8] bg-[#FAF8F3]/80 backdrop-blur sticky top-0 z-30 px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/paquetes"
              className="flex items-center gap-1.5 text-xs font-medium text-[#718B78] hover:text-[#314A3A] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Paquetes
            </Link>
            <span className="text-stone-300">|</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#314A3A]">
                Monitor de Sala en Vivo · Cupo 12 Mats
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Seleccionar sesión de clase"
              value={selectedSession.id}
              onChange={(e) => {
                const found = SESSIONS_DEMO.find((s) => s.id === e.target.value)
                if (found) setSelectedSession(found)
              }}
              className="rounded-2xl border border-[#EEE5D8] bg-white px-3 py-1.5 text-xs font-medium text-[#314A3A] shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#718B78]"
            >
              {SESSIONS_DEMO.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.instructor})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-8 space-y-6">
        {/* Banner de métricas y cupo */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-3xl border border-[#EEE5D8] bg-white p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-500 font-medium">Ocupación</p>
              <p className="text-3xl font-serif font-bold text-[#314A3A] mt-1">
                {occupancy.occupied} <span className="text-lg font-sans text-stone-400 font-normal">/ {ROOM_CAPACITY} mats</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#718B78]/15 flex items-center justify-center text-[#718B78]">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="rounded-3xl border border-[#EEE5D8] bg-white p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-500 font-medium">Mats Libres</p>
              <p className="text-3xl font-serif font-bold text-emerald-700 mt-1">
                {occupancy.free}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          <div className="rounded-3xl border border-[#EEE5D8] bg-white p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-500 font-medium">Estado de Sala</p>
              <div className="mt-1 flex items-center gap-2">
                {occupancy.isFull ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#C77D65]/20 text-[#C77D65]">
                    <XCircle className="w-3.5 h-3.5" /> Cupo Completo
                  </span>
                ) : occupancy.occupied >= 10 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5" /> Últimos {occupancy.free} lugares
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Capacidad Disponible
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#EEE5D8] bg-white p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-500 font-medium">Instructora en Sala</p>
              <p className="text-xl font-serif font-semibold text-[#314A3A] mt-1">{selectedSession.instructor}</p>
              <p className="text-xs text-stone-500">Sesión: {selectedSession.name.split('·')[0].trim()}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#EEE5D8] flex items-center justify-center text-[#314A3A]">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Panel de Check-in Rápido en 1 toque */}
        <section className="rounded-3xl border border-[#EEE5D8] bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#EEE5D8] pb-4">
            <div>
              <h2 className="text-lg font-serif font-bold text-[#314A3A]">Check-in Rápido de Alumnas</h2>
              <p className="text-xs text-stone-500">
                Seleccioná una alumna para registrar su asistencia y asignarle un mat en 1 click.
              </p>
            </div>
            {occupancy.isFull && (
              <span className="text-xs font-medium text-[#C77D65] bg-[#C77D65]/10 px-3 py-1 rounded-full border border-[#C77D65]/20">
                ⛔ Check-in bloqueado: sala al 100% (12/12)
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <select
              aria-label="Seleccionar alumna para check-in"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={occupancy.isFull}
              className="flex-1 rounded-2xl border border-[#EEE5D8] bg-[#FAF8F3] px-4 py-2.5 text-sm font-medium text-[#314A3A] focus:outline-hidden focus:ring-2 focus:ring-[#718B78] disabled:opacity-50"
            >
              <option value="">-- Seleccionar alumna presente en recepción --</option>
              {availableStudents.map((s) => {
                const pkg = domainState.packages.find((p) => p.studentId === s.id && p.status === 'active')
                const avail = pkg?.available ?? 0
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} ({avail > 0 ? `${avail} clases disponibles` : 'Sin clases / Agotado'})
                  </option>
                )
              })}
            </select>

            <button
              type="button"
              onClick={() => handleQuickCheckIn()}
              disabled={!selectedStudentId || occupancy.isFull}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-[#718B78] text-white font-medium text-sm hover:bg-[#314A3A] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar Check-in
            </button>
          </div>
        </section>

        {/* Grilla Visual de los 12 Mats Físicos de la Sala de Andrea */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#314A3A]">
                Distribución de Mats en Sala (12 Mats)
              </h2>
              <p className="text-xs text-stone-500">
                Representación física del salón con estado de saldo y alertas de renovación.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs text-stone-600">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Saldo Óptimo (≥3)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" /> Alerta Renovación (1-2)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#C77D65]" /> Agotado (0)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: ROOM_CAPACITY }, (_, idx) => {
              const matNumber = idx + 1
              const occupant = roomSession.occupiedMats.find((m) => m.matNumber === matNumber)

              if (!occupant) {
                return (
                  <div
                    key={matNumber}
                    className="group relative rounded-3xl border-2 border-dashed border-[#EEE5D8] bg-white/70 p-5 flex flex-col items-center justify-center text-center min-h-[170px] hover:border-[#718B78]/50 hover:bg-white transition"
                  >
                    <span className="absolute top-3 left-4 text-xs font-mono font-bold text-stone-400">
                      Mat #{matNumber}
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-[#EEE5D8]/50 flex items-center justify-center text-stone-400 mb-2">
                      <Sparkles className="w-5 h-5 opacity-40" />
                    </div>
                    <p className="text-sm font-medium text-stone-600">Mat Libre</p>
                    <p className="text-xs text-stone-400 mt-0.5">Listo para check-in</p>
                  </div>
                )
              }

              // Mat Ocupado
              const isWarning = occupant.statusTier === 'warning_low'
              const isExhausted = occupant.statusTier === 'exhausted'

              return (
                <div
                  key={matNumber}
                  className={`relative rounded-3xl border p-5 flex flex-col justify-between min-h-[170px] shadow-xs transition ${
                    isWarning
                      ? 'border-amber-300 bg-amber-50/50'
                      : isExhausted
                      ? 'border-[#C77D65]/40 bg-red-50/40'
                      : 'border-[#718B78]/40 bg-emerald-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-mono font-bold text-[#314A3A] bg-white/90 px-2 py-0.5 rounded-lg border border-[#EEE5D8]">
                      Mat #{matNumber}
                    </span>
                    {isWarning && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Quedan {occupant.remainingClassesAfterCheckIn}
                      </span>
                    )}
                    {isExhausted && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C77D65] bg-red-100 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" /> Agotado
                      </span>
                    )}
                    {!isWarning && !isExhausted && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> {occupant.remainingClassesAfterCheckIn} clases
                      </span>
                    )}
                  </div>

                  <div className="my-2">
                    <p className="font-serif font-bold text-base text-[#314A3A] truncate">
                      {occupant.studentName}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Ingreso: {new Date(occupant.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Acciones del Mat */}
                  <div className="pt-2 border-t border-[#EEE5D8]/80 flex items-center justify-between gap-2">
                    {isWarning ? (
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `Hola ${occupant.studentName.split(' ')[0]}! Te avisamos desde Prana Yoga que tras tu clase de hoy te quedan ${occupant.remainingClassesAfterCheckIn} ${
                            occupant.remainingClassesAfterCheckIn === 1 ? 'clase' : 'clases'
                          } en tu paquete de 10. ¿Querés que te preparemos la renovación? Namasté 🙏`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-amber-900 font-medium hover:underline"
                        title="Enviar recordatorio por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Avisar WhatsApp
                      </a>
                    ) : (
                      <span className="text-[11px] text-stone-500">Asistencia Ok</span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleReleaseMat(matNumber)}
                      className="text-xs text-stone-400 hover:text-[#C77D65] transition font-medium"
                      title="Liberar mat y reintegrar clase"
                    >
                      Liberar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Modal de Asignación Rápida de Paquete si la alumna no tenía saldo */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-[#EEE5D8] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#718B78]/20 flex items-center justify-center text-[#718B78]">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#314A3A]">Asignar Nuevo Paquete</h3>
                  <p className="text-xs text-stone-500">
                    {domainState.students.find((s) => s.id === showAssignModal)?.name}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-[#FAF8F3] p-4 text-xs text-stone-600 space-y-2 border border-[#EEE5D8]">
                <p>
                  Esta alumna no tiene clases disponibles. Al confirmar, se le asignará un nuevo paquete de{' '}
                  <strong className="text-[#314A3A]">10 clases</strong> que iniciará activo con saldo completo.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleAssignNewPackage(showAssignModal)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-[#718B78] text-white hover:bg-[#314A3A] transition shadow-xs"
                >
                  Confirmar Pack de 10 Clases
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
