import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '@/lib/blink'

export interface Event {
  id: string
  hostId: string
  hostName: string
  title: string
  description?: string
  location: string
  address?: string
  dateTime: string
  capacity: number
  isPublic: number
  coverImage?: string
  vibeTags?: string
  attendeeCount: number
  createdAt: string
}

export interface AccessRequest {
  id: string
  eventId: string
  userId: string
  userName?: string
  userEmail?: string
  userAvatar?: string
  status: 'pending' | 'approved' | 'denied'
  qrCode?: string
  checkedIn?: number
  createdAt: string
  updatedAt: string
}

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const events = await blink.db.events.list({
        orderBy: { dateTime: 'asc' },
      })
      return events as Event[]
    },
  })
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: async () => {
      const event = await blink.db.events.get(id)
      return event as Event | null
    },
    enabled: !!id,
  })
}

export function useHostEvents(hostId: string) {
  return useQuery({
    queryKey: ['events', 'host', hostId],
    queryFn: async () => {
      const events = await blink.db.events.list({
        where: { hostId },
        orderBy: { dateTime: 'asc' },
      })
      return events as Event[]
    },
    enabled: !!hostId,
  })
}

export function useAccessRequests(eventId: string) {
  return useQuery({
    queryKey: ['access-requests', eventId],
    queryFn: async () => {
      const requests = await blink.db.accessRequests.list({
        where: { eventId },
        orderBy: { createdAt: 'desc' },
      })
      return requests as AccessRequest[]
    },
    enabled: !!eventId,
  })
}

export function useUserRequests(userId: string) {
  return useQuery({
    queryKey: ['access-requests', 'user', userId],
    queryFn: async () => {
      const requests = await blink.db.accessRequests.list({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
      return requests as AccessRequest[]
    },
    enabled: !!userId,
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Event>) => {
      return blink.db.events.create({
        ...data,
        createdAt: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useRequestAccess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      eventId: string
      userId: string
      userName?: string
      userEmail?: string
      userAvatar?: string
    }) => {
      const qrCode = `VYBE-${data.eventId}-${data.userId}-${Date.now()}`
      return blink.db.accessRequests.create({
        eventId: data.eventId,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        userAvatar: data.userAvatar,
        status: 'pending',
        qrCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['access-requests', 'user', variables.userId] })
    },
  })
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, eventId }: { id: string; status: 'approved' | 'denied'; eventId: string }) => {
      return blink.db.accessRequests.update(id, {
        status,
        updatedAt: new Date().toISOString(),
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['access-requests', variables.eventId] })
    },
  })
}

export function useCheckIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ qrCode, hostId }: { qrCode: string; hostId: string }) => {
      const requests = await blink.db.accessRequests.list({
        where: { qrCode },
        limit: 1,
      })

      if (requests.length === 0) {
        throw new Error('Invalid QR Code')
      }

      const request = requests[0] as AccessRequest

      const event = await blink.db.events.get(request.eventId)
      if (!event || (event as any).hostId !== hostId) {
        throw new Error('This ticket is not for your event')
      }

      if (request.status !== 'approved') {
        throw new Error(`Entry denied. Status: ${request.status}`)
      }

      if (Number(request.checkedIn) > 0) {
        throw new Error('Ticket already used')
      }

      await blink.db.accessRequests.update(request.id, {
        checkedIn: 1,
        updatedAt: new Date().toISOString(),
      })

      await blink.db.events.update(request.eventId, {
        attendeeCount: (event as any).attendeeCount + 1,
      })

      return { request, event }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['access-requests', data.request.eventId] })
      queryClient.invalidateQueries({ queryKey: ['events', data.request.eventId] })
    },
  })
}
