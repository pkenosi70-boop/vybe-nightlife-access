import React, { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, TextInput, ImageBackground, ScrollView, Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useEvents, Event } from '@/hooks/useEvents'
import { useAuth } from '@/hooks/useAuth'
import { useAverageRating } from '@/hooks/useReviews'
import { COLORS, SPACING, RADIUS, FONT, getVibeColor } from '@/lib/theme'
import { SafeAreaView } from 'react-native-safe-area-context'

const FILTERS = ['All', 'Tonight', 'VIP', 'Amapiano', 'Afrohouse', 'Chill']

function VibeTag({ tag }: { tag: string }) {
  const c = getVibeColor(tag)
  return (
    <View style={[styles.tag, { backgroundColor: c.bg }]}>
      <Text style={[styles.tagText, { color: c.text }]}>{tag}</Text>
    </View>
  )
}

function EventCard({ event }: { event: Event }) {
  const tags = event.vibeTags ? event.vibeTags.split(',') : []
  const date = new Date(event.dateTime)
  const dateStr = date.toLocaleDateString('en-ZA', { weekday: 'short', month: 'short', day: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
  const { data: avgRating } = useAverageRating(event.id)

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/event/${event.id}`)}
      activeOpacity={0.85}
    >
      <ImageBackground
        source={{ uri: event.coverImage }}
        style={styles.cardImage}
        imageStyle={{ borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.cardGradient}
        >
          {!Number(event.isPublic) && (
            <View style={styles.privateTag}>
              <Ionicons name="lock-closed" size={10} color={COLORS.warning} />
              <Text style={styles.privateText}>Private</Text>
            </View>
          )}
        </LinearGradient>
      </ImageBackground>

      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{event.title}</Text>
          {Number(avgRating) > 0 && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={10} color={COLORS.accent} />
              <Text style={styles.ratingText}>{avgRating}</Text>
            </View>
          )}
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.textTertiary} />
          <Text style={styles.metaText}>{dateStr} · {timeStr}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={COLORS.textTertiary} />
          <Text style={styles.metaText} numberOfLines={1}>{event.location}</Text>
        </View>

        <View style={styles.cardFooter}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tagRow}>
              {tags.slice(0, 4).map(t => <VibeTag key={t} tag={t.trim()} />)}
            </View>
          </ScrollView>
          <View style={styles.attendeeRow}>
            <Ionicons name="people-outline" size={13} color={COLORS.textTertiary} />
            <Text style={styles.attendeeText}>{event.attendeeCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function DiscoverScreen() {
  const { user } = useAuth()
  const { data: events = [], isLoading, refetch } = useEvents()
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  const filtered = events.filter(e => {
    const matchSearch = !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase())
    const matchFilter = activeFilter === 'All' ||
      (activeFilter === 'Tonight' && isTonight(e.dateTime)) ||
      e.vibeTags?.toLowerCase().includes(activeFilter.toLowerCase())
    return matchSearch && matchFilter
  })

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0D0B16', '#0A0A0F']}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
            <Text style={styles.username}>{user?.displayName || 'Find your vybe'} 🔥</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.accent]}
              style={styles.avatarGrad}
            >
              <Text style={styles.avatarText}>
                {(user?.displayName || 'V')[0].toUpperCase()}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={COLORS.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events, venues..."
            placeholderTextColor={COLORS.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Events list */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <EventCard event={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🌑</Text>
              <Text style={styles.emptyTitle}>No events found</Text>
              <Text style={styles.emptySubtitle}>Check back later or host your own</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  )
}

function isTonight(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: SPACING.base,
  },
  greeting: { color: COLORS.textTertiary, fontSize: FONT.sm },
  username: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '700', marginTop: 2 },
  avatarBtn: {},
  avatarGrad: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: FONT.md, fontWeight: '800' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.full,
    marginHorizontal: SPACING.xl, marginBottom: SPACING.md,
    paddingHorizontal: SPACING.base, paddingVertical: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchIcon: { marginRight: SPACING.sm },
  searchInput: {
    flex: 1, color: COLORS.textPrimary, fontSize: FONT.base,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  filterScroll: { flexGrow: 0 },
  filterContent: { paddingHorizontal: SPACING.xl, gap: SPACING.sm, paddingBottom: SPACING.sm },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary,
  },
  filterText: { color: COLORS.textTertiary, fontSize: FONT.sm, fontWeight: '600' },
  filterTextActive: { color: COLORS.primary },
  list: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    marginBottom: SPACING.base, borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cardImage: { height: 180, justifyContent: 'flex-end' },
  cardGradient: { flex: 1, justifyContent: 'flex-end', padding: SPACING.md },
  privateTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)', alignSelf: 'flex-end',
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.warning + '50',
    marginBottom: 4,
  },
  privateText: { color: COLORS.warning, fontSize: FONT.xs, fontWeight: '700' },
  cardBody: { padding: SPACING.base },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  cardTitle: { color: COLORS.textPrimary, fontSize: FONT.md, fontWeight: '700', flex: 1 },
  ratingBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 2, 
    backgroundColor: COLORS.accent + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  ratingText: { color: COLORS.accent, fontSize: FONT.xs, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  metaText: { color: COLORS.textSecondary, fontSize: FONT.sm },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.sm },
  tagRow: { flexDirection: 'row', gap: SPACING.xs },
  tag: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.sm },
  tagText: { fontSize: FONT.xs, fontWeight: '700' },
  attendeeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  attendeeText: { color: COLORS.textTertiary, fontSize: FONT.xs },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.base },
  emptyTitle: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '700', marginBottom: SPACING.xs },
  emptySubtitle: { color: COLORS.textTertiary, fontSize: FONT.base },
})
