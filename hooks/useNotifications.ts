import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '@/lib/blink'

const db = blink.db as any

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  isRead: number
  eventId?: string
  createdAt: string
}

export function useNotifications(userId: string) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const notifs = await db.notifications.list({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        limit: 50,
      })
      return notifs as Notification[]
    },
    enabled: !!userId,
  })
}

export function useUnreadCount(userId: string) {
  return useQuery({
    queryKey: ['notifications', 'unread', userId],
    queryFn: async () => {
      const count = await db.notifications.count({
        where: { userId, isRead: '0' },
      })
      return count
    },
    enabled: !!userId,
  })
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const notifs = await db.notifications.list({
        where: { userId, isRead: '0' },
      })
      if (notifs.length > 0) {
        await db.notifications.updateMany(
          notifs.map((n: any) => ({ id: n.id, isRead: '1' }))
        )
      }
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread', userId] })
    },
  })
}

export function useCreateNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      userId: string
      title: string
      message: string
      type?: string
      eventId?: string
    }) => {
      return db.notifications.create({
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        isRead: 0,
        eventId: data.eventId,
        createdAt: new Date().toISOString(),
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', variables.userId] })
    },
  })
}
