import React, { useState } from 'react'
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator, Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SPACING, RADIUS, FONT } from '@/lib/theme'
import { useCreateReview } from '@/hooks/useReviews'
import { LinearGradient } from 'expo-linear-gradient'

const VIBE_TAGS = ['Lit', 'Chill', 'Exclusive', 'Good Music', 'Good Crowd', 'Overcrowded', 'VIP']

interface ReviewModalProps {
  visible: boolean
  onClose: () => void
  eventId: string
  userId: string
  userName: string
}

export default function ReviewModal({ visible, onClose, eventId, userId, userName }: ReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [selectedTags, setSelectedVibes] = useState<string[]>([])
  const createReview = useCreateReview()

  const toggleTag = (tag: string) => {
    setSelectedVibes(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating.')
      return
    }

    try {
      await createReview.mutateAsync({
        eventId,
        userId,
        userName,
        rating,
        reviewText,
        vibeTags: selectedTags.join(','),
      })
      Alert.alert('Success', 'Your review has been submitted!')
      onClose()
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit review')
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Rate the Vybe</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>How was the event?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Ionicons 
                    name={rating >= s ? "star" : "star-outline"} 
                    size={40} 
                    color={rating >= s ? COLORS.accent : COLORS.textTertiary}
                    style={rating >= s ? styles.glowStar : {}}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Add vibe tags (optional)</Text>
            <View style={styles.tagGrid}>
              {VIBE_TAGS.map(tag => (
                <TouchableOpacity 
                  key={tag} 
                  style={[styles.tag, selectedTags.includes(tag) && styles.tagActive]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextActive]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Tell us more</Text>
            <TextInput
              style={styles.input}
              placeholder="What made it special? (or what sucked?)"
              placeholderTextColor={COLORS.textTertiary}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity 
              style={styles.submitBtn} 
              onPress={handleSubmit}
              disabled={createReview.isPending}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtnGrad}
              >
                {createReview.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Review</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  card: { 
    backgroundColor: COLORS.bgCard, 
    borderTopLeftRadius: RADIUS.xl, 
    borderTopRightRadius: RADIUS.xl, 
    padding: SPACING.xl,
    maxHeight: '85%'
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  title: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '800' },
  label: { color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: '600', marginTop: SPACING.lg, marginBottom: SPACING.sm },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.md, marginVertical: SPACING.md },
  glowStar: {
    textShadowColor: COLORS.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  tag: { 
    paddingHorizontal: SPACING.md, 
    paddingVertical: 8, 
    borderRadius: RADIUS.full, 
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  tagActive: { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
  tagText: { color: COLORS.textTertiary, fontSize: FONT.sm, fontWeight: '600' },
  tagTextActive: { color: COLORS.primary },
  input: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONT.base,
    height: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  submitBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', marginTop: SPACING.xl, marginBottom: SPACING.xxl },
  submitBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT.md },
})
