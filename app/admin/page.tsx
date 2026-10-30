'use client'

import { AlertCircle, CalendarDays, ListOrdered, Users } from 'lucide-react'
import Link from 'next/link'
import { MovementList } from '@/components/activity-lists'
import { ClassCard } from '@/components/class-card'
import { EmptyState, PageHeader, SectionTitle, StatCard } from '@/components/studio-ui'
import { addDays, formatDayLong, toISODate, todayISO } from '@/lib/format'
import { activeBookings, classesOn, classWaitlist, currentPackage, isPackageActive, studentBalance } from '@/lib/selectors'
import { useStudio } from '@/lib/studio-store'

export default function AdminDashboard() {
  const { state } = useStudio()
  const today = todayISO()
  const weekEnd = toISODate(addDays(new Date(), 7))
  const todayClasses = classesOn(state, today)
  const weekClasses = state.classes.filter((c) => c.status === 'scheduled' && c.date >= today && c.date < weekEnd)
  const weekBooked = weekClasses.reduce((sum, c) => sum + activeBookings(state, c.id).length, 0)
  const weekCapacity = weekClasses.reduce((sum, c) => sum + c.capacity, 0)
  const waiting = weekClasses.reduce((sum, c) => sum + classWaitlist(state, c.id).length, 0)
  const activeStudents = state.students.filter((s) => state.packages.some((p) => p.studentId === s.id && isPackageActive(p)))

  const lowBalance = state.students
    .map((s) => ({ student: s, balance: studentBalance(state, s.id), pkg: currentPackage(state, s.id) }))
    .filter(({ balance, pkg }) => pkg && balance.remaining <= 2)
    .sort((a, b) => a.balance.remaining - b.balance.remaining)
    .slice(0, 6)

  const names = new Map(state.students.map((s) => [s.id, s.name]))
  const recent = [...state.movements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)

  return (
    <>
      <PageHeader eyebrow={formatDayLong(today)} title="Hola, Andrea" description="Así viene el estudio esta semana." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="Clases hoy" value={todayClasses.filter((c) => c.status === 'scheduled').length} />
        <StatCard
          icon={Users}
          label="Ocupación semanal"
          value={`${weekCapacity ? Math.round((weekBooked / weekCapacity) * 100) : 0}%`}
          hint={`${weekBooked} de ${weekCapacity} lugares`}
        />
        <StatCard icon={ListOrdered} label="En lista de espera" value={waiting} tone="earth" hint="próximos 7 días" />
        <StatCard icon={Users} label="Alumnas activas" value={activeStudents.length} tone="sand" hint={`de ${state.students.length} registradas`} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3" aria-labelledby="today-title">
          <SectionTitle action={<Link href="/admin/clases" className="text-sm text-primary hover:underline">Ver agenda</Link>}>
            <span id="today-title">Clases de hoy</span>
          </SectionTitle>
          {todayClasses.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No hay clases hoy" description="Disfrutá el día libre." />
          ) : (
            <div className="flex flex-col gap-3">
              {todayClasses.map((c) => (
                <ClassCard key={c.id} cls={c} href={`/admin/clases/${c.id}`} />
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-2" aria-labelledby="low-title">
          <SectionTitle>
            <span id="low-title">Paquetes por renovar</span>
          </SectionTitle>
          {lowBalance.length === 0 ? (
            <EmptyState icon={AlertCircle} title="Todo en orden" />
          ) : (
            <ul className="divide-y rounded-3xl border bg-card">
              {lowBalance.map(({ student, balance }) => (
                <li key={student.id}>
                  <Link href={`/admin/alumnas/${student.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50">
                    <span className="truncate text-sm font-medium">{student.name}</span>
                    <span className={balance.remaining === 0 ? 'text-sm text-destructive' : 'text-sm text-earth'}>
                      {balance.remaining === 0 ? 'Sin clases' : `Quedan ${balance.remaining}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-8" aria-labelledby="recent-title">
        <SectionTitle>
          <span id="recent-title">Últimos movimientos</span>
        </SectionTitle>
        <MovementList movements={recent} studentNames={names} />
      </section>
    </>
  )
}
