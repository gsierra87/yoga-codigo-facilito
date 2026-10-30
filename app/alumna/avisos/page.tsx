'use client'

import { NotificationList } from '@/components/activity-lists'
import { PageHeader } from '@/components/studio-ui'
import { Button } from '@/components/ui/button'
import { useStudio } from '@/lib/studio-store'

export default function NoticesPage() {
  const { state, actions, currentStudentId } = useStudio()
  const notifications = state.notifications
    .filter((n) => n.studentId === currentStudentId)
    .sort((a, b) => b.date.localeCompare(a.date))
  const unread = notifications.some((n) => !n.read)

  return (
    <>
      <PageHeader
        title="Avisos"
        description="Confirmaciones, cambios de clases y lugares liberados."
        action={
          unread ? (
            <Button variant="outline" className="h-10 rounded-xl px-4" onClick={() => actions.markAllRead(currentStudentId)}>
              Marcar todo como leído
            </Button>
          ) : undefined
        }
      />
      <NotificationList notifications={notifications} onRead={actions.markNotificationRead} />
    </>
  )
}
