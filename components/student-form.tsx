'use client'

import { useState, type FormEvent } from 'react'
import { fieldClass } from '@/components/studio-ui'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Student } from '@/lib/types'

type StudentInput = Omit<Student, 'id' | 'joinedAt'>

interface StudentFormProps {
  initial?: StudentInput
  submitLabel: string
  showPackageOption?: boolean
  onSubmit: (input: StudentInput, withPackage: boolean) => void
}

export function StudentForm({ initial, submitLabel, showPackageOption, onSubmit }: StudentFormProps) {
  const [values, setValues] = useState<StudentInput>(
    initial ?? { name: '', email: '', phone: '', birthDate: '', notes: '' },
  )
  const [withPackage, setWithPackage] = useState(true)
  const set = (key: keyof StudentInput, value: string) => setValues((v) => ({ ...v, [key]: value }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(
      {
        ...values,
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        notes: values.notes?.trim(),
      },
      withPackage,
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label htmlFor="sf-name">Nombre y apellido</Label>
        <input id="sf-name" required minLength={3} autoComplete="name" value={values.name} onChange={(e) => set('name', e.target.value)} className={fieldClass} />
      </div>
      <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="sf-email">Email</Label>
        <input id="sf-email" type="email" required autoComplete="email" value={values.email} onChange={(e) => set('email', e.target.value)} className={fieldClass} />
      </div>
      <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="sf-phone">Celular</Label>
        <input id="sf-phone" type="tel" required autoComplete="tel" value={values.phone} onChange={(e) => set('phone', e.target.value)} className={fieldClass} />
      </div>
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label htmlFor="sf-birth">Fecha de nacimiento</Label>
        <input id="sf-birth" type="date" value={values.birthDate ?? ''} onChange={(e) => set('birthDate', e.target.value)} className={fieldClass} />
      </div>
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label htmlFor="sf-notes">Notas para instructoras</Label>
        <Textarea
          id="sf-notes"
          value={values.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Lesiones, embarazo, preferencias…"
          className="min-h-20 rounded-xl"
        />
      </div>
      {showPackageOption && (
        <label className="col-span-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={withPackage} onChange={(e) => setWithPackage(e.target.checked)} className="size-4 accent-primary" />
          Asignar paquete de 10 clases ahora
        </label>
      )}
      <Button type="submit" className="col-span-2 h-11 rounded-xl">
        {submitLabel}
      </Button>
    </form>
  )
}
