'use client'

import {
  BarChart3,
  Bell,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  History,
  Home,
  LayoutDashboard,
  PackageCheck,
  Repeat,
  Users,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { Logo } from '@/components/logo'
import { findInstructor, findStudent } from '@/lib/selectors'
import { useStudio } from '@/lib/studio-store'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
  badge?: number
}

export function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  const pathname = usePathname()
  const { state, currentStudentId, currentInstructorId } = useStudio()
  const unread = state.notifications.filter((n) => n.studentId === currentStudentId && !n.read).length

  const nav: Record<Role, NavItem[]> = {
    admin: [
      { href: '/admin', label: 'Inicio', icon: LayoutDashboard, exact: true },
      { href: '/admin/paquetes', label: 'Paquetes y Asistencia', icon: PackageCheck },
      { href: '/admin/clases', label: 'Clases', icon: CalendarDays },
      { href: '/admin/alumnas', label: 'Alumnas', icon: Users },
      { href: '/admin/reportes', label: 'Reportes', icon: BarChart3 },
    ],
    instructor: [
      { href: '/instructora', label: 'Mis clases', icon: CalendarCheck },
      { href: '/admin/paquetes', label: 'Tomar Asistencia', icon: PackageCheck },
    ],
    student: [
      { href: '/alumna', label: 'Inicio', icon: Home, exact: true },
      { href: '/alumna/reservar', label: 'Reservar', icon: CalendarPlus },
      { href: '/alumna/historial', label: 'Historial', icon: History },
      { href: '/alumna/avisos', label: 'Avisos', icon: Bell, badge: unread },
    ],
  }
  const items = [...nav[role], { href: '/', label: 'Perfil', icon: Repeat, exact: true }]

  const userName =
    role === 'admin'
      ? 'Andrea Molina'
      : role === 'instructor'
        ? (findInstructor(state, currentInstructorId)?.name ?? '')
        : (findStudent(state, currentStudentId)?.name ?? '')
  const roleLabel = role === 'admin' ? 'Administradora' : role === 'instructor' ? 'Instructora' : 'Alumna'

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-sidebar p-5 md:flex">
        <Logo />
        <nav aria-label="Principal" className="mt-10 flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive(item) && 'bg-sidebar-accent text-sidebar-accent-foreground',
              )}
            >
              <item.icon className="size-4.5" aria-hidden />
              {item.label === 'Perfil' ? 'Cambiar perfil' : item.label}
              {!!item.badge && (
                <span className="ml-auto rounded-full bg-earth px-2 py-0.5 text-xs text-primary-foreground">{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-card p-3">
          <p className="truncate text-sm font-medium">{userName}</p>
          <p className="text-xs text-muted-foreground">{roleLabel}</p>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur md:hidden">
          <Logo />
          <div className="text-right">
            <p className="max-w-40 truncate text-sm font-medium leading-tight">{userName}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 pt-5 pb-28 md:px-8 md:pt-10 md:pb-12">{children}</main>
      </div>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="flex">
          {items.map((item) => (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive(item) ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground',
                  isActive(item) && 'text-primary',
                )}
              >
                <span className={cn('rounded-full px-4 py-1 transition-colors', isActive(item) && 'bg-accent')}>
                  <item.icon className="size-5" aria-hidden />
                </span>
                {item.label}
                {!!item.badge && (
                  <span className="absolute top-1.5 left-1/2 ml-2 flex size-4.5 items-center justify-center rounded-full bg-earth text-[10px] text-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
