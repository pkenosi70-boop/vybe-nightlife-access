import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/hooks/useAuth'
import { useUserRequests } from '@/hooks/useEvents'
import { useNotifications } from '@/hooks/useNotifications'
import { COLORS, SPACING, RADIUS, FONT } from '@/lib/theme'
import { blink } from '@/lib/blink'

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + '30' }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function SettingRow({ icon, label, onPress, destructive = false }: {
  icon: any; label: string; onPress: () => void; destructive?: boolean
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <View style={[styles.settingIcon, destructive && styles.settingIconDest]}>
        <Ionicons name={icon} size={18} color={destructive ? COLORS.denied : COLORS.primary} />
      </View>
      <Text style={[styles.settingLabel, destructive && styles.settingLabelDest]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
    </TouchableOpacity>
  )
}

export default function ProfileScreen() {
  const { user, signOut, isLoading } = useAuth()
  const { data: requests = [] } = useUserRequests(user?.id || '')
  const { data: notifications = [] } = useNotifications(user?.id || '')
  const [signingOut, setSigningOut] = useState(false)

  const approved = requests.filter(r => r.status === 'approved').length
  const pending = requests.filter(r => r.status === 'pending').length
  const attended = approved // simplified

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true)
          try {
            await signOut()
            router.replace('/(tabs)')
          } catch (e) {
            setSigningOut(false)
          }
        },
      },
    ])
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    )
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.center]}>
        <LinearGradient colors={['#0A0A0F', '#0A0A0F']} style={StyleSheet.absoluteFillObject} />
        <Text style={styles.lockIcon}>👤</Text>
        <Text style={styles.lockTitle}>Your Profile</Text>
        <Text style={styles.lockSub}>Sign in to view your profile and manage events</Text>
        <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/auth')}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.accent]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.signInBtnGrad}
          >
            <Text style={styles.signInBtnText}>Sign In</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.createAccountBtn}
          onPress={() => router.push('/auth')}
        >
          <Text style={styles.createAccountText}>Create an account</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const initial = (user.displayName || user.email || 'V')[0].toUpperCase()

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D0B16', '#0A0A0F']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <LinearGradient
            colors={[COLORS.primary + '30', COLORS.accent + '20', 'transparent']}
            style={styles.heroGrad}
          >
            <View style={styles.avatarWrap}>
              <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </LinearGradient>
              <View style={styles.onlineDot} />
            </View>
            <Text style={styles.displayName}>{user.displayName || 'VYBE User'}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.vybeTag}>
              <Text style={styles.vybeTagText}>VYBE Member</Text>
            </View>
          </LinearGradient>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard label="Approved" value={approved} color={COLORS.approved} />
            <StatCard label="Pending" value={pending} color={COLORS.warning} />
            <StatCard label="Attended" value={attended} color={COLORS.primary} />
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.settingGroup}>
              <SettingRow
                icon="ticket-outline"
                label="My Tickets"
                onPress={() => router.push('/(tabs)/tickets')}
              />
              <SettingRow
                icon="notifications-outline"
                label="Notifications"
                onPress={() => router.push('/(tabs)/notifications')}
              />
              <SettingRow
                icon="calendar-outline"
                label="My Events"
                onPress={() => router.push('/(tabs)/host')}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App</Text>
            <View style={styles.settingGroup}>
              <SettingRow
                icon="shield-checkmark-outline"
                label="Privacy Policy"
                onPress={() => {}}
              />
              <SettingRow
                icon="document-text-outline"
                label="Terms of Service"
                onPress={() => {}}
              />
              <SettingRow
                icon="help-circle-outline"
                label="Help & Support"
                onPress={() => {}}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.settingGroup}>
              <SettingRow
                icon="log-out-outline"
                label={signingOut ? 'Signing out...' : 'Sign Out'}
                onPress={handleSignOut}
                destructive
              />
            </View>
          </View>

          {/* Version */}
          <Text style={styles.version}>VYBE v1.0.0 · Access the Night</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl },
  heroGrad: { paddingTop: SPACING.xl, paddingBottom: SPACING.xl, alignItems: 'center' },
  avatarWrap: { position: 'relative', marginBottom: SPACING.md },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(139,92,246,0.4)',
  },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  onlineDot: {
    position: 'absolute', bottom: 4, right: 4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.neonGreen,
    borderWidth: 2, borderColor: COLORS.bg,
  },
  displayName: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '800', marginBottom: 4 },
  email: { color: COLORS.textTertiary, fontSize: FONT.base, marginBottom: SPACING.md },
  vybeTag: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.md, paddingVertical: 5,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary + '50',
  },
  vybeTagText: { color: COLORS.primary, fontSize: FONT.xs, fontWeight: '700', letterSpacing: 1 },
  statsRow: {
    flexDirection: 'row', gap: SPACING.sm,
    paddingHorizontal: SPACING.xl, marginTop: SPACING.lg, marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1, backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg, paddingVertical: SPACING.md,
    alignItems: 'center', borderWidth: 1,
  },
  statValue: { fontSize: FONT.xl, fontWeight: '800' },
  statLabel: { color: COLORS.textTertiary, fontSize: FONT.xs, marginTop: 2 },
  section: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.lg },
  sectionTitle: { color: COLORS.textTertiary, fontSize: FONT.xs, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: SPACING.sm },
  settingGroup: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.base, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  settingIcon: {
    width: 34, height: 34, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  settingIconDest: { backgroundColor: COLORS.denied + '15' },
  settingLabel: { flex: 1, color: COLORS.textPrimary, fontSize: FONT.base },
  settingLabelDest: { color: COLORS.denied },
  version: {
    color: COLORS.textMuted, fontSize: FONT.xs,
    textAlign: 'center', paddingVertical: SPACING.xl,
  },
  lockIcon: { fontSize: 60, marginBottom: SPACING.base },
  lockTitle: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '800', marginBottom: SPACING.xs },
  lockSub: { color: COLORS.textTertiary, fontSize: FONT.base, textAlign: 'center', marginBottom: SPACING.xl },
  signInBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: SPACING.md },
  signInBtnGrad: { paddingHorizontal: 60, paddingVertical: 16 },
  signInBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT.md },
  createAccountBtn: { padding: SPACING.md },
  createAccountText: { color: COLORS.primary, fontSize: FONT.base, fontWeight: '600' },
})
