'use client'

import { useParams } from 'next/navigation'
import { ClassDetail } from '@/components/class-detail'

export default function InstructorClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  return <ClassDetail classId={id} backHref="/instructora" canManage={false} />
}
