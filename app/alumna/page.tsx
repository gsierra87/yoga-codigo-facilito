'use client'

import { Bell, CalendarPlus, AlertTriangle, MessageCircle, CheckCircle2, XCircle } from 'lucide-react'
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

  const remaining = balance.remaining
  const isLow = remaining > 0 && remaining <= 2
  const isExhausted = remaining === 0

  return (
    <>
      <PageHeader title={`Hola, ${student?.name.split(' ')[0] ?? ''}`} description="Tu práctica, en un solo lugar." />

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <PackageCard pkg={pkg} pending={balance.pending} />

          {/* Semáforo Zen: Alerta preventiva de renovación (SPEC-002 / Valentina) */}
          {isLow && (
            <div className="rounded-3xl border border-amber-300 bg-amber-50/70 p-4.5 text-[#314A3A] space-y-3 shadow-xs">
              <div className="flex items-start gap-3">
                <span className="p-2 rounded-2xl bg-amber-200/70 text-amber-900 shrink-0">
                  <AlertTriangle className="size-4.5" />
                </span>
                <div>
                  <p className="font-semibold text-sm text-amber-900">¡Tu paquete está por completarse!</p>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Te {remaining === 1 ? 'queda' : 'quedan'} <strong>{remaining} {remaining === 1 ? 'clase' : 'clases'}</strong> disponible. Renovalo para asegurar tu mat en las clases de la tarde.
                  </p>
                </div>
              </div>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hola Andrea! Soy ${student?.name}. Vi en mi pase que me quedan ${remaining} ${
                    remaining === 1 ? 'clase' : 'clases'
                  } y me gustaría renovar mi paquete de 10 clases de Prana Yoga. ¡Avisame cómo te transfiero!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-2xl bg-[#718B78] text-white text-xs font-semibold hover:bg-[#314A3A] transition shadow-xs"
              >
                <MessageCircle className="size-4" />
                Renovar paquete por WhatsApp
              </a>
            </div>
          )}

          {isExhausted && (
            <div className="rounded-3xl border border-[#C77D65]/40 bg-[#C77D65]/10 p-4.5 text-[#314A3A] space-y-3 shadow-xs">
              <div className="flex items-start gap-3">
                <span className="p-2 rounded-2xl bg-[#C77D65]/20 text-[#C77D65] shrink-0">
                  <XCircle className="size-4.5" />
                </span>
                <div>
                  <p className="font-semibold text-sm text-[#C77D65]">Paquete agotado</p>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Completaste tus 10 clases. Pedile a Andrea la renovación para seguir practicando.
                  </p>
                </div>
              </div>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hola Andrea! Soy ${student?.name}. Completé mis 10 clases de yoga y quiero adquirir un nuevo paquete de 10. ¡Gracias!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-2xl bg-[#C77D65] text-white text-xs font-semibold hover:bg-[#C77D65]/90 transition shadow-xs"
              >
                <MessageCircle className="size-4" />
                Pedir nuevo paquete de 10
              </a>
            </div>
          )}

          {!isLow && !isExhausted && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-center gap-3 text-xs text-emerald-900 shadow-xs">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
              <span>Tu pase está activo y con saldo al día ({remaining} clases). ¡Nos vemos en el mat!</span>
            </div>
          )}

          <Link
            href="/alumna/reservar"
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#718B78] font-medium text-white hover:bg-[#314A3A] transition shadow-xs"
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
