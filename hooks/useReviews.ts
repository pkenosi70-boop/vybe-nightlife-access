import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { blink } from '@/lib/blink'

const db = blink.db as any

export interface Review {
  id: string
  eventId: string
  userId: string
  userName: string
  rating: number
  reviewText: string
  vibeTags: string
  createdAt: string
  isHidden: number
  isReported: number
}

export function useReviews(eventId: string) {
  return useQuery({
    queryKey: ['reviews', eventId],
    queryFn: async () => (await db.reviews.list({ where: { eventId, isHidden: '0' }, orderBy: { createdAt: 'desc' } })) as Review[],
    enabled: Boolean(eventId),
  })
}

export function useUserReview(eventId: string, userId: string) {
  return useQuery({
    queryKey: ['reviews', eventId, userId],
    queryFn: async () => {
      const reviews = await db.reviews.list({ where: { eventId, userId }, limit: 1 })
      return reviews.length > 0 ? (reviews[0] as Review) : null
    },
    enabled: Boolean(eventId && userId),
  })
}

export function useAverageRating(eventId: string) {
  return useQuery({
    queryKey: ['reviews', 'average', eventId],
    queryFn: async () => {
      const reviews = await db.reviews.list({ where: { eventId, isHidden: '0' } })
      if (reviews.length === 0) return 0
      const sum = reviews.reduce((total: number, review: Review) => total + Number(review.rating), 0)
      return (sum / reviews.length).toFixed(1)
    },
    enabled: Boolean(eventId),
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      eventId: string
      userId: string
      userName: string
      rating: number
      reviewText: string
      vibeTags: string
    }) => {
      if (!data.userId) throw new Error('Sign in to leave a review')
      if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) throw new Error('Choose a rating from 1 to 5')

      const [event, access, existing] = await Promise.all([
        db.events.get(data.eventId),
        db.accessRequests.list({ where: { eventId: data.eventId, userId: data.userId, checkedIn: '1' }, limit: 1 }),
        db.reviews.list({ where: { eventId: data.eventId, userId: data.userId }, limit: 1 }),
      ])
      if (!event) throw new Error('Event not found')
      if (new Date(event.dateTime).getTime() > Date.now()) throw new Error('Reviews open after the event')
      if (access.length === 0) throw new Error('Only checked-in guests can review this event')
      if (existing.length > 0) throw new Error('You have already reviewed this event')

      return db.reviews.create({
        ...data,
        userName: data.userName.trim() || 'Guest',
        reviewText: data.reviewText.trim(),
        createdAt: new Date().toISOString(),
        isHidden: 0,
        isReported: 0,
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.eventId] })
      queryClient.invalidateQueries({ queryKey: ['reviews', 'average', variables.eventId] })
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.eventId, variables.userId] })
    },
  })
}

export function useUpdateReviewStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isHidden, isReported, eventId, hostId }: {
      id: string
      isHidden?: number
      isReported?: number
      eventId: string
      hostId: string
    }) => {
      const event = await db.events.get(eventId)
      if (!event || event.hostId !== hostId) throw new Error('Only the event host can moderate reviews')
      const updateData: Record<string, number> = {}
      if (isHidden !== undefined) updateData.isHidden = isHidden
      if (isReported !== undefined) updateData.isReported = isReported
      return db.reviews.update(id, updateData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.eventId] })
      queryClient.invalidateQueries({ queryKey: ['reviews', 'average', variables.eventId] })
    },
  })
}
