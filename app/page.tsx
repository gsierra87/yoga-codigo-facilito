'use client'

import { ArrowRight, CalendarCheck, LayoutDashboard, Leaf, PackageCheck, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'
import { fieldClass } from '@/components/studio-ui'
import { studentBalance } from '@/lib/selectors'
import { useStudio } from '@/lib/studio-store'

export default function RolePickerPage() {
  const router = useRouter()
  const { state, currentStudentId, setCurrentStudentId, currentInstructorId, setCurrentInstructorId } = useStudio()
  const students = [...state.students].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image src="/images/studio.png" alt="Sala del estudio con mats de yoga y luz natural" fill priority className="object-cover" sizes="50vw" />
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-foreground/60 to-transparent p-10 text-primary-foreground">
          <p className="max-w-md font-serif text-3xl text-balance">Respirá. Nosotras nos ocupamos de la agenda.</p>
        </div>
      </div>

      <div className="flex flex-col px-5 py-8 sm:px-10 lg:py-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 py-10">
          <div className="flex flex-col gap-2">
            <h1 className="font-serif text-4xl font-medium text-balance">¿Cómo querés ingresar?</h1>
            <p className="text-muted-foreground text-pretty">
              Prototipo del sistema de reservas. Elegí un perfil para recorrer la experiencia de cada rol.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/paquetes')}
              className="flex items-center justify-between gap-3 rounded-3xl border-2 border-primary/50 bg-primary/10 p-4 text-left transition hover:bg-primary/15"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <PackageCheck className="size-5" />
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground">Gestión de Paquetes y Asistencias</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paquetes de 10 clases, asistencias, historial y ajustes
                  </p>
                </div>
              </div>
              <ArrowRight className="size-5 shrink-0 text-primary" aria-hidden />
            </button>

            <RoleOption
              icon={LayoutDashboard}
              title="Administradora"
              description="Andrea · agenda, alumnas, paquetes y reportes"
              onClick={() => router.push('/admin')}
            />

            <div className="rounded-3xl border bg-card p-4">
              <RoleHeader icon={CalendarCheck} title="Instructora" description="Ver clases asignadas y tomar asistencia" />
              <div className="mt-3 flex gap-2">
                <label htmlFor="pick-instructor" className="sr-only">
                  Elegir instructora
                </label>
                <select
                  id="pick-instructor"
                  value={currentInstructorId}
                  onChange={(e) => setCurrentInstructorId(e.target.value)}
                  className={fieldClass}
                >
                  {state.instructors.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
                <EnterButton onClick={() => router.push('/instructora')} label="Ingresar como instructora" />
              </div>
            </div>

            <div className="rounded-3xl border bg-card p-4">
              <RoleHeader icon={Leaf} title="Alumna" description="Reservar clases, ver el paquete y recibir avisos" />
              <div className="mt-3 flex gap-2">
                <label htmlFor="pick-student" className="sr-only">
                  Elegir alumna
                </label>
                <select
                  id="pick-student"
                  value={currentStudentId}
                  onChange={(e) => setCurrentStudentId(e.target.value)}
                  className={fieldClass}
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {studentBalance(state, s.id).remaining} clases
                    </option>
                  ))}
                </select>
                <EnterButton onClick={() => router.push('/alumna')} label="Ingresar como alumna" />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Los datos son de demostración y se reinician al recargar la página.
          </p>
        </div>
      </div>
    </main>
  )
}

function RoleHeader({ icon: Icon, title, description }: { icon: typeof Leaf; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="text-left">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function RoleOption(props: { icon: typeof Leaf; title: string; description: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="flex items-center justify-between gap-3 rounded-3xl border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <RoleHeader {...props} />
      <ArrowRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  )
}

function EnterButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
    >
      <ArrowRight className="size-5" aria-hidden />
      <span className="sr-only">{label}</span>
    </button>
  )
}
