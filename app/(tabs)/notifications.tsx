import React from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications, useMarkAllRead, Notification } from '@/hooks/useNotifications'
import { COLORS, SPACING, RADIUS, FONT } from '@/lib/theme'

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  approved: { icon: 'checkmark-circle', color: COLORS.approved, bg: COLORS.approved + '15' },
  denied: { icon: 'close-circle', color: COLORS.denied, bg: COLORS.denied + '15' },
  request: { icon: 'person-add', color: COLORS.accent, bg: COLORS.accent + '15' },
  info: { icon: 'information-circle', color: COLORS.primary, bg: COLORS.primary + '15' },
}

function NotifCard({ notif }: { notif: Notification }) {
  const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info
  const isRead = Number(notif.isRead) > 0

  return (
    <View style={[styles.card, isRead && styles.cardRead]}>
      <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon} size={22} color={config.color} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, isRead && styles.titleRead]}>{notif.title}</Text>
          {!isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.message} numberOfLines={2}>{notif.message}</Text>
        <Text style={styles.time}>{formatTime(notif.createdAt)}</Text>
      </View>
    </View>
  )
}

export default function NotificationsScreen() {
  const { user } = useAuth()
  const { data: notifications = [], isLoading, refetch } = useNotifications(user?.id || '')
  const markAllRead = useMarkAllRead()

  const handleMarkAllRead = async () => {
    if (user) {
      await markAllRead.mutateAsync(user.id)
    }
  }

  const unreadCount = notifications.filter(n => !Number(n.isRead)).length

  if (!user) {
    return (
      <View style={[styles.container, styles.center]}>
        <LinearGradient colors={['#0A0A0F', '#0A0A0F']} style={StyleSheet.absoluteFillObject} />
        <Text style={styles.lockIcon}>🔔</Text>
        <Text style={styles.lockTitle}>Notifications</Text>
        <Text style={styles.lockSub}>Sign in to get event updates</Text>
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
          <View>
            <Text style={styles.screenTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={styles.unreadCount}>{unreadCount} unread</Text>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markReadBtn}
              onPress={handleMarkAllRead}
              disabled={markAllRead.isPending}
            >
              <Text style={styles.markReadText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={notifications}
          keyExtractor={n => n.id}
          renderItem={({ item }) => <NotifCard notif={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔕</Text>
              <Text style={styles.emptyTitle}>All quiet</Text>
              <Text style={styles.emptySub}>You'll be notified when there are updates to your requests</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  )
}

function formatTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)

  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.base,
  },
  screenTitle: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '800' },
  unreadCount: { color: COLORS.primary, fontSize: FONT.sm, marginTop: 2, fontWeight: '600' },
  markReadBtn: {
    backgroundColor: COLORS.primary + '20', paddingHorizontal: SPACING.md,
    paddingVertical: 8, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.primary + '50',
  },
  markReadText: { color: COLORS.primary, fontSize: FONT.sm, fontWeight: '600' },
  list: { padding: SPACING.xl, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.base, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardRead: { opacity: 0.65 },
  iconWrap: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: 4 },
  title: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '700', flex: 1 },
  titleRead: { fontWeight: '500' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  message: { color: COLORS.textSecondary, fontSize: FONT.sm, lineHeight: 18, marginBottom: 4 },
  time: { color: COLORS.textTertiary, fontSize: FONT.xs },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.base },
  emptyTitle: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '700', marginBottom: SPACING.xs },
  emptySub: { color: COLORS.textTertiary, fontSize: FONT.base, textAlign: 'center', maxWidth: 260 },
  lockIcon: { fontSize: 60, marginBottom: SPACING.base },
  lockTitle: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '800', marginBottom: SPACING.xs },
  lockSub: { color: COLORS.textTertiary, fontSize: FONT.base, marginBottom: SPACING.xl },
  signInBtn: { borderRadius: RADIUS.xl, overflow: 'hidden' },
  signInBtnGrad: { paddingHorizontal: 40, paddingVertical: 16 },
  signInBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT.md },
})
