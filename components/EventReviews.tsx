import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SPACING, RADIUS, FONT } from '@/lib/theme'
import { Review, useReviews, useUpdateReviewStatus } from '@/hooks/useReviews'
import { useAuth } from '@/hooks/useAuth'

interface EventReviewsProps {
  eventId: string
  hostId: string
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={styles.starRating}>
      {[1, 2, 3, 4, 5].map(s => (
        <Ionicons 
          key={s} 
          name={rating >= s ? "star" : "star-outline"} 
          size={size} 
          color={rating >= s ? COLORS.accent : COLORS.textTertiary} 
        />
      ))}
    </View>
  )
}

export default function EventReviews({ eventId, hostId }: EventReviewsProps) {
  const { user } = useAuth()
  const { data: reviews = [], isLoading } = useReviews(eventId)
  const updateStatus = useUpdateReviewStatus()
  const isHost = user?.id === hostId

  const handleReport = async (reviewId: string) => {
    try {
      await updateStatus.mutateAsync({ id: reviewId, isReported: 1, eventId })
    } catch (e) {}
  }

  const handleHide = async (reviewId: string) => {
    try {
      await updateStatus.mutateAsync({ id: reviewId, isHidden: 1, eventId })
    } catch (e) {}
  }

  if (isLoading) {
    return <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.xl }} />
  }

  if (reviews.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No reviews yet. Be the first to rate the vybe!</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {reviews.map(review => {
        const tags = review.vibeTags ? review.vibeTags.split(',') : []
        const date = new Date(review.createdAt).toLocaleDateString('en-ZA', {
          month: 'short', day: 'numeric', year: 'numeric'
        })

        return (
          <View key={review.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewerName}>{review.userName}</Text>
                <Text style={styles.date}>{date}</Text>
              </View>
              <StarRating rating={review.rating} />
            </View>

            {review.reviewText ? (
              <Text style={styles.reviewText}>{review.reviewText}</Text>
            ) : null}

            {tags.length > 0 && (
              <View style={styles.tagsRow}>
                {tags.map(t => (
                  <View key={t} style={styles.tag}>
                    <Text style={styles.tagText}>{t.trim()}</Text>
                  </View>
                ))}
              </View>
            )}

            {isHost && (
              <View style={styles.hostActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleHide(review.id)}>
                  <Ionicons name="eye-off-outline" size={16} color={COLORS.textTertiary} />
                  <Text style={styles.actionText}>Hide</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleReport(review.id)}>
                  <Ionicons name="flag-outline" size={16} color={COLORS.denied} />
                  <Text style={[styles.actionText, { color: COLORS.denied }]}>Report</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: SPACING.md },
  starRating: { flexDirection: 'row', gap: 2 },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  reviewerName: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '700' },
  date: { color: COLORS.textTertiary, fontSize: FONT.xs, marginTop: 2 },
  reviewText: { color: COLORS.textSecondary, fontSize: FONT.sm, lineHeight: 20, marginBottom: SPACING.sm },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: COLORS.bgElevated, paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  tagText: { color: COLORS.primary, fontSize: FONT.xs, fontWeight: '600' },
  empty: { paddingVertical: SPACING.xl, alignItems: 'center' },
  emptyText: { color: COLORS.textTertiary, fontSize: FONT.sm, textAlign: 'center' },
  hostActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: SPACING.md, paddingTop: SPACING.md, gap: SPACING.lg },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { color: COLORS.textTertiary, fontSize: FONT.xs, fontWeight: '600' },
})
