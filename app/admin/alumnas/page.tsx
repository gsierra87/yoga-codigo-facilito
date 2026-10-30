'use client'

import { Search, UserPlus, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/modal'
import { StudentForm } from '@/components/student-form'
import { EmptyState, PageHeader, Pill, fieldClass } from '@/components/studio-ui'
import { Button } from '@/components/ui/button'
import { formatDate, initials } from '@/lib/format'
import { currentPackage, isPackageActive, studentBalance } from '@/lib/selectors'
import { useStudio } from '@/lib/studio-store'
import { cn } from '@/lib/utils'

type Filter = 'all' | 'active' | 'low' | 'none'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Con paquete' },
  { value: 'low', label: 'Por renovar' },
  { value: 'none', label: 'Sin paquete' },
]

export default function StudentsPage() {
  const router = useRouter()
  const { state, actions } = useStudio()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [creating, setCreating] = useState(false)

  const rows = state.students
    .map((s) => {
      const pkg = currentPackage(state, s.id)
      const balance = studentBalance(state, s.id)
      const active = !!pkg && isPackageActive(pkg)
      return { student: s, pkg, balance, active }
    })
    .filter(({ student }) => {
      const q = query.trim().toLowerCase()
      return !q || student.name.toLowerCase().includes(q) || student.email.includes(q) || student.phone.includes(q)
    })
    .filter(({ active, balance }) => {
      if (filter === 'active') return active
      if (filter === 'low') return active && balance.remaining <= 2
      if (filter === 'none') return !active
      return true
    })
    .sort((a, b) => a.student.name.localeCompare(b.student.name))

  return (
    <>
      <PageHeader
        title="Alumnas"
        description={`${state.students.length} alumnas registradas`}
        action={
          <Button className="h-10 rounded-xl px-4" onClick={() => setCreating(true)}>
            <UserPlus data-icon="inline-start" aria-hidden />
            Nueva alumna
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:max-w-xs md:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <label htmlFor="student-search" className="sr-only">
            Buscar alumna
          </label>
          <input
            id="student-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, email o celular"
            className={cn(fieldClass, 'bg-card pl-9')}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-sm',
                filter === f.value ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Users} title="No encontramos alumnas" />
      ) : (
        <ul className="divide-y rounded-3xl border bg-card">
          {rows.map(({ student, pkg, balance, active }) => (
            <li key={student.id}>
              <Link href={`/admin/alumnas/${student.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                  {initials(student.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{student.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {student.phone}
                    {active && pkg ? ` · vence ${formatDate(pkg.expiresAt)}` : ''}
                  </p>
                </div>
                {active ? (
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Pill tone={balance.remaining <= 2 ? 'earth' : 'sage'}>
                      {balance.remaining} {balance.remaining === 1 ? 'clase' : 'clases'}
                    </Pill>
                    {balance.pending > 0 && <span className="text-[11px] text-muted-foreground">{balance.pending} reservadas</span>}
                  </div>
                ) : (
                  <Pill>Sin paquete</Pill>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva alumna" description="Registrá a una alumna para que pueda reservar desde su celular.">
        <StudentForm
          submitLabel="Registrar alumna"
          showPackageOption
          onSubmit={(input, withPackage) => {
            if (state.students.some((s) => s.email === input.email)) {
              toast.error('Ya existe una alumna con ese email.')
              return
            }
            const result = actions.addStudent(input, withPackage)
            if (result.ok) {
              toast.success(result.message)
              setCreating(false)
              if (result.id) router.push(`/admin/alumnas/${result.id}`)
            }
          }}
        />
      </Modal>
    </>
  )
}
