import { todayISO } from './format'
import type { ClassPackage, StudioState, YogaClass } from './types'

export const PACKAGE_SIZE = 10
export const PACKAGE_PRICE = 45000
export const PACKAGE_VALID_DAYS = 60
export const CLASS_TITLES = ['Hatha Yoga', 'Vinyasa Flow', 'Yoga Suave', 'Restaurativo', 'Yin Yoga', 'Yoga Prenatal']
export const ROOMS = ['Sala Sol', 'Sala Luna']

export function classStart(c: YogaClass) {
  return new Date(`${c.date}T${c.start}:00`)
}

export function hasClassStarted(c: YogaClass, now = new Date()) {
  return classStart(c).getTime() <= now.getTime()
}

export function canTakeAttendance(c: YogaClass) {
  return c.status === 'scheduled' && c.date <= todayISO()
}

export function activeBookings(state: StudioState, classId: string) {
  return state.bookings.filter((b) => b.classId === classId && b.status !== 'cancelled')
}

export function spotsLeft(state: StudioState, c: YogaClass) {
  return Math.max(0, c.capacity - activeBookings(state, c.id).length)
}

export function classWaitlist(state: StudioState, classId: string) {
  return state.waitlist
    .filter((w) => w.classId === classId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function packageRemaining(p: ClassPackage) {
  return p.total - p.used
}

export function isPackageActive(p: ClassPackage, today = todayISO()) {
  return packageRemaining(p) > 0 && p.expiresAt.slice(0, 10) >= today
}

export function studentPackages(state: StudioState, studentId: string) {
  return state.packages
    .filter((p) => p.studentId === studentId)
    .sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt))
}

export function currentPackage(state: StudioState, studentId: string) {
  const packages = studentPackages(state, studentId)
  const active = packages.filter((p) => isPackageActive(p)).sort((a, b) => a.purchasedAt.localeCompare(b.purchasedAt))
  return active[0] ?? packages[0]
}

export function studentBalance(state: StudioState, studentId: string) {
  const remaining = studentPackages(state, studentId)
    .filter((p) => isPackageActive(p))
    .reduce((sum, p) => sum + packageRemaining(p), 0)
  const pending = state.bookings.filter((b) => {
    if (b.studentId !== studentId || b.status !== 'booked') return false
    const c = state.classes.find((cl) => cl.id === b.classId)
    return c?.status === 'scheduled'
  }).length
  return { remaining, pending, available: Math.max(0, remaining - pending) }
}

export function upcomingBookings(state: StudioState, studentId: string) {
  return state.bookings
    .filter((b) => b.studentId === studentId && b.status === 'booked')
    .map((b) => ({ booking: b, cls: state.classes.find((c) => c.id === b.classId)! }))
    .filter(({ cls }) => cls && cls.status === 'scheduled' && !hasClassStarted(cls))
    .sort((a, b) => classStart(a.cls).getTime() - classStart(b.cls).getTime())
}

export function classesOn(state: StudioState, date: string) {
  return state.classes.filter((c) => c.date === date).sort((a, b) => a.start.localeCompare(b.start))
}

export function findInstructor(state: StudioState, id: string) {
  return state.instructors.find((i) => i.id === id)
}

export function findStudent(state: StudioState, id: string) {
  return state.students.find((s) => s.id === id)
}
