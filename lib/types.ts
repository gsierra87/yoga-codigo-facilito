export type Role = 'admin' | 'instructor' | 'student'

export interface Instructor {
  id: string
  name: string
  short: string
}

export interface Student {
  id: string
  name: string
  email: string
  phone: string
  birthDate?: string
  notes?: string
  joinedAt: string
}

export interface ClassPackage {
  id: string
  studentId: string
  total: number
  used: number
  purchasedAt: string
  expiresAt: string
  price: number
}

export type ClassStatus = 'scheduled' | 'cancelled'

export interface YogaClass {
  id: string
  title: string
  instructorId: string
  date: string
  start: string
  duration: number
  capacity: number
  room: string
  status: ClassStatus
  cancelReason?: string
}

export type BookingStatus = 'booked' | 'attended' | 'absent' | 'cancelled'

export interface Booking {
  id: string
  classId: string
  studentId: string
  status: BookingStatus
  createdAt: string
  cancelledBy?: 'student' | 'studio' | 'class'
  packageId?: string
}

export interface WaitlistEntry {
  id: string
  classId: string
  studentId: string
  createdAt: string
  notifiedAt?: string
}

export type MovementType = 'purchase' | 'consumed' | 'refund'

export interface Movement {
  id: string
  studentId: string
  packageId: string
  type: MovementType
  delta: number
  date: string
  classId?: string
  note: string
  by: string
}

export type NotificationKind =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'class_changed'
  | 'class_cancelled'
  | 'spot_available'
  | 'message'

export interface AppNotification {
  id: string
  studentId: string
  kind: NotificationKind
  title: string
  message: string
  date: string
  read: boolean
  classId?: string
}

export interface StudioState {
  instructors: Instructor[]
  students: Student[]
  packages: ClassPackage[]
  classes: YogaClass[]
  bookings: Booking[]
  waitlist: WaitlistEntry[]
  movements: Movement[]
  notifications: AppNotification[]
}
