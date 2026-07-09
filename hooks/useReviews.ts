import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { blink } from '@/lib/blink'

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
    queryFn: async () => {
      const reviews = await blink.db.reviews.list({
        where: { eventId, isHidden: '0' },
        orderBy: { createdAt: 'desc' },
      })
      return reviews as Review[]
    },
    enabled: !!eventId,
  })
}

export function useUserReview(eventId: string, userId: string) {
  return useQuery({
    queryKey: ['reviews', eventId, userId],
    queryFn: async () => {
      const reviews = await blink.db.reviews.list({
        where: { eventId, userId },
        limit: 1,
      })
      return reviews.length > 0 ? (reviews[0] as Review) : null
    },
    enabled: !!eventId && !!userId,
  })
}

export function useAverageRating(eventId: string) {
  return useQuery({
    queryKey: ['reviews', 'average', eventId],
    queryFn: async () => {
      const reviews = await blink.db.reviews.list({
        where: { eventId, isHidden: '0' },
      })
      if (reviews.length === 0) return 0
      const sum = reviews.reduce((acc, r: any) => acc + Number(r.rating), 0)
      return (sum / reviews.length).toFixed(1)
    },
    enabled: !!eventId,
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
      return blink.db.reviews.create({
        ...data,
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
    mutationFn: async ({ id, isHidden, isReported, eventId }: { id: string; isHidden?: number; isReported?: number; eventId: string }) => {
      const updateData: any = {}
      if (isHidden !== undefined) updateData.isHidden = isHidden
      if (isReported !== undefined) updateData.isReported = isReported
      
      return blink.db.reviews.update(id, updateData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.eventId] })
      queryClient.invalidateQueries({ queryKey: ['reviews', 'average', variables.eventId] })
    },
  })
}
