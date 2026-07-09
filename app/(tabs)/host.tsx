import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, FlatList,
  RefreshControl,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/hooks/useAuth'
import { useHostEvents, useCheckIn } from '@/hooks/useEvents'
import { COLORS, SPACING, RADIUS, FONT } from '@/lib/theme'
import QRScanner from '@/components/QRScanner'
import { CreateEventForm } from '@/components/host/CreateEventForm'
import { EventRequests } from '@/components/host/EventRequests'

export default function HostScreen() {
  const { user } = useAuth()
  const { data: myEvents = [], isLoading, refetch } = useHostEvents(user?.id || '')
  const [showForm, setShowForm] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const checkIn = useCheckIn()

  const handleScan = async (qrCode: string): Promise<boolean> => {
    if (!user || checkIn.isPending) return false
    
    try {
      const result = await checkIn.mutateAsync({ qrCode, hostId: user.id })
      Alert.alert(
        'Check-In Success ✅',
        `Welcome, ${result.request.userName}!\nEntry granted for ${result.event.title}.`
      )
      setShowScanner(false)
      await refetch()
      return true
    } catch (e: any) {
      Alert.alert('Entry Denied ❌', e.message || 'Invalid ticket')
      return false
    }
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.center]}>
        <LinearGradient colors={['#0A0A0F', '#0A0A0F']} style={StyleSheet.absoluteFillObject} />
        <Text style={styles.lockIcon}>🔐</Text>
        <Text style={styles.lockTitle}>Sign in to Host</Text>
        <Text style={styles.lockSub}>Create and manage your own events</Text>
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

  if (showForm) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0A0A0F', '#0A0A0F']} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <CreateEventForm onClose={() => setShowForm(false)} />
        </SafeAreaView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D0B16', '#0A0A0F']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Host Dashboard</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.scanBtn} onPress={() => setShowScanner(true)}>
              <Ionicons name="qr-code-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(true)}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.accent]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.newBtnGrad}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.newBtnText}>New Event</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={myEvents}
          keyExtractor={e => e.id}
          renderItem={({ item }) => <EventRequests event={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyHost}>
              <Text style={styles.emptyIcon}>🎪</Text>
              <Text style={styles.emptyTitle}>No events yet</Text>
              <Text style={styles.emptySub}>Tap New Event to create your first event</Text>
            </View>
          }
        />
      </SafeAreaView>

      <QRScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.base,
  },
  screenTitle: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '800' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  scanBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  newBtn: { borderRadius: RADIUS.full, overflow: 'hidden' },
  newBtnGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 10, gap: 4 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT.sm },
  listContent: { padding: SPACING.xl, paddingBottom: 100 },
  lockIcon: { fontSize: 60, marginBottom: SPACING.base },
  lockTitle: { color: COLORS.textPrimary, fontSize: FONT.xl, fontWeight: '800', marginBottom: SPACING.xs },
  lockSub: { color: COLORS.textTertiary, fontSize: FONT.base, marginBottom: SPACING.xl },
  signInBtn: { borderRadius: RADIUS.xl, overflow: 'hidden' },
  signInBtnGrad: { paddingHorizontal: 40, paddingVertical: 16 },
  signInBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT.md },
  emptyHost: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.base },
  emptyTitle: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '700', marginBottom: SPACING.xs },
  emptySub: { color: COLORS.textTertiary, fontSize: FONT.base, textAlign: 'center' },
})
