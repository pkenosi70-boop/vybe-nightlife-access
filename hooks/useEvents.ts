import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { blink } from '@/lib/blink'

const db = blink.db as any

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
  checkedInAt?: string
  checkedInBy?: string
  checkInToken?: string
  createdAt: string
  updatedAt: string
}

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const events = (await db.events.list({ where: { isPublic: '1' }, orderBy: { dateTime: 'asc' } })) as Event[]
      return events.filter(event => Number(event.isPublic) > 0 && new Date(event.dateTime).getTime() > Date.now())
    },
  })
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: async () => (await db.events.get(id)) as Event | null,
    enabled: Boolean(id),
  })
}

export function useHostEvents(hostId: string) {
  return useQuery({
    queryKey: ['events', 'host', hostId],
    queryFn: async () => (await db.events.list({ where: { hostId }, orderBy: { dateTime: 'asc' } })) as Event[],
    enabled: Boolean(hostId),
  })
}

export function useAccessRequests(eventId: string) {
  return useQuery({
    queryKey: ['access-requests', eventId],
    queryFn: async () => (await db.accessRequests.list({ where: { eventId }, orderBy: { createdAt: 'desc' } })) as AccessRequest[],
    enabled: Boolean(eventId),
  })
}

export function useUserRequests(userId: string) {
  return useQuery({
    queryKey: ['access-requests', 'user', userId],
    queryFn: async () => (await db.accessRequests.list({ where: { userId }, orderBy: { createdAt: 'desc' } })) as AccessRequest[],
    enabled: Boolean(userId),
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Event>) => {
      if (!data.hostId || !data.title?.trim() || !data.location?.trim() || !data.dateTime) {
        throw new Error('Host, title, venue and date are required')
      }
      if (new Date(data.dateTime).getTime() <= Date.now()) throw new Error('The event date must be in the future')
      if (!Number.isInteger(Number(data.capacity)) || Number(data.capacity) < 1) throw new Error('Capacity must be a positive whole number')
      return db.events.create({ ...data, title: data.title.trim(), location: data.location.trim(), createdAt: new Date().toISOString() })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      if (variables.hostId) queryClient.invalidateQueries({ queryKey: ['events', 'host', variables.hostId] })
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
      const [event, existing] = await Promise.all([
        db.events.get(data.eventId),
        db.accessRequests.list({ where: { eventId: data.eventId, userId: data.userId }, limit: 1 }),
      ])
      if (!event) throw new Error('This event is no longer available')
      if (existing.length > 0) throw new Error('You already requested access to this event')
      if (new Date(event.dateTime).getTime() <= Date.now()) throw new Error('Access requests are closed for past events')
      if (Number(event.attendeeCount || 0) >= Number(event.capacity || 0)) throw new Error('This event is already at capacity')

      const now = new Date().toISOString()
      return db.accessRequests.create({
        ...data,
        status: 'pending',
        qrCode: `VYBE-${data.eventId}-${data.userId}-${Date.now()}`,
        checkedIn: 0,
        createdAt: now,
        updatedAt: now,
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['access-requests', 'user', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['access-requests', variables.eventId] })
    },
  })
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, eventId, hostId }: {
      id: string
      status: 'approved' | 'denied'
      eventId: string
      hostId: string
    }) => {
      const [event, request] = await Promise.all([db.events.get(eventId), db.accessRequests.get(id)])
      if (!event || event.hostId !== hostId) throw new Error('You are not authorised to manage this event')
      if (!request || request.eventId !== eventId) throw new Error('Access request not found')
      if (request.status !== 'pending') throw new Error('This request has already been processed')
      if (status === 'approved') {
        const approved = await db.accessRequests.list({ where: { eventId, status: 'approved' } })
        if (approved.length >= Number(event.capacity || 0)) throw new Error('This event has reached capacity')
      }
      return db.accessRequests.update(id, { status, updatedAt: new Date().toISOString() })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['access-requests', variables.eventId] })
      queryClient.invalidateQueries({ queryKey: ['access-requests', 'user'] })
    },
  })
}

export function useCheckIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ qrCode, hostId }: { qrCode: string; hostId: string }) => {
      if (!qrCode.startsWith('VYBE-')) throw new Error('Invalid VYBE ticket')
      const requests = await db.accessRequests.list({ where: { qrCode }, limit: 1 })
      if (requests.length === 0) throw new Error('Invalid QR code')

      const request = requests[0] as AccessRequest
      const event = (await db.events.get(request.eventId)) as Event | null
      if (!event) throw new Error('Event not found')
      if (event.hostId !== hostId) throw new Error('This ticket belongs to another host’s event')
      if (request.status !== 'approved') throw new Error(`Entry denied. Ticket status: ${request.status}`)
      if (Number(request.checkedIn) > 0) throw new Error('Ticket already used')
      if (new Date(event.dateTime).getTime() + 24 * 60 * 60 * 1000 < Date.now()) throw new Error('This event ticket has expired')

      const checkInToken = `${hostId}-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const now = new Date().toISOString()
      await db.accessRequests.update(request.id, {
        checkedIn: 1,
        checkedInAt: now,
        checkedInBy: hostId,
        checkInToken,
        updatedAt: now,
      })

      const verified = (await db.accessRequests.get(request.id)) as AccessRequest | null
      if (!verified || verified.checkInToken !== checkInToken) throw new Error('Ticket was processed by another scanner')

      const checkedInRequests = await db.accessRequests.list({ where: { eventId: request.eventId, checkedIn: 1 } })
      const attendeeCount = checkedInRequests.length
      if (attendeeCount > Number(event.capacity || 0)) throw new Error('Event capacity has been reached')
      await db.events.update(request.eventId, { attendeeCount })
      return { request: verified, event: { ...event, attendeeCount } as Event }
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['access-requests', data.request.eventId] })
      queryClient.invalidateQueries({ queryKey: ['access-requests', 'user', data.request.userId] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['events', data.request.eventId] })
    },
  })
}
