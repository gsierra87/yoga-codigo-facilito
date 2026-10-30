'use client'

import { useParams } from 'next/navigation'
import { ClassDetail } from '@/components/class-detail'

export default function AdminClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  return <ClassDetail classId={id} backHref="/admin/clases" canManage />
}
