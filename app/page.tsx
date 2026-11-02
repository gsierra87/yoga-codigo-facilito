'use client'

import { useState } from 'react'
import {
  ArrowRight,
  CalendarCheck,
  LayoutDashboard,
  Leaf,
  PackageCheck,
  Sparkles,
  Users,
  ShieldCheck,
  CheckCircle2,
  Heart,
  MessageCircle,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
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
    <main className="grid min-h-dvh lg:grid-cols-12 bg-[#FAF8F3] text-[#314A3A]">
      {/* Columna Lateral Visual (Desktop) */}
      <div className="relative hidden lg:col-span-5 lg:flex lg:flex-col justify-between p-12 bg-[#718B78] text-[#FAF8F3] overflow-hidden">
        {/* Patrón orgánico de fondo */}
        <Leaf className="absolute -bottom-16 -right-16 size-80 rotate-12 opacity-15 pointer-events-none" />
        <Leaf className="absolute top-10 -left-10 size-48 -rotate-45 opacity-10 pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 text-xs font-medium tracking-wide backdrop-blur-xs">
            <Sparkles className="size-3.5" />
            <span>Estudio de Barrio · 12 Mats por Clase</span>
          </div>
          <h2 className="font-serif text-4xl xl:text-5xl font-medium tracking-tight leading-tight">
            Respirá.<br />
            Nosotras cuidamos la agenda.
          </h2>
          <p className="text-white/80 text-sm max-w-sm leading-relaxed">
            Un sistema sereno y digital que reemplaza las tarjetas de cartulina por pases transparentes, control estricto de cupos y alertas amables de renovación.
          </p>
        </div>

        {/* Tarjeta testimonio ICP */}
        <div className="relative z-10 rounded-3xl bg-white/10 backdrop-blur-md p-6 border border-white/15 space-y-3">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-full bg-white/20 flex items-center justify-center font-serif font-bold text-lg">
              A
            </div>
            <div>
              <p className="font-medium text-sm">Andrea Molina</p>
              <p className="text-xs text-white/70">Fundadora & Directora de Prana Yoga</p>
            </div>
          </div>
          <p className="text-xs text-white/85 italic leading-relaxed">
            &ldquo;Eliminamos las discusiones en la entrada del salón. Ahora las alumnas conocen su saldo exacto y las clases de 12 personas nunca se sobrepueblan.&rdquo;
          </p>
          <div className="pt-2 flex items-center gap-4 text-[11px] text-white/70 border-t border-white/10">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-3 text-emerald-300" /> 19 Tests SDD
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3 text-emerald-300" /> Cupo 12 Mats
            </span>
          </div>
        </div>
      </div>

      {/* Contenido Principal de Navegación */}
      <div className="lg:col-span-7 flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 max-w-2xl mx-auto w-full">
        <div className="mb-6">
          <Logo />
        </div>

        <div className="space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEE5D8] text-xs font-semibold text-[#314A3A]">
            <Heart className="size-3.5 text-[#C77D65]" />
            <span>Entrega Final · Lanzamiento a Producción</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#314A3A]">
            Portal del Estudio de Yoga
          </h1>
          <p className="text-sm text-stone-600">
            Elegí cómo ingresar para explorar la experiencia diseñada para cada rol del estudio.
          </p>
        </div>

        {/* Accesos Destacados */}
        <div className="space-y-3">
          {/* FEATURE NUEVA SPEC-002: Sala en Vivo */}
          <Link
            href="/admin/sala"
            className="group flex items-center justify-between gap-4 rounded-3xl border-2 border-[#718B78] bg-white p-4.5 shadow-sm hover:shadow-md hover:border-[#314A3A] transition"
          >
            <div className="flex items-center gap-3.5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#718B78] text-white group-hover:scale-105 transition">
                <Sparkles className="size-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#314A3A] text-base">Monitor de Sala en Vivo (12 Mats)</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                    SPEC-002
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Cupo de 12 mats en tiempo real, Check-in en 1 toque y Semáforo Zen de alertas
                </p>
              </div>
            </div>
            <ArrowRight className="size-5 shrink-0 text-[#718B78] group-hover:translate-x-1 transition" />
          </Link>

          {/* FEATURE SPEC-001: Gestión de Paquetes */}
          <Link
            href="/admin/paquetes"
            className="group flex items-center justify-between gap-4 rounded-3xl border border-[#EEE5D8] bg-white p-4.5 shadow-xs hover:border-[#718B78]/60 transition"
          >
            <div className="flex items-center gap-3.5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEE5D8] text-[#314A3A] group-hover:bg-[#718B78]/20 transition">
                <PackageCheck className="size-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#314A3A] text-base">Gestión de Paquetes y Asistencias</span>
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600 uppercase tracking-wide">
                    SPEC-001
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Packs de 10 clases, saldo no negativo, prevención de duplicados y auditoría
                </p>
              </div>
            </div>
            <ArrowRight className="size-5 shrink-0 text-stone-400 group-hover:translate-x-1 transition" />
          </Link>

          {/* Selector de Instructora (Carla / Sofía) */}
          <div className="rounded-3xl border border-[#EEE5D8] bg-white p-4.5 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEE5D8]/80 text-[#314A3A]">
                <CalendarCheck className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-sm text-[#314A3A]">Instructora en Sala (Carla / Sofía)</p>
                <p className="text-xs text-stone-500">Toma de asistencia móvil y visualización de cupo</p>
              </div>
            </div>
            <div className="flex gap-2">
              <select
                aria-label="Seleccionar instructora"
                value={currentInstructorId}
                onChange={(e) => setCurrentInstructorId(e.target.value)}
                className="flex-1 rounded-2xl border border-[#EEE5D8] bg-[#FAF8F3] px-3.5 py-2 text-xs font-medium text-[#314A3A] focus:outline-hidden focus:ring-2 focus:ring-[#718B78]"
              >
                {state.instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => router.push('/admin/sala')}
                className="px-4 py-2 rounded-2xl bg-[#718B78] text-white text-xs font-semibold hover:bg-[#314A3A] transition inline-flex items-center gap-1.5"
              >
                Entrar <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Selector de Alumna (Valentina / Martina) */}
          <div className="rounded-3xl border border-[#EEE5D8] bg-white p-4.5 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEE5D8]/80 text-[#314A3A]">
                <Leaf className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-sm text-[#314A3A]">Alumna (Pase Digital Zen)</p>
                <p className="text-xs text-stone-500">Consulta de saldo en tiempo real, 10 casilleros y reservas</p>
              </div>
            </div>
            <div className="flex gap-2">
              <select
                aria-label="Seleccionar alumna para vista de pase"
                value={currentStudentId}
                onChange={(e) => setCurrentStudentId(e.target.value)}
                className="flex-1 rounded-2xl border border-[#EEE5D8] bg-[#FAF8F3] px-3.5 py-2 text-xs font-medium text-[#314A3A] focus:outline-hidden focus:ring-2 focus:ring-[#718B78]"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {studentBalance(state, s.id).remaining} clases disponibles
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => router.push('/alumna')}
                className="px-4 py-2 rounded-2xl bg-[#718B78] text-white text-xs font-semibold hover:bg-[#314A3A] transition inline-flex items-center gap-1.5"
              >
                Ver Pase <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer con información de despliegue y estado */}
        <div className="mt-8 pt-6 border-t border-[#EEE5D8] flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Listo para Producción</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/paquetes" className="hover:underline">Paquetes</Link>
            <span>·</span>
            <Link href="/admin/sala" className="hover:underline font-semibold text-[#718B78]">Sala 12 Mats</Link>
            <span>·</span>
            <Link href="/alumna" className="hover:underline">Pase Digital</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
