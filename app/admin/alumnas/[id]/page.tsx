'use client'

import { ArrowLeft, CalendarClock, Mail, PackagePlus, Pencil, Phone, StickyNote, UserX } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { MovementList } from '@/components/activity-lists'
import { ClassCard } from '@/components/class-card'
import { Modal } from '@/components/modal'
import { PackageCard } from '@/components/package-card'
import { StudentForm } from '@/components/student-form'
import { Card, EmptyState, Pill, SectionTitle, fieldClass } from '@/components/studio-ui'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { formatDate, formatDayShort, formatMoney } from '@/lib/format'
import {
  PACKAGE_PRICE,
  currentPackage,
  findStudent,
  isPackageActive,
  packageRemaining,
  studentBalance,
  studentPackages,
  upcomingBookings,
} from '@/lib/selectors'
import { useStudio } from '@/lib/studio-store'

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { state, actions } = useStudio()
  const [modal, setModal] = useState<'edit' | 'package' | 'adjust' | null>(null)
  const [price, setPrice] = useState(PACKAGE_PRICE)
  const [adjustDelta, setAdjustDelta] = useState<number>(1)
  const [adjustReason, setAdjustReason] = useState('')
  const student = findStudent(state, id)

  if (!student) {
    return <EmptyState icon={UserX} title="Alumna no encontrada" action={<Link href="/admin/alumnas">Volver</Link>} />
  }

  const pkg = currentPackage(state, id)
  const balance = studentBalance(state, id)
  const upcoming = upcomingBookings(state, id)
  const packages = studentPackages(state, id)
  const movements = state.movements.filter((m) => m.studentId === id).sort((a, b) => b.date.localeCompare(a.date))
  const attended = state.bookings.filter((b) => b.studentId === id && b.status === 'attended').length
  const absent = state.bookings.filter((b) => b.studentId === id && b.status === 'absent').length

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/alumnas" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Alumnas
      </Link>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-serif text-3xl font-medium">{student.name}</h1>
                <p className="text-sm text-muted-foreground">Alumna desde {formatDate(student.joinedAt)}</p>
              </div>
              <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setModal('edit')}>
                <Pencil aria-hidden />
                <span className="sr-only">Editar datos</span>
              </Button>
            </div>
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" aria-hidden />
                <a href={`mailto:${student.email}`} className="truncate hover:underline">{student.email}</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" aria-hidden />
                <a href={`tel:${student.phone.replace(/\s|-/g, '')}`} className="hover:underline">{student.phone}</a>
              </li>
              {student.notes && (
                <li className="flex items-start gap-2 rounded-2xl bg-earth-soft p-3 text-earth">
                  <StickyNote className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {student.notes}
                </li>
              )}
            </ul>
            <dl className="grid grid-cols-3 gap-2 border-t pt-4 text-center">
              <div>
                <dt className="text-xs text-muted-foreground">Asistencias</dt>
                <dd className="font-serif text-2xl tabular-nums">{attended}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Ausencias</dt>
                <dd className="font-serif text-2xl tabular-nums">{absent}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Disponibles</dt>
                <dd className="font-serif text-2xl tabular-nums">{balance.available}</dd>
              </div>
            </dl>
          </Card>

          <PackageCard pkg={pkg} pending={balance.pending} />
          <div className="flex flex-col gap-2">
            <Button className="h-11 rounded-xl" onClick={() => setModal('package')}>
              <PackagePlus data-icon="inline-start" aria-hidden />
              Asignar nuevo paquete
            </Button>
            {pkg && (
              <Button variant="outline" className="h-11 rounded-xl" onClick={() => setModal('adjust')}>
                Ajuste administrativo de saldo
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:col-span-3">
          <section aria-labelledby="upcoming-title">
            <SectionTitle>
              <span id="upcoming-title">Próximas reservas</span>
            </SectionTitle>
            {upcoming.length === 0 ? (
              <EmptyState icon={CalendarClock} title="Sin reservas próximas" />
            ) : (
              <div className="flex flex-col gap-3">
                {upcoming.map(({ booking, cls }) => (
                  <ClassCard
                    key={booking.id}
                    cls={cls}
                    href={`/admin/clases/${cls.id}`}
                    extraBadge={<span className="text-xs text-muted-foreground">{formatDayShort(cls.date)}</span>}
                  />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="packages-title">
            <SectionTitle>
              <span id="packages-title">Paquetes</span>
            </SectionTitle>
            <ul className="divide-y rounded-3xl border bg-card">
              {packages.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {p.used}/{p.total} usadas · {formatMoney(p.price)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Comprado {formatDate(p.purchasedAt)} · vence {formatDate(p.expiresAt)}
                    </p>
                  </div>
                  {isPackageActive(p) ? (
                    <Pill tone="sage">{packageRemaining(p)} restantes</Pill>
                  ) : (
                    <Pill>{packageRemaining(p) === 0 ? 'Completado' : 'Vencido'}</Pill>
                  )}
                </li>
              ))}
              {packages.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">Sin paquetes</li>}
            </ul>
          </section>

          <section aria-labelledby="movements-title">
            <SectionTitle>
              <span id="movements-title">Historial de movimientos</span>
            </SectionTitle>
            <MovementList movements={movements} />
          </section>
        </div>
      </div>

      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Editar datos">
        <StudentForm
          initial={{ name: student.name, email: student.email, phone: student.phone, birthDate: student.birthDate, notes: student.notes }}
          submitLabel="Guardar"
          onSubmit={(input) => {
            const result = actions.updateStudent(student.id, input)
            if (result.ok) {
              toast.success(result.message)
              setModal(null)
            }
          }}
        />
      </Modal>

      <Modal
        open={modal === 'package'}
        onClose={() => setModal(null)}
        title="Nuevo paquete de 10 clases"
        description="Válido por 60 días. Las clases restantes del paquete actual se conservan."
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            const result = actions.addPackage(student.id, price)
            if (result.ok) {
              toast.success(result.message)
              setModal(null)
            }
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pkg-price">Importe cobrado (ARS)</Label>
            <input
              id="pkg-price"
              type="number"
              min={0}
              step={500}
              required
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className={fieldClass}
            />
          </div>
          <Button type="submit" className="h-11 rounded-xl">
            Confirmar y asignar
          </Button>
        </form>
      </Modal>

      <Modal
        open={modal === 'adjust'}
        onClose={() => setModal(null)}
        title="Ajuste administrativo de clases"
        description="Corrección de saldo con motivo obligatorio para auditoría. No se permiten saldos negativos ni mayores a 10."
      >
        {pkg && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              const result = actions.adjustPackage(pkg.id, adjustDelta, adjustReason, 'Andrea')
              if (result.ok) {
                toast.success(result.message)
                setModal(null)
                setAdjustReason('')
                setAdjustDelta(1)
              } else {
                toast.error(result.error)
              }
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label>Variación de clases a aplicar</Label>
              <div className="grid grid-cols-4 gap-2">
                {[-2, -1, 1, 2].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setAdjustDelta(d)}
                    className={`rounded-xl py-2 text-sm font-semibold transition ${
                      adjustDelta === d ? 'bg-primary text-primary-foreground' : 'border bg-card hover:bg-muted'
                    }`}
                  >
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Saldo actual: <strong>{packageRemaining(pkg)}</strong> · Estimado con ajuste:{' '}
                <strong>{packageRemaining(pkg) + adjustDelta} clases disponibles</strong>
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="adj-reason">Motivo justificado del ajuste *</Label>
              <textarea
                id="adj-reason"
                required
                rows={3}
                placeholder="Explicación del error o corrección (mínimo 3 caracteres)"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className={fieldClass}
              />
            </div>
            <Button type="submit" className="h-11 rounded-xl">
              Aplicar ajuste de saldo
            </Button>
          </form>
        )}
      </Modal>
    </div>
  )
}
