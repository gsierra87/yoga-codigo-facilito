export function parseISODate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISODate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function todayISO() {
  return toISODate(new Date())
}

export function startOfWeek(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const offset = (result.getDay() + 6) % 7
  result.setDate(result.getDate() - offset)
  return result
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const dayLongFmt = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
const dayShortFmt = new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
const weekdayFmt = new Intl.DateTimeFormat('es-AR', { weekday: 'short' })
const dateFmt = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})
const monthFmt = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })

export const formatDayLong = (iso: string) => capitalize(dayLongFmt.format(parseISODate(iso)))
export const formatDayShort = (iso: string) => capitalize(dayShortFmt.format(parseISODate(iso)).replace('.', ''))
export const formatWeekday = (date: Date) => capitalize(weekdayFmt.format(date).replace('.', ''))
export const formatDate = (iso: string) => dateFmt.format(iso.length === 10 ? parseISODate(iso) : new Date(iso))
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso))
export const formatMonth = (date: Date) => capitalize(monthFmt.format(date))

export function endTime(start: string, duration: number) {
  const [h, m] = start.split(':').map(Number)
  const total = h * 60 + m + duration
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'recién'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 7) return `hace ${days} ${days === 1 ? 'día' : 'días'}`
  return formatDate(iso)
}

export function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
}

const moneyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
export const formatMoney = (value: number) => moneyFmt.format(value)
