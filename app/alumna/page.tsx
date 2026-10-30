'use client'

import { Bell, CalendarPlus } from 'lucide-react'
import Link from 'next/link'
import { NotificationList } from '@/components/activity-lists'
import { ClassCard } from '@/components/class-card'
import { PackageCard } from '@/components/package-card'
import { StudentClassAction } from '@/components/student-class-action'
import { EmptyState, PageHeader, SectionTitle } from '@/components/studio-ui'
import { formatDayShort } from '@/lib/format'
import { currentPackage, findStudent, studentBalance, upcomingBookings } from '@/lib/selectors'
import { useStudio } from '@/lib/studio-store'

export default function StudentHome() {
  const { state, actions, currentStudentId } = useStudio()
  const student = findStudent(state, currentStudentId)
  const pkg = currentPackage(state, currentStudentId)
  const balance = studentBalance(state, currentStudentId)
  const upcoming = upcomingBookings(state, currentStudentId)
  const notifications = state.notifications
    .filter((n) => n.studentId === currentStudentId && !n.read)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)

  return (
    <>
      <PageHeader title={`Hola, ${student?.name.split(' ')[0] ?? ''}`} description="Tu práctica, en un solo lugar." />

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <PackageCard pkg={pkg} pending={balance.pending} />
          <Link
            href="/alumna/reservar"
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-earth font-medium text-primary-foreground hover:bg-earth/90"
          >
            <CalendarPlus className="size-5" aria-hidden />
            Reservar una clase
          </Link>
        </div>

        <div className="flex flex-col gap-8 lg:col-span-3">
          {notifications.length > 0 && (
            <section aria-labelledby="notif-title">
              <SectionTitle action={<Link href="/alumna/avisos" className="text-sm text-primary hover:underline">Ver todos</Link>}>
                <span id="notif-title">Avisos nuevos</span>
              </SectionTitle>
              <NotificationList notifications={notifications} onRead={actions.markNotificationRead} />
            </section>
          )}

          <section aria-labelledby="upcoming-title">
            <SectionTitle>
              <span id="upcoming-title">Mis próximas clases</span>
            </SectionTitle>
            {upcoming.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No tenés clases reservadas"
                action={<Link href="/alumna/reservar" className="text-sm font-medium text-primary hover:underline">Ver horarios</Link>}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {upcoming.map(({ booking, cls }) => (
                  <ClassCard
                    key={booking.id}
                    cls={cls}
                    extraBadge={<span className="text-xs text-muted-foreground">{formatDayShort(cls.date)}</span>}
                    footer={<StudentClassAction cls={cls} />}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
