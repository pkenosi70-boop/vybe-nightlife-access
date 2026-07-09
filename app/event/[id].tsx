import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ImageBackground, ActivityIndicator, Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useEvent, useRequestAccess, useUserRequests } from '@/hooks/useEvents'
import { useAuth } from '@/hooks/useAuth'
import { useCreateNotification } from '@/hooks/useNotifications'
import { useAverageRating, useUserReview } from '@/hooks/useReviews'
import { COLORS, SPACING, RADIUS, FONT, getVibeColor } from '@/lib/theme'
import EventReviews from '@/components/EventReviews'
import ReviewModal from '@/components/ReviewModal'

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { data: event, isLoading } = useEvent(id)
  const { data: userRequests = [] } = useUserRequests(user?.id || '')
  const { data: avgRating } = useAverageRating(id)
  const { data: myReview } = useUserReview(id, user?.id || '')

  const requestAccess = useRequestAccess()
  const createNotification = useCreateNotification()
  const [requesting, setRequesting] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)

  const existingRequest = userRequests.find(r => r.eventId === id)
  const isPast = event ? new Date(event.dateTime) < new Date() : false
  const isHost = event?.hostId === user?.id
  const isFull = event ? Number(event.attendeeCount || 0) >= Number(event.capacity || 0) : false
  const canReview = Number(existingRequest?.checkedIn) > 0 && isPast && !myReview

  const handleRequestAccess = async () => {
    if (!user) {
      router.push('/auth')
      return
    }
    if (existingRequest || isHost || isFull || isPast || requesting) return

    setRequesting(true)
    try {
      await requestAccess.mutateAsync({
        eventId: id,
        userId: user.id,
        userName: user.displayName,
        userEmail: user.email,
        userAvatar: user.avatar,
      })
      await createNotification.mutateAsync({
        userId: user.id,
        title: 'Access Requested!',
        message: `Your request for "${event?.title}" has been submitted. The host will review it soon.`,
        type: 'request',
        eventId: id,
      })
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to request access')
    } finally {
      setRequesting(false)
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    )
  }

  if (!event) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.notFound}>Event not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const tags = event.vibeTags ? event.vibeTags.split(',') : []
  const date = new Date(event.dateTime)
  const dateStr = date.toLocaleDateString('en-ZA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })

  const getRequestBtn = () => {
    if (!user) return { label: 'Sign In to Request Access', color: COLORS.primary, disabled: false }
    if (isHost) return { label: 'You are hosting this event', color: COLORS.primary, disabled: true }
    if (isFull) return { label: 'Event at Capacity', color: COLORS.denied, disabled: true }
    if (!existingRequest) return { label: 'Request Access', color: COLORS.primary, disabled: false }
    switch (existingRequest.status) {
      case 'pending': return { label: '⏳ Request Pending', color: COLORS.warning, disabled: true }
      case 'approved': return { label: '✅ Access Granted', color: COLORS.approved, disabled: true }
      case 'denied': return { label: '❌ Access Denied', color: COLORS.denied, disabled: true }
    }
  }

  const btn = getRequestBtn()

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0F', '#0A0A0F']} style={StyleSheet.absoluteFillObject} />

      <ScrollView showsVerticalScrollIndicator={false} bounces>
        {/* Hero */}
        <ImageBackground
          source={{ uri: event.coverImage }}
          style={styles.hero}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.9)', '#0A0A0F']}
            style={StyleSheet.absoluteFillObject}
          />
          <SafeAreaView edges={['top']}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>
          {!Number(event.isPublic) && (
            <View style={styles.privateBadge}>
              <Ionicons name="lock-closed" size={12} color={COLORS.warning} />
              <Text style={styles.privateBadgeText}>Private Event</Text>
            </View>
          )}
        </ImageBackground>

        {/* Content */}
        <View style={styles.content}>
          {/* Tags */}
          <View style={styles.headerRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              <View style={styles.tagRow}>
                {tags.map(t => {
                  const c = getVibeColor(t.trim())
                  return (
                    <View key={t} style={[styles.tag, { backgroundColor: c.bg }]}>
                      <Text style={[styles.tagText, { color: c.text }]}>{t.trim()}</Text>
                    </View>
                  )
                })}
              </View>
            </ScrollView>
            {Number(avgRating) > 0 && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color={COLORS.accent} />
                <Text style={styles.ratingText}>{avgRating}</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{event.title}</Text>

          {/* Info blocks */}
          <View style={styles.infoGrid}>
            <View style={styles.infoBlock}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar" size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{dateStr}</Text>
              </View>
            </View>
            <View style={styles.infoBlock}>
              <View style={styles.infoIcon}>
                <Ionicons name="time" size={18} color={COLORS.accent} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValue}>{timeStr}</Text>
              </View>
            </View>
            <View style={styles.infoBlock}>
              <View style={styles.infoIcon}>
                <Ionicons name="location" size={18} color={COLORS.neonPink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Venue</Text>
                <Text style={styles.infoValue}>{event.location}</Text>
                {event.address && <Text style={styles.infoSub}>{event.address}</Text>}
              </View>
            </View>
            <View style={styles.infoBlock}>
              <View style={styles.infoIcon}>
                <Ionicons name="people" size={18} color={COLORS.neonGreen} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Capacity</Text>
                <Text style={styles.infoValue}>{event.attendeeCount}/{event.capacity}</Text>
              </View>
            </View>
          </View>

          {/* Host */}
          <View style={styles.hostRow}>
            <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.hostAvatar}>
              <Text style={styles.hostAvatarText}>{event.hostName[0]}</Text>
            </LinearGradient>
            <View>
              <Text style={styles.hostLabel}>Hosted by</Text>
              <Text style={styles.hostName}>{event.hostName}</Text>
            </View>
          </View>

          {/* Description */}
          {event.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          )}

          {/* Reviews */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              {canReview && (
                <TouchableOpacity onPress={() => setShowReviewModal(true)}>
                  <Text style={styles.addReviewLink}>Rate Vybe</Text>
                </TouchableOpacity>
              )}
            </View>
            <EventReviews eventId={id} hostId={event.hostId} />
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      {!isPast && (
        <View style={styles.ctaWrap}>
          <TouchableOpacity
            style={[styles.ctaBtn, btn.disabled && styles.ctaBtnDisabled]}
            onPress={btn.disabled ? undefined : handleRequestAccess}
            disabled={btn.disabled || requesting}
            activeOpacity={btn.disabled ? 1 : 0.8}
          >
            {requesting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                {!btn.disabled && (
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
                <Text style={styles.ctaText}>{btn.label}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <ReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        eventId={id}
        userId={user?.id || ''}
        userName={user?.displayName || 'Guest'}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  notFound: { color: COLORS.textPrimary, fontSize: FONT.lg, marginBottom: SPACING.base },
  backLink: { color: COLORS.primary, fontSize: FONT.base },
  hero: { height: 320, justifyContent: 'flex-end' },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    margin: SPACING.base,
  },
  privateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.warning + '50',
    alignSelf: 'flex-start',
    margin: SPACING.base,
  },
  privateBadgeText: { color: COLORS.warning, fontSize: FONT.sm, fontWeight: '700' },
  content: { padding: SPACING.xl, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.base },
  tagRow: { flexDirection: 'row', gap: SPACING.sm },
  tag: { paddingHorizontal: SPACING.md, paddingVertical: 5, borderRadius: RADIUS.full },
  tagText: { fontSize: FONT.sm, fontWeight: '700' },
  ratingBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.accent + '40'
  },
  ratingText: { color: COLORS.accent, fontSize: FONT.sm, fontWeight: '700' },
  title: {
    color: COLORS.textPrimary, fontSize: FONT.xxl, fontWeight: '800',
    marginBottom: SPACING.xl, lineHeight: 36,
  },
  infoGrid: { gap: SPACING.md, marginBottom: SPACING.xl },
  infoBlock: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  infoIcon: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { color: COLORS.textTertiary, fontSize: FONT.xs, marginBottom: 2 },
  infoValue: { color: COLORS.textPrimary, fontSize: FONT.sm, fontWeight: '600' },
  infoSub: { color: COLORS.textTertiary, fontSize: FONT.xs, marginTop: 2 },
  hostRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.border,
  },
  hostAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  hostAvatarText: { color: '#fff', fontWeight: '800', fontSize: FONT.md },
  hostLabel: { color: COLORS.textTertiary, fontSize: FONT.xs },
  hostName: { color: COLORS.textPrimary, fontWeight: '700', fontSize: FONT.base },
  section: { marginBottom: SPACING.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { color: COLORS.textPrimary, fontSize: FONT.md, fontWeight: '700' },
  addReviewLink: { color: COLORS.primary, fontSize: FONT.sm, fontWeight: '600' },
  description: { color: COLORS.textSecondary, fontSize: FONT.base, lineHeight: 24 },
  ctaWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    padding: SPACING.xl,
    paddingBottom: 34,
  },
  ctaBtn: {
    height: 56, borderRadius: RADIUS.xl,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', backgroundColor: COLORS.bgCard,
  },
  ctaBtnDisabled: { backgroundColor: COLORS.bgCard },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: FONT.md, letterSpacing: 0.5 },
})
