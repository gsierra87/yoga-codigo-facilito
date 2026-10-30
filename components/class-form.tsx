'use client'

import { useState, type FormEvent } from 'react'
import { fieldClass } from '@/components/studio-ui'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CLASS_TITLES, ROOMS } from '@/lib/selectors'
import { useStudio } from '@/lib/studio-store'
import type { YogaClass } from '@/lib/types'

type ClassInput = Omit<YogaClass, 'id' | 'status' | 'cancelReason'>

interface ClassFormProps {
  initial: Partial<ClassInput> & { date: string }
  submitLabel: string
  onSubmit: (input: ClassInput) => void
}

export function ClassForm({ initial, submitLabel, onSubmit }: ClassFormProps) {
  const { state } = useStudio()
  const [values, setValues] = useState<ClassInput>({
    title: initial.title ?? CLASS_TITLES[0],
    instructorId: initial.instructorId ?? state.instructors[0].id,
    date: initial.date,
    start: initial.start ?? '09:00',
    duration: initial.duration ?? 60,
    capacity: initial.capacity ?? 12,
    room: initial.room ?? ROOMS[0],
  })

  const set = <K extends keyof ClassInput>(key: K, value: ClassInput[K]) => setValues((v) => ({ ...v, [key]: value }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label htmlFor="cf-title">Tipo de clase</Label>
        <input
          id="cf-title"
          list="cf-titles"
          required
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          className={fieldClass}
        />
        <datalist id="cf-titles">
          {CLASS_TITLES.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label htmlFor="cf-instructor">Instructora</Label>
        <select
          id="cf-instructor"
          value={values.instructorId}
          onChange={(e) => set('instructorId', e.target.value)}
          className={fieldClass}
        >
          {state.instructors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cf-date">Fecha</Label>
        <input id="cf-date" type="date" required value={values.date} onChange={(e) => set('date', e.target.value)} className={fieldClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cf-start">Horario</Label>
        <input id="cf-start" type="time" required value={values.start} onChange={(e) => set('start', e.target.value)} className={fieldClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cf-duration">Duración (min)</Label>
        <input
          id="cf-duration"
          type="number"
          min={30}
          max={180}
          step={15}
          required
          value={values.duration}
          onChange={(e) => set('duration', Number(e.target.value))}
          className={fieldClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cf-capacity">Cupo</Label>
        <input
          id="cf-capacity"
          type="number"
          min={1}
          max={30}
          required
          value={values.capacity}
          onChange={(e) => set('capacity', Number(e.target.value))}
          className={fieldClass}
        />
      </div>
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label htmlFor="cf-room">Sala</Label>
        <select id="cf-room" value={values.room} onChange={(e) => set('room', e.target.value)} className={fieldClass}>
          {ROOMS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
      <Button type="submit" className="col-span-2 h-11 rounded-xl">
        {submitLabel}
      </Button>
    </form>
  )
}
