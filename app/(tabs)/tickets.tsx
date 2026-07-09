import React, { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, RefreshControl,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/hooks/useAuth'
import { useUserRequests, AccessRequest, useEvent } from '@/hooks/useEvents'
import { COLORS, SPACING, RADIUS, FONT } from '@/lib/theme'
import QRCode from './QRCode'

function QRTicketModal({ request, onClose }: { request: AccessRequest; onClose: () => void }) {
  const { data: event } = useEvent(request.eventId)

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <LinearGradient
            colors={[COLORS.primary + '30', COLORS.accent + '20']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Ticket</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.ticketContent}>
            {/* Status */}
            <View style={styles.approvedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.approved} />
              <Text style={styles.approvedText}>ACCESS GRANTED</Text>
            </View>

            {/* Event info */}
            <Text style={styles.ticketEventTitle}>{event?.title || 'Event'}</Text>
            <Text style={styles.ticketVenue}>{event?.location}</Text>
            {event && (
              <Text style={styles.ticketDate}>
                {new Date(event.dateTime).toLocaleDateString('en-ZA', {
                  weekday: 'long', month: 'long', day: 'numeric',
                })} · {new Date(event.dateTime).toLocaleTimeString('en-ZA', {
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            )}

            {/* QR Code */}
            <View style={styles.qrWrap}>
              <View style={styles.qrContainer}>
                <QRCode value={request.qrCode || request.id} size={180} />
              </View>
              <Text style={styles.qrHint}>Show this at the door</Text>
              <Text style={styles.qrCode}>{request.qrCode?.slice(0, 24)}...</Text>
            </View>

            {/* Dots decoration */}
            <View style={styles.ticketDots}>
              {Array.from({ length: 8 }).map((_, i) => (
                <View key={i} style={styles.dot} />
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

function TicketCard({ request }: { request: AccessRequest }) {
  const { data: event } = useEvent(request.eventId)
  const [showQR, setShowQR] = useState(false)

  const statusConfig = {
    pending: { color: COLORS.warning, bg: COLORS.warning + '15', icon: 'time-outline', label: 'Pending Review' },
    approved: { color: COLORS.approved, bg: COLORS.approved + '15', icon: 'checkmark-circle', label: 'Access Granted' },
    denied: { color: COLORS.denied, bg: COLORS.denied + '15', icon: 'close-circle', label: 'Not Approved' },
  }[request.status]

  return (
    <>
      <TouchableOpacity
        style={styles.ticketCard}
        onPress={() => request.status === 'approved' ? setShowQR(true) : null}
        activeOpacity={request.status === 'approved' ? 0.8 : 1}
      >
        {/* Left accent */}
        <View style={[styles.ticketAccent, { backgroundColor: statusConfig.color }]} />

        <View style={styles.ticketBody}>
          <View style={styles.ticketTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ticketTitle} numberOfLines={1}>
                {event?.title || 'Loading...'}
              </Text>
              {event && (
                <>
                  <View style={styles.ticketMeta}>
                    <Ionicons name="location-outline" size={12} color={COLORS.textTertiary} />
                    <Text style={styles.ticketMetaText}>{event.location}</Text>
                  </View>
                  <View style={styles.ticketMeta}>
                    <Ionicons name="calendar-outline" size={12} color={COLORS.textTertiary} />
                    <Text style={styles.ticketMetaText}>
                      {new Date(event.dateTime).toLocaleDateString('en-ZA', {
                        month: 'short', day: 'numeric',
                      })} · {new Date(event.dateTime).toLocaleTimeString('en-ZA', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Status */}
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {request.status === 'approved' && (
            <View style={styles.viewTicketRow}>
              <Ionicons name="qr-code" size={14} color={COLORS.primary} />
              <Text style={styles.viewTicketText}>Tap to view QR ticket</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {showQR && (
        <QRTicketModal request={request} onClose={() => setShowQR(false)} />
      )}
    </>
  )
}

export default function TicketsScreen() {
  const { user } = useAuth()
  const { data: requests = [], isLoading, refetch } = useUserRequests(user?.id || '')

  if (!user) {
    return (
      <View style={[styles.container, styles.center]}>
        <LinearGradient colors={['#0A0A0F', '#0A0A0F']} style={StyleSheet.absoluteFillObject} />
        <Text style={styles.lockIcon}>🎫</Text>
        <Text style={styles.lockTitle}>Your Tickets</Text>
        <Text style={styles.lockSub}>Sign in to view your event access</Text>
        <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/auth')}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.accent]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.signInBtnGrad}
          >
            <Text style={styles.signInBtnText}>Sign In</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D0B16', '#0A0A0F']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>My Tickets</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{requests.length}</Text>
          </View>
        </View>

        <FlatList
          data={requests}
          keyExtractor={r => r.id}
          renderItem={({ item }) => <TicketCard request={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎪</Text>
              <Text style={styles.emptyTitle}>No tickets yet</Text>
              <Text style={styles.emptySub}>Request access to events to get your tickets</Text>
              <TouchableOpacity
                style={styles.discoverBtn}
                onPress={() => router.push('/(tabs)')}
              >
                <Text style={styles.discoverText}>Discover Events</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.base,
  },
  screenTitle: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '800' },
  countBadge: {
    backgroundColor: COLORS.primary + '30', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  countText: { color: COLORS.primary, fontWeight: '700', fontSize: FONT.sm },
  listContent: { padding: SPACING.xl, paddingBottom: 100 },
  ticketCard: {
    flexDirection: 'row', backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  ticketAccent: { width: 4 },
  ticketBody: { flex: 1, padding: SPACING.base },
  ticketTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  ticketTitle: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '700', marginBottom: 4 },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ticketMetaText: { color: COLORS.textTertiary, fontSize: FONT.xs },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 5,
    borderRadius: RADIUS.md,
  },
  statusText: { fontSize: FONT.xs, fontWeight: '700' },
  viewTicketRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: SPACING.sm, paddingTop: SPACING.sm,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  viewTicketText: { color: COLORS.primary, fontSize: FONT.sm, fontWeight: '600' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden', paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.xl,
  },
  modalTitle: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '700' },
  ticketContent: { alignItems: 'center', paddingHorizontal: SPACING.xl },
  approvedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.approved + '20', paddingHorizontal: SPACING.md, paddingVertical: 8,
    borderRadius: RADIUS.full, marginBottom: SPACING.base,
  },
  approvedText: { color: COLORS.approved, fontWeight: '800', fontSize: FONT.sm, letterSpacing: 1 },
  ticketEventTitle: {
    color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '800',
    textAlign: 'center', marginBottom: SPACING.xs,
  },
  ticketVenue: { color: COLORS.textSecondary, fontSize: FONT.base, textAlign: 'center' },
  ticketDate: { color: COLORS.textTertiary, fontSize: FONT.sm, textAlign: 'center', marginBottom: SPACING.xl },
  qrWrap: { alignItems: 'center', marginBottom: SPACING.xl },
  qrContainer: {
    backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20, shadowOpacity: 0.3,
  },
  qrHint: { color: COLORS.textTertiary, fontSize: FONT.sm, marginTop: SPACING.base },
  qrCode: { color: COLORS.textMuted, fontSize: FONT.xs, marginTop: SPACING.xs, fontFamily: 'monospace' },
  ticketDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  lockIcon: { fontSize: 60, marginBottom: SPACING.base },
  lockTitle: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '800', marginBottom: SPACING.xs },
  lockSub: { color: COLORS.textTertiary, fontSize: FONT.base, marginBottom: SPACING.xl },
  signInBtn: { borderRadius: RADIUS.xl, overflow: 'hidden' },
  signInBtnGrad: { paddingHorizontal: 40, paddingVertical: 16 },
  signInBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT.md },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.base },
  emptyTitle: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '700', marginBottom: SPACING.xs },
  emptySub: { color: COLORS.textTertiary, fontSize: FONT.base, textAlign: 'center', marginBottom: SPACING.xl },
  discoverBtn: {
    backgroundColor: COLORS.primary + '20', paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary,
  },
  discoverText: { color: COLORS.primary, fontWeight: '700', fontSize: FONT.base },
})
