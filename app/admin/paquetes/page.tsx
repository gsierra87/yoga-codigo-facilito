'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  History,
  RotateCcw,
  Sparkles,
  UserCheck,
  UserPlus,
  CalendarCheck,
  Sliders,
  Leaf,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  createDemoState,
  assignPackage,
  recordAttendance,
  applyAdjustment,
  registerStudent,
  getPackageHistory,
  getStudentHistory,
  type StudioDomainState,
  type Student,
  type Package,
} from '@/lib/package-management'

const SESSIONS_DEMO = [
  { id: 'ses-hoy-1830-vinyasa', name: 'Vinyasa Flow · Hoy 18:30 (Carla)' },
  { id: 'ses-hoy-0800-hatha', name: 'Hatha Yoga · Hoy 08:00 (Andrea)' },
  { id: 'ses-hoy-1000-suave', name: 'Yoga Suave · Hoy 10:00 (Sofía)' },
  { id: 'ses-ayer-1830-vinyasa', name: 'Vinyasa Flow · Ayer 18:30 (Carla)' },
  { id: 'ses-ayer-2000-restaurativo', name: 'Restaurativo · Ayer 20:00 (Sofía)' },
]

const INSTRUCTORS = ['Andrea', 'Carla', 'Sofía']

export default function PaquetesPage() {
  const [state, setState] = useState<StudioDomainState>(createDemoState)
  const [mounted, setMounted] = useState(false)

  const [selectedStudentId, setSelectedStudentId] = useState<string>('stu-1')
  const [selectedSessionId, setSelectedSessionId] = useState<string>(SESSIONS_DEMO[0].id)
  const [customSessionName, setCustomSessionName] = useState('')
  const [instructor, setInstructor] = useState('Andrea')

  // Estado para nuevo registro de alumna
  const [showNewStudentModal, setShowNewStudentModal] = useState(false)
  const [newStudentName, setNewStudentName] = useState('')
  const [newStudentEmail, setNewStudentEmail] = useState('')
  const [newStudentPhone, setNewStudentPhone] = useState('')
  const [newStudentNotes, setNewStudentNotes] = useState('')

  // Estado para ajuste administrativo
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustDelta, setAdjustDelta] = useState<number>(1)
  const [adjustReason, setAdjustReason] = useState('')

  // Cargar estado guardado al montar en el cliente para evitar mismatch de hidratación
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('yoga_sdd_state')
    if (saved) {
      try {
        setState(JSON.parse(saved))
      } catch {
        // mantener createDemoState
      }
    }
  }, [])

  // Persistir en localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('yoga_sdd_state', JSON.stringify(state))
    }
  }, [state, mounted])

  const selectedStudent = state.students.find((s) => s.id === selectedStudentId) ?? state.students[0]
  const currentPackage = state.packages
    .filter((p) => p.studentId === selectedStudent?.id)
    .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt))[0]

  const studentHistory = selectedStudent ? getStudentHistory(state, selectedStudent.id) : []

  // Reiniciar a datos de demostración
  const handleResetDemo = () => {
    const fresh = createDemoState()
    setState(fresh)
    setSelectedStudentId('stu-1')
    toast.success('Datos de prueba reestablecidos')
  }

  // CA-01: Asignación de paquete
  const handleAssignPackage = () => {
    if (!selectedStudent) return
    const res = assignPackage(state, selectedStudent.id, instructor)
    if (res.ok) {
      setState(res.state)
      toast.success(res.message)
    } else {
      toast.error(res.error)
    }
  }

  // CA-02 / CA-03 / CA-04: Registro de asistencia
  const handleRecordAttendance = () => {
    if (!selectedStudent) return
    const preset = SESSIONS_DEMO.find((s) => s.id === selectedSessionId)
    const sessionName = customSessionName.trim() || (preset ? preset.name : 'Clase de Yoga')

    const res = recordAttendance(state, {
      studentId: selectedStudent.id,
      sessionId: selectedSessionId,
      sessionName,
      performedBy: instructor,
    })

    if (res.ok) {
      setState(res.state)
      toast.success(res.message)
    } else {
      toast.error(res.error)
    }
  }

  // CA-05: Ajuste administrativo
  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPackage) {
      toast.error('La alumna no tiene un paquete activo para ajustar.')
      return
    }

    const res = applyAdjustment(state, {
      packageId: currentPackage.id,
      delta: adjustDelta,
      reason: adjustReason,
      performedBy: 'Andrea',
    })

    if (res.ok) {
      setState(res.state)
      toast.success(res.message)
      setShowAdjustModal(false)
      setAdjustReason('')
      setAdjustDelta(1)
    } else {
      toast.error(res.error)
    }
  }

  // Alta de alumna
  const handleRegisterStudent = (e: React.FormEvent) => {
    e.preventDefault()
    const res = registerStudent(state, {
      name: newStudentName,
      email: newStudentEmail,
      phone: newStudentPhone,
      notes: newStudentNotes,
    })

    if (res.ok) {
      setState(res.state)
      toast.success(res.message)
      setSelectedStudentId(res.data.id)
      setShowNewStudentModal(false)
      setNewStudentName('')
      setNewStudentEmail('')
      setNewStudentPhone('')
      setNewStudentNotes('')
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      {/* Encabezado con estética zen de yoga-marca */}
      <header className="flex flex-col gap-4 rounded-3xl border border-[#EEE5D8] bg-[#FAF8F3] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-medium text-[#314A3A]">
            Gestión de Paquetes y Asistencias
          </h1>
          <p className="mt-1 text-sm text-[#314A3A]/70">
            Reemplazo de fichas de papel por tarjetas digitales de 10 clases con trazabilidad completa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDemo}
            className="inline-flex items-center gap-2 rounded-xl border border-[#EEE5D8] bg-white px-3.5 py-2 text-xs font-medium text-[#314A3A] shadow-xs transition hover:bg-[#EEE5D8]/50"
            title="Recargar los datos de prueba"
          >
            <RotateCcw className="size-3.5 text-[#718B78]" />
            Reestablecer datos de prueba
          </button>
        </div>
      </header>

      {/* Selector de rol/instructor que opera */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#EEE5D8]/40 px-4 py-3 text-xs text-[#314A3A]">
        <span className="font-medium">Responsable en sala (quien registra asistencias):</span>
        <div className="flex gap-2">
          {INSTRUCTORS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setInstructor(name)}
              className={`rounded-full px-3 py-1 font-medium transition ${
                instructor === name
                  ? 'bg-[#314A3A] text-white shadow-xs'
                  : 'bg-white text-[#314A3A] hover:bg-[#EEE5D8]'
              }`}
            >
              {name === 'Andrea' ? 'Andrea (Admin)' : `${name} (Instructora)`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Columna Izquierda: Alumnas y Tarjeta de Paquete (5 cols) */}
        <section className="space-y-6 lg:col-span-5" aria-label="Alumnas y paquete">
          {/* Card Selector de Alumnas */}
          <div className="rounded-3xl border border-[#EEE5D8] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-medium text-[#314A3A]">Alumnas</h2>
              <button
                onClick={() => setShowNewStudentModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#718B78] hover:underline"
              >
                <UserPlus className="size-3.5" />
                Nueva alumna
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {state.students.map((student) => {
                const pkg = state.packages
                  .filter((p) => p.studentId === student.id)
                  .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt))[0]

                const isSelected = student.id === selectedStudent?.id

                return (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`flex items-center justify-between rounded-2xl p-3 text-left transition ${
                      isSelected
                        ? 'border border-[#718B78] bg-[#718B78]/10 text-[#314A3A]'
                        : 'border border-transparent bg-[#FAF8F3] hover:border-[#EEE5D8]'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm text-[#314A3A]">{student.name}</p>
                      <p className="text-xs text-[#314A3A]/60">{student.phone}</p>
                    </div>

                    <div className="text-right">
                      {pkg ? (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            pkg.available === 0
                              ? 'bg-[#C77D65]/20 text-[#C77D65]'
                              : pkg.available <= 2
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-[#718B78]/20 text-[#314A3A]'
                          }`}
                        >
                          {pkg.available === 0 ? 'Agotado' : `${pkg.available} disp.`}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400">Sin paquete</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tarjeta Digital de Paquete (yoga-marca) */}
          {selectedStudent && (
            <div className="space-y-4">
              <h2 className="font-serif text-lg font-medium text-[#314A3A]">
                Tarjeta Digital — {selectedStudent.name}
              </h2>

              {currentPackage ? (
                <div className="relative overflow-hidden rounded-3xl bg-[#718B78] p-6 text-[#FAF8F3] shadow-md">
                  <Leaf className="pointer-events-none absolute -right-6 -top-6 size-36 rotate-12 opacity-10" />

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-xs uppercase tracking-wider opacity-80">
                        {currentPackage.status === 'exhausted' ? 'Paquete Agotado' : 'Paquete Activo'}
                      </span>
                      <h3 className="font-serif text-2xl font-medium">
                        Paquete de {currentPackage.total} clases
                      </h3>
                    </div>
                    <span
                      className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                        currentPackage.status === 'exhausted'
                          ? 'bg-[#C77D65] text-white shadow-xs'
                          : 'bg-[#FAF8F3]/25 text-white shadow-xs'
                      }`}
                    >
                      {currentPackage.status === 'exhausted' ? '0 restantes' : `${currentPackage.available} disponibles`}
                    </span>
                  </div>

                  {/* Grilla visual de 10 casilleros */}
                  <div className="mt-6">
                    <p className="text-xs font-medium opacity-80">Sellos de clases consumidas</p>
                    <ol className="mt-2 grid grid-cols-5 gap-2.5" aria-label={`${currentPackage.used} clases usadas de ${currentPackage.total}`}>
                      {Array.from({ length: currentPackage.total }, (_, i) => {
                        const isUsed = i < currentPackage.used
                        return (
                          <li
                            key={i}
                            className={`flex aspect-square items-center justify-center rounded-2xl border text-xs font-bold transition ${
                              isUsed
                                ? 'border-transparent bg-[#FAF8F3] text-[#718B78] shadow-xs'
                                : 'border-[#FAF8F3]/40 bg-[#FAF8F3]/5 text-[#FAF8F3]/80'
                            }`}
                          >
                            {isUsed ? <Leaf className="size-4" /> : i + 1}
                          </li>
                        )
                      })}
                    </ol>
                  </div>

                  {/* Resumen numérico */}
                  <dl className="mt-6 grid grid-cols-3 gap-2 border-t border-[#FAF8F3]/20 pt-4 text-center">
                    <div>
                      <dt className="text-xs opacity-80">Total</dt>
                      <dd className="font-serif text-2xl font-medium">{currentPackage.total}</dd>
                    </div>
                    <div>
                      <dt className="text-xs opacity-80">Usadas</dt>
                      <dd className="font-serif text-2xl font-medium">{currentPackage.used}</dd>
                    </div>
                    <div>
                      <dt className="text-xs opacity-80">Disponibles</dt>
                      <dd className="font-serif text-2xl font-medium">{currentPackage.available}</dd>
                    </div>
                  </dl>

                  {/* Acciones sobre el paquete */}
                  <div className="mt-6 flex flex-wrap gap-2">
                    <button
                      onClick={handleAssignPackage}
                      className="flex-1 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#314A3A] transition hover:bg-[#FAF8F3]"
                    >
                      + Asignar nuevo paquete (10)
                    </button>
                    <button
                      onClick={() => setShowAdjustModal(true)}
                      className="rounded-xl border border-[#FAF8F3]/40 bg-transparent px-3 py-2 text-xs font-medium text-white transition hover:bg-[#FAF8F3]/10"
                    >
                      Ajuste admin
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-[#EEE5D8] bg-white p-8 text-center text-[#314A3A]">
                  <Layers className="mx-auto size-10 text-[#718B78]/60" />
                  <h3 className="mt-2 font-serif text-lg font-medium">Sin paquete activo</h3>
                  <p className="mt-1 text-xs text-[#314A3A]/70">
                    {selectedStudent.name} todavía no tiene clases asignadas.
                  </p>
                  <button
                    onClick={handleAssignPackage}
                    className="mt-4 rounded-xl bg-[#718B78] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#314A3A]"
                  >
                    Asignar paquete de 10 clases
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Columna Derecha: Registro de Asistencia e Historial (7 cols) */}
        <section className="space-y-6 lg:col-span-7" aria-label="Operaciones e historial">
          {/* Card Registro de Asistencia */}
          <div className="rounded-3xl border border-[#EEE5D8] bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <CalendarCheck className="size-5 text-[#718B78]" />
              <h2 className="font-serif text-xl font-medium text-[#314A3A]">
                Registrar Asistencia a Clase
              </h2>
            </div>
            <p className="mt-1 text-xs text-[#314A3A]/70">
              Descuenta 1 clase del paquete activo y asocia la asistencia a la sesión indicada.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#314A3A]">Alumna seleccionada</label>
                <div className="mt-1 rounded-xl bg-[#FAF8F3] p-3 text-sm font-medium text-[#314A3A]">
                  {selectedStudent ? selectedStudent.name : 'Seleccioná una alumna'}
                  {currentPackage && (
                    <span className="ml-2 text-xs font-normal text-[#314A3A]/70">
                      ({currentPackage.available} clases disponibles)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="session-select" className="text-xs font-semibold text-[#314A3A]">
                  Sesión / Clase
                </label>
                <select
                  id="session-select"
                  value={selectedSessionId}
                  onChange={(e) => {
                    setSelectedSessionId(e.target.value)
                    setCustomSessionName('')
                  }}
                  className="mt-1 w-full rounded-xl border border-[#EEE5D8] bg-white p-3 text-sm text-[#314A3A] focus:border-[#718B78] focus:outline-hidden"
                >
                  {SESSIONS_DEMO.map((ses) => (
                    <option key={ses.id} value={ses.id}>
                      {ses.name}
                    </option>
                  ))}
                  <option value="custom">-- Otra sesión (personalizada) --</option>
                </select>
              </div>

              {selectedSessionId === 'custom' && (
                <div>
                  <label htmlFor="custom-session" className="text-xs font-semibold text-[#314A3A]">
                    Nombre y horario de la sesión
                  </label>
                  <input
                    id="custom-session"
                    type="text"
                    placeholder="Ej: Clase especial de Meditación 19:00"
                    value={customSessionName}
                    onChange={(e) => setCustomSessionName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#EEE5D8] bg-white p-3 text-sm text-[#314A3A] focus:border-[#718B78] focus:outline-hidden"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleRecordAttendance}
                disabled={!selectedStudent}
                className="w-full rounded-xl bg-[#718B78] py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-[#314A3A] disabled:opacity-50"
              >
                Confirmar Asistencia (-1 clase)
              </button>
            </div>
          </div>

          {/* Historial de Movimientos de la Alumna */}
          <div className="rounded-3xl border border-[#EEE5D8] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="size-5 text-[#718B78]" />
                <h2 className="font-serif text-xl font-medium text-[#314A3A]">
                  Historial de Movimientos
                </h2>
              </div>
              <span className="text-xs text-[#314A3A]/60">
                {studentHistory.length} movimientos
              </span>
            </div>

            {studentHistory.length === 0 ? (
              <p className="mt-4 text-center text-xs text-[#314A3A]/60">Sin movimientos registrados.</p>
            ) : (
              <ul className="mt-4 divide-y divide-[#EEE5D8]">
                {studentHistory.map((mov) => (
                  <li key={mov.id} className="flex items-center justify-between py-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          mov.type === 'pack_assignment'
                            ? 'bg-[#718B78]/20 text-[#718B78]'
                            : mov.type === 'attendance'
                            ? 'bg-[#EEE5D8] text-[#314A3A]'
                            : 'bg-[#C77D65]/20 text-[#C77D65]'
                        }`}
                      >
                        {mov.type === 'pack_assignment' ? 'A' : mov.type === 'attendance' ? 'C' : 'J'}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[#314A3A]">{mov.reason}</p>
                        <p className="text-xs text-[#314A3A]/60">
                          {new Date(mov.timestamp).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          · Por {mov.performedBy}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`font-serif text-lg font-semibold tabular-nums ${
                        mov.delta > 0 ? 'text-[#718B78]' : 'text-[#314A3A]/70'
                      }`}
                    >
                      {mov.delta > 0 ? `+${mov.delta}` : mov.delta}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Modal: Ajuste Administrativo (CA-05) */}
      {showAdjustModal && currentPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-[#EEE5D8] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-medium text-[#314A3A]">Ajuste Administrativo</h3>
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-xs text-[#314A3A]/70">
              Permite corregir el saldo ante equivocaciones humanas. Saldo actual:{' '}
              <strong>{currentPackage.available} clases</strong>. Límite: 0 a 10 clases.
            </p>

            <form onSubmit={handleApplyAdjustment} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#314A3A]">Variación de clases (Delta)</label>
                <div className="mt-1 grid grid-cols-4 gap-2">
                  {[-2, -1, 1, 2].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setAdjustDelta(d)}
                      className={`rounded-xl py-2 text-sm font-semibold transition ${
                        adjustDelta === d
                          ? 'bg-[#718B78] text-white shadow-xs'
                          : 'border border-[#EEE5D8] bg-[#FAF8F3] text-[#314A3A] hover:bg-[#EEE5D8]'
                      }`}
                    >
                      {d > 0 ? `+${d}` : d}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-[#314A3A]/60">
                  Saldo resultante estimado:{' '}
                  <strong>{currentPackage.available + adjustDelta} disponibles</strong>
                </p>
              </div>

              <div>
                <label htmlFor="adjust-reason" className="text-xs font-semibold text-[#314A3A]">
                  Motivo obligatorio de la corrección
                </label>
                <textarea
                  id="adjust-reason"
                  rows={3}
                  required
                  placeholder="Ej: Se descontó por error en la clase de ayer pero no asistió"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EEE5D8] p-3 text-sm text-[#314A3A] focus:border-[#718B78] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-[#314A3A] hover:bg-[#FAF8F3]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#718B78] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#314A3A]"
                >
                  Aplicar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Nueva Alumna */}
      {showNewStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-[#EEE5D8] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-medium text-[#314A3A]">Nueva Alumna</h3>
              <button
                type="button"
                onClick={() => setShowNewStudentModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterStudent} className="mt-5 space-y-4">
              <div>
                <label htmlFor="stu-name" className="text-xs font-semibold text-[#314A3A]">
                  Nombre y Apellido *
                </label>
                <input
                  id="stu-name"
                  type="text"
                  required
                  placeholder="Ej: Laura Paz"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EEE5D8] p-2.5 text-sm text-[#314A3A] focus:border-[#718B78] focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="stu-email" className="text-xs font-semibold text-[#314A3A]">
                  Correo Electrónico
                </label>
                <input
                  id="stu-email"
                  type="email"
                  placeholder="laura@mail.com"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EEE5D8] p-2.5 text-sm text-[#314A3A] focus:border-[#718B78] focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="stu-phone" className="text-xs font-semibold text-[#314A3A]">
                  Teléfono / WhatsApp
                </label>
                <input
                  id="stu-phone"
                  type="tel"
                  placeholder="+54 9 11 5544-3322"
                  value={newStudentPhone}
                  onChange={(e) => setNewStudentPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EEE5D8] p-2.5 text-sm text-[#314A3A] focus:border-[#718B78] focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="stu-notes" className="text-xs font-semibold text-[#314A3A]">
                  Notas / Observaciones
                </label>
                <input
                  id="stu-notes"
                  type="text"
                  placeholder="Ej: Principiante, lesión lumbar leve"
                  value={newStudentNotes}
                  onChange={(e) => setNewStudentNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EEE5D8] p-2.5 text-sm text-[#314A3A] focus:border-[#718B78] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewStudentModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-[#314A3A] hover:bg-[#FAF8F3]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#718B78] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#314A3A]"
                >
                  Guardar Alumna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
